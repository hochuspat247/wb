const YOOKASSA_API_URL = "https://api.yookassa.ru/v3";

export type YooKassaPayment = {
  id: string;
  status: string;
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  metadata?: Record<string, string>;
};

type CreatePaymentInput = {
  amount: number;
  customerEmail: string;
  credits: number;
  description: string;
  idempotenceKey: string;
  returnUrl: string;
  userId: string;
};

function getCredentials() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error("YOOKASSA_CREDENTIALS_MISSING");
  }

  return { shopId, secretKey };
}

function getAuthHeader() {
  const { shopId, secretKey } = getCredentials();
  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

function formatAmount(value: number) {
  return value.toFixed(2);
}

function getOptionalEnvNumber(name: string) {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return undefined;
  }

  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new Error(`${name}_INVALID`);
  }

  return value;
}

function createReceipt(input: CreatePaymentInput) {
  const description = input.description.slice(0, 128);
  const receipt: {
    customer: { email: string };
    items: Array<{
      amount: { value: string; currency: "RUB" };
      description: string;
      payment_mode: "full_payment";
      payment_subject: "service";
      quantity: string;
      vat_code: number;
    }>;
    tax_system_code?: number;
  } = {
    customer: {
      email: input.customerEmail
    },
    items: [
      {
        amount: {
          value: formatAmount(input.amount),
          currency: "RUB"
        },
        description,
        payment_mode: "full_payment",
        payment_subject: "service",
        quantity: "1.00",
        vat_code: getOptionalEnvNumber("YOOKASSA_RECEIPT_VAT_CODE") ?? 1
      }
    ]
  };

  const taxSystemCode = getOptionalEnvNumber("YOOKASSA_TAX_SYSTEM_CODE");
  if (taxSystemCode) {
    receipt.tax_system_code = taxSystemCode;
  }

  return receipt;
}

async function parseYooKassaResponse<T>(response: Response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = typeof data?.description === "string" ? data.description : "YooKassa request failed";
    throw new Error(message);
  }

  return data as T;
}

export async function createYooKassaPayment(input: CreatePaymentInput) {
  const response = await fetch(`${YOOKASSA_API_URL}/payments`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": input.idempotenceKey
    },
    body: JSON.stringify({
      amount: {
        value: formatAmount(input.amount),
        currency: "RUB"
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: input.returnUrl
      },
      description: input.description.slice(0, 128),
      receipt: createReceipt(input),
      metadata: {
        userId: input.userId,
        credits: String(input.credits)
      }
    }),
    cache: "no-store"
  });

  return parseYooKassaResponse<YooKassaPayment>(response);
}

export async function getYooKassaPayment(paymentId: string) {
  const response = await fetch(`${YOOKASSA_API_URL}/payments/${paymentId}`, {
    headers: {
      Authorization: getAuthHeader()
    },
    cache: "no-store"
  });

  return parseYooKassaResponse<YooKassaPayment>(response);
}
