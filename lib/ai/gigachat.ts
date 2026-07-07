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

function getGigaChatConfig() {
  return {
    authKey: process.env.GIGACHAT_AUTH_KEY,
    scope: process.env.GIGACHAT_SCOPE || "GIGACHAT_API_PERS",
    model: process.env.GIGACHAT_MODEL || "GigaChat",
    oauthUrl: process.env.GIGACHAT_OAUTH_URL || "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
    chatUrl: process.env.GIGACHAT_CHAT_URL || "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
  };
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

  const response = await fetch(config.oauthUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      RqUID: crypto.randomUUID(),
      Authorization: `Basic ${config.authKey}`
    },
    body: new URLSearchParams({ scope: config.scope }),
    signal: AbortSignal.timeout(15_000)
  });

  if (!response.ok) {
    throw new Error(`GigaChat OAuth error ${response.status}`);
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
    expiresAt: data.expires_at && data.expires_at > now ? data.expires_at : now + 29 * 60_000
  };

  return cachedToken.accessToken;
}

export async function callGigaChatJson(prompt: string, options: GigaChatOptions = {}) {
  const config = getGigaChatConfig();
  const accessToken = await getGigaChatAccessToken();

  const response = await fetch(config.chatUrl, {
    method: "POST",
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
    }),
    signal: AbortSignal.timeout(options.signalMs ?? 30_000)
  });

  if (!response.ok) {
    throw new Error(`GigaChat chat error ${response.status}`);
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
