import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import https from "node:https";

type GigaChatToken = {
  accessToken: string;
  expiresAt: number;
};

type GigaChatOptions = {
  temperature?: number;
  maxTokens?: number;
  signalMs?: number;
};

let cachedToken: GigaChatToken | null = null;
let cachedCaBundle: string[] | null | undefined;

function getGigaChatConfig() {
  const authKey = normalizeAuthKey(process.env.GIGACHAT_AUTH_KEY);

  return {
    authKey,
    scope: process.env.GIGACHAT_SCOPE || "GIGACHAT_API_PERS",
    model: process.env.GIGACHAT_MODEL || "GigaChat",
    oauthUrl: process.env.GIGACHAT_OAUTH_URL || "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
    chatUrl: process.env.GIGACHAT_CHAT_URL || "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
  };
}

function normalizeAuthKey(value?: string) {
  return value?.trim().replace(/^Basic\s+/i, "") || "";
}

function getCaBundle() {
  if (cachedCaBundle !== undefined) {
    return cachedCaBundle;
  }

  const certPaths = [
    process.env.GIGACHAT_CA_CERT,
    join(process.cwd(), "certs/russian_trusted_root_ca_pem.crt"),
    join(process.cwd(), "certs/russian_trusted_sub_ca_pem.crt")
  ].filter(Boolean) as string[];

  const certs: string[] = [];

  for (const certPath of certPaths) {
    if (!existsSync(certPath)) {
      continue;
    }

    try {
      certs.push(readFileSync(certPath, "utf8"));
    } catch {
      // Ignore unreadable cert files and continue with the rest.
    }
  }

  cachedCaBundle = certs.length ? certs : null;
  return cachedCaBundle;
}

type GigaChatFetchOptions = RequestInit & {
  signalMs?: number;
};

async function gigaChatFetch(url: string, options: GigaChatFetchOptions = {}) {
  const parsedUrl = new URL(url);
  const ca = getCaBundle();
  const method = options.method || "GET";
  const headers = Object.fromEntries(new Headers(options.headers).entries());
  const body =
    typeof options.body === "string"
      ? options.body
      : options.body instanceof URLSearchParams
        ? options.body.toString()
        : undefined;

  if (body && !headers["Content-Length"]) {
    headers["Content-Length"] = String(Buffer.byteLength(body));
  }

  return new Promise<Response>((resolve, reject) => {
    const request = https.request(
      {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port ? Number(parsedUrl.port) : 443,
        servername: parsedUrl.hostname,
        path: `${parsedUrl.pathname}${parsedUrl.search}`,
        method,
        headers,
        ca: ca ?? undefined,
        rejectUnauthorized: Boolean(ca)
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          const responseBody = Buffer.concat(chunks);
          resolve(
            new Response(responseBody, {
              status: response.statusCode || 500,
              statusText: response.statusMessage,
              headers: response.headers as HeadersInit
            })
          );
        });
      }
    );

    const timeoutMs = options.signalMs ?? 45_000;
    const timeout = setTimeout(() => {
      request.destroy(new Error("GigaChat request timed out"));
    }, timeoutMs);

    request.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    request.on("close", () => {
      clearTimeout(timeout);
    });

    if (options.signal) {
      if (options.signal.aborted) {
        request.destroy(new DOMException("The operation was aborted.", "AbortError"));
        return;
      }

      options.signal.addEventListener(
        "abort",
        () => {
          request.destroy(new DOMException("The operation was aborted.", "AbortError"));
        },
        { once: true }
      );
    }

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

function parseExpiresAt(expiresAt: number | undefined, now: number) {
  if (!expiresAt) {
    return now + 29 * 60_000;
  }

  const milliseconds = expiresAt < 1_000_000_000_000 ? expiresAt * 1000 : expiresAt;
  return milliseconds > now ? milliseconds : now + 29 * 60_000;
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { error?: string; message?: string; error_description?: string };
    return data.error_description || data.error || data.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

async function getGigaChatAccessToken() {
  const now = Date.now();

  if (cachedToken && cachedToken.expiresAt - 60_000 > now) {
    return cachedToken.accessToken;
  }

  const config = getGigaChatConfig();

  if (!config.authKey) {
    throw new Error("GIGACHAT_AUTH_KEY is not set");
  }

  const response = await gigaChatFetch(config.oauthUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      RqUID: crypto.randomUUID(),
      Authorization: `Basic ${config.authKey}`
    },
    body: new URLSearchParams({ scope: config.scope })
  });

  if (!response.ok) {
    throw new Error(`GigaChat OAuth error ${response.status}: ${await readErrorMessage(response)}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_at?: number;
  };

  if (!data.access_token) {
    throw new Error("GigaChat OAuth returned empty access_token");
  }

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: parseExpiresAt(data.expires_at, now)
  };

  return cachedToken.accessToken;
}

export async function callGigaChatJson(prompt: string, options: GigaChatOptions = {}) {
  const config = getGigaChatConfig();
  const accessToken = await getGigaChatAccessToken();

  const response = await gigaChatFetch(config.chatUrl, {
    method: "POST",
    signalMs: options.signalMs ?? 45_000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "Ты возвращаешь только валидный JSON без markdown, пояснений и текста вне JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: options.temperature ?? 0.35,
      max_tokens: options.maxTokens ?? 2200
    })
  });

  if (!response.ok) {
    throw new Error(`GigaChat chat error ${response.status}: ${await readErrorMessage(response)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("GigaChat returned empty response");
  }

  return content;
}
