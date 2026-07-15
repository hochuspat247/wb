import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCards, wildberriesIntegrations } from "@/lib/db/schema";
import { downloadRemoteImageAsBase64 } from "@/lib/server/remoteImage";
import { hasWildberriesAccess } from "@/lib/server/wildberriesAccess";
import type { ProductCardResult } from "@/types/product-card";
import type {
  WildberriesCardsListQuery,
  WildberriesCardsListResult,
  WildberriesCatalogCard,
  WildberriesPublishInput,
  WildberriesPublishResult,
  WildberriesSlideInput,
  WildberriesSubject,
  WildberriesUpdateInput,
  WildberriesUpdateResult
} from "@/types/wildberries";

const CONTENT_API_PROD = "https://content-api.wildberries.ru";
const CONTENT_API_SANDBOX = "https://content-api-sandbox.wildberries.ru";

type WbIntegrationRow = typeof wildberriesIntegrations.$inferSelect;

type WbCharacteristic = {
  charcID: number;
  name: string;
  required?: boolean;
  unitName?: string;
  maxCount?: number;
  charcType?: number;
};

type WbFetchOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

function getCryptoKey() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "marketcard-wb-dev-secret";
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptToken(token: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getCryptoKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return {
    tokenCiphertext: ciphertext.toString("base64"),
    tokenIv: iv.toString("base64"),
    tokenTag: cipher.getAuthTag().toString("base64")
  };
}

function decryptToken(row: WbIntegrationRow) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getCryptoKey(),
    Buffer.from(row.tokenIv, "base64")
  );
  decipher.setAuthTag(Buffer.from(row.tokenTag, "base64"));
  const token = Buffer.concat([
    decipher.update(Buffer.from(row.tokenCiphertext, "base64")),
    decipher.final()
  ]);
  return token.toString("utf8");
}

function getContentApiBase(isSandbox: boolean) {
  return isSandbox ? CONTENT_API_SANDBOX : CONTENT_API_PROD;
}

function normalizeText(value?: string | null) {
  return (value || "").trim();
}

function parsePriceRub(value?: string | null) {
  const normalized = normalizeText(value).replace(",", ".");
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const price = Math.round(Number(match[0]));
  return Number.isFinite(price) && price > 0 ? price : undefined;
}

function parseDimensions(value?: string | null) {
  const numbers = normalizeText(value)
    .replace(/,/g, ".")
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter((item) => Number.isFinite(item) && item > 0);

  if (!numbers || numbers.length < 3) return null;

  return {
    length: Math.round(numbers[0]),
    width: Math.round(numbers[1]),
    height: Math.round(numbers[2])
  };
}

function parseWeightKg(value?: string | null) {
  const source = normalizeText(value).replace(",", ".");
  const match = source.match(/\d+(?:\.\d+)?/);
  if (!match) return undefined;

  const numeric = Number(match[0]);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;

  if (/кг|kg/i.test(source)) {
    return Number(numeric.toFixed(3));
  }

  return Number((numeric / 1000).toFixed(3));
}

function makeVendorCode(card: ProductCardResult, override?: string) {
  const source = normalizeText(override) || normalizeText(card.sourceInput?.sellerSku);
  if (source) return source.slice(0, 75);
  return `marketcard-${card.id.slice(0, 16)}`;
}

function getCardWbTexts(card: ProductCardResult) {
  const wb = card.marketplaceText?.platformSpecific?.wildberries;
  return {
    title: normalizeText(wb?.wbName) || normalizeText(card.marketplaceText?.title) || card.title,
    description:
      normalizeText(wb?.wbDescription) ||
      normalizeText(card.marketplaceText?.fullDescription) ||
      card.fullDescription,
    characteristics: wb?.wbCharacteristics?.length
      ? wb.wbCharacteristics
      : card.marketplaceText?.characteristics?.length
        ? card.marketplaceText.characteristics
        : card.characteristics
  };
}

function normalizeCharacteristicName(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, "е");
}

function buildCandidateCharacteristics(card: ProductCardResult) {
  const source = card.sourceInput;
  const wbTexts = getCardWbTexts(card);
  const items = [...(wbTexts.characteristics ?? [])];

  const direct = [
    ["Бренд", source?.brand],
    ["Артикул продавца", source?.sellerSku],
    ["Цвет", source?.color],
    ["Размер", source?.size],
    ["Материал", source?.material],
    ["Комплектация", source?.packageContents]
  ] as const;

  for (const [key, value] of direct) {
    if (normalizeText(value)) items.push({ key, value: normalizeText(value) });
  }

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeText(item.key);
    const value = normalizeText(item.value);
    const id = `${normalizeCharacteristicName(key)}:${value}`;
    if (!key || !value || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function shouldSendArrayValue(name: string) {
  const normalized = normalizeCharacteristicName(name);
  return ["цвет", "страна производства", "комплектация", "материал"].some((item) => normalized.includes(item));
}

function buildCharacteristics(card: ProductCardResult, wbCharacteristics: WbCharacteristic[]) {
  const byName = new Map(
    wbCharacteristics.map((item) => [normalizeCharacteristicName(item.name), item])
  );

  return buildCandidateCharacteristics(card)
    .map((item) => {
      const match = byName.get(normalizeCharacteristicName(item.key));
      if (!match) return null;

      return {
        id: match.charcID,
        value: shouldSendArrayValue(match.name) ? [item.value] : item.value
      };
    })
    .filter((item): item is { id: number; value: string | string[] } => item !== null);
}

async function wbFetch(row: WbIntegrationRow, path: string, options: WbFetchOptions = {}) {
  const token = decryptToken(row);
  const response = await fetch(`${getContentApiBase(row.isSandbox)}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: token,
      "Content-Type": "application/json"
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store"
  });

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok || data?.error) {
    const message =
      data?.errorText ||
      data?.detail ||
      data?.title ||
      data?.message ||
      `WB API вернул HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function getIntegration(userId: string) {
  return db.query.wildberriesIntegrations.findFirst({
    where: eq(wildberriesIntegrations.userId, userId)
  });
}

export async function getWildberriesIntegrationStatus(userId: string) {
  const row = await getIntegration(userId);
  const unlocked = await hasWildberriesAccess(userId);
  return {
    connected: Boolean(row),
    isSandbox: Boolean(row?.isSandbox),
    lastCheckedAt: row?.lastCheckedAt?.toISOString() ?? null,
    lastError: row?.lastError ?? null,
    updatedAt: row?.updatedAt.toISOString() ?? null,
    unlocked
  };
}

export async function saveWildberriesIntegration(userId: string, token: string, isSandbox: boolean) {
  const encrypted = encryptToken(token.trim());
  const now = new Date();

  const values = {
    userId,
    ...encrypted,
    isSandbox,
    lastCheckedAt: now,
    lastError: null,
    createdAt: now,
    updatedAt: now
  };

  await db
    .insert(wildberriesIntegrations)
    .values(values)
    .onConflictDoUpdate({
      target: wildberriesIntegrations.userId,
      set: {
        ...encrypted,
        isSandbox,
        lastCheckedAt: now,
        lastError: null,
        updatedAt: now
      }
    });

  await pingWildberries(userId);
  return getWildberriesIntegrationStatus(userId);
}

export async function removeWildberriesIntegration(userId: string) {
  await db.delete(wildberriesIntegrations).where(eq(wildberriesIntegrations.userId, userId));
}

export async function pingWildberries(userId: string) {
  const row = await getIntegration(userId);
  if (!row) throw new Error("WB API-токен не подключен.");

  try {
    await wbFetch(row, "/ping");
    await db
      .update(wildberriesIntegrations)
      .set({ lastCheckedAt: new Date(), lastError: null, updatedAt: new Date() })
      .where(eq(wildberriesIntegrations.userId, userId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось проверить WB API-токен.";
    await db
      .update(wildberriesIntegrations)
      .set({ lastCheckedAt: new Date(), lastError: message, updatedAt: new Date() })
      .where(eq(wildberriesIntegrations.userId, userId));
    throw error;
  }
}

export async function searchWildberriesSubjects(userId: string, query: string): Promise<WildberriesSubject[]> {
  const row = await getIntegration(userId);
  if (!row) throw new Error("WB API-токен не подключен.");

  const params = new URLSearchParams({
    locale: "ru",
    limit: "20",
    offset: "0"
  });

  if (query.trim()) {
    params.set("name", query.trim());
  }

  const data = await wbFetch(row, `/content/v2/object/all?${params.toString()}`);
  return Array.isArray(data?.data) ? data.data : [];
}

async function getWildberriesCharacteristics(row: WbIntegrationRow, subjectId: number): Promise<WbCharacteristic[]> {
  const data = await wbFetch(row, `/content/v2/object/charcs/${subjectId}?locale=ru`);
  return Array.isArray(data?.data) ? data.data : [];
}

async function getCardImageBuffer(userId: string, card: ProductCardResult) {
  const row = await db.query.productCards.findFirst({
    where: and(eq(productCards.id, card.id), eq(productCards.userId, userId))
  });

  const payload = row?.payload ?? card;

  if (payload.generatedImageBase64 && payload.generatedImageMimeType) {
    return {
      buffer: Buffer.from(payload.generatedImageBase64, "base64"),
      mimeType: payload.generatedImageMimeType
    };
  }

  if (payload.generatedImageUrl) {
    const downloaded = await downloadRemoteImageAsBase64(payload.generatedImageUrl);
    if (downloaded) {
      return {
        buffer: Buffer.from(downloaded.base64, "base64"),
        mimeType: downloaded.mimeType
      };
    }
  }

  return null;
}

async function getSlideImageBuffer(userId: string, slide: WildberriesSlideInput) {
  if (slide.imageBase64 && slide.imageMimeType) {
    return {
      buffer: Buffer.from(slide.imageBase64, "base64"),
      mimeType: slide.imageMimeType
    };
  }

  if (!slide.cardId) {
    return null;
  }

  const row = await db.query.productCards.findFirst({
    where: and(eq(productCards.id, slide.cardId), eq(productCards.userId, userId))
  });

  if (!row?.payload) {
    return null;
  }

  return getCardImageBuffer(userId, row.payload);
}

async function findNmIdByVendorCode(row: WbIntegrationRow, vendorCode: string, attempts = 8) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const data = await wbFetch(row, "/content/v2/get/cards/list?locale=ru", {
      method: "POST",
      body: {
        settings: {
          sort: { ascending: false },
          filter: { textSearch: vendorCode, withPhoto: -1 },
          cursor: { limit: 20 }
        }
      }
    });

    const cards = Array.isArray(data?.cards) ? data.cards : [];
    const match = cards.find((item: { vendorCode?: string }) => item.vendorCode === vendorCode);

    if (match?.nmID) {
      return Number(match.nmID);
    }

    await new Promise((resolve) => setTimeout(resolve, 2500));
  }

  return null;
}

async function uploadWildberriesMediaFile(
  row: WbIntegrationRow,
  nmId: number,
  photoNumber: number,
  buffer: Buffer,
  mimeType: string
) {
  const formData = new FormData();
  const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  formData.append(
    "uploadfile",
    new Blob([new Uint8Array(buffer)], { type: mimeType }),
    `marketcard-${photoNumber}.${extension}`
  );

  const token = decryptToken(row);
  const response = await fetch(`${getContentApiBase(row.isSandbox)}/content/v3/media/file`, {
    method: "POST",
    headers: {
      Authorization: token,
      "X-Nm-Id": String(nmId),
      "X-Photo-Number": String(photoNumber)
    },
    body: formData,
    cache: "no-store"
  });

  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok || data?.error) {
    const message =
      data?.errorText ||
      data?.detail ||
      data?.message ||
      `WB media upload вернул HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
}

async function uploadWildberriesSlides(
  row: WbIntegrationRow,
  userId: string,
  nmId: number,
  mainCard: ProductCardResult,
  slides: WildberriesSlideInput[] = []
) {
  const buffers: Array<{ buffer: Buffer; mimeType: string }> = [];

  const mainImage = await getCardImageBuffer(userId, mainCard);
  if (mainImage) {
    buffers.push(mainImage);
  }

  for (const slide of slides) {
    const image = await getSlideImageBuffer(userId, slide);
    if (image) {
      buffers.push(image);
    }
  }

  let uploaded = 0;

  for (let index = 0; index < buffers.length; index += 1) {
    await uploadWildberriesMediaFile(row, nmId, index + 1, buffers[index].buffer, buffers[index].mimeType);
    uploaded += 1;
    if (index < buffers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  return uploaded;
}

async function generateBarcode(row: WbIntegrationRow) {
  const data = await wbFetch(row, "/content/v2/barcodes", {
    method: "POST",
    body: { count: 1 }
  });

  const barcode = Array.isArray(data?.data) ? data.data[0] : null;
  if (!barcode) throw new Error("WB не вернул штрихкод для размера.");
  return String(barcode);
}

export async function publishWildberriesCard(
  userId: string,
  input: WildberriesPublishInput
): Promise<WildberriesPublishResult> {
  if (!(await hasWildberriesAccess(userId))) {
    throw new Error("Публикация на Wildberries доступна с тарифа «Комплект для одного товара».");
  }

  const row = await getIntegration(userId);
  if (!row) throw new Error("WB API-токен не подключен.");

  const card = input.card;
  const subjectId = Number(input.subjectId);
  if (!Number.isFinite(subjectId) || subjectId <= 0) {
    throw new Error("Укажите категорию WB.");
  }

  const source = card.sourceInput;
  const dimensions = parseDimensions(input.dimensions || source?.dimensions);
  const weightBrutto = parseWeightKg(input.weight || source?.weight);

  if (!dimensions || !weightBrutto) {
    throw new Error("Для WB нужны габариты в формате 20x15x8 см и вес, например 350 г.");
  }

  const wbTexts = getCardWbTexts(card);
  const wbCharacteristics = await getWildberriesCharacteristics(row, subjectId);
  const barcode = normalizeText(input.barcode) || (await generateBarcode(row));
  const vendorCode = makeVendorCode(card, input.vendorCode);
  const brand =
    normalizeText(input.brand) ||
    normalizeText(source?.brand) ||
    normalizeText(card.marketplaceText?.platformFields?.brand) ||
    "Нет бренда";
  const size = normalizeText(input.techSize) || normalizeText(source?.size) || "0";
  const wbSize = normalizeText(input.wbSize) || normalizeText(source?.size);
  const price = parsePriceRub(input.price || source?.price || card.price);
  const characteristics = buildCharacteristics(card, wbCharacteristics);

  const sizePayload: Record<string, unknown> = {
    techSize: size,
    skus: [barcode]
  };

  if (wbSize) sizePayload.wbSize = wbSize;
  if (price) sizePayload.price = price;

  const payload = [
    {
      subjectID: subjectId,
      variants: [
        {
          vendorCode,
          title: wbTexts.title,
          description: wbTexts.description,
          brand,
          dimensions: {
            ...dimensions,
            weightBrutto
          },
          characteristics,
          sizes: [sizePayload]
        }
      ]
    }
  ];

  const response = await wbFetch(row, "/content/v2/cards/upload", {
    method: "POST",
    body: payload
  });

  const nmId = await findNmIdByVendorCode(row, vendorCode);
  let mediaUploaded = 0;

  if (nmId) {
    mediaUploaded = await uploadWildberriesSlides(row, userId, nmId, card, input.slides ?? []);
  }

  return {
    ok: true,
    vendorCode,
    barcode,
    subjectId,
    nmId,
    mediaUploaded,
    payload,
    response
  };
}

type RawWbCatalogCard = {
  nmID?: number;
  imtID?: number;
  vendorCode?: string;
  title?: string;
  description?: string;
  brand?: string;
  subjectID?: number;
  subjectName?: string;
  photos?: Array<{ big?: string; tm?: string; square?: string; c516x688?: string }>;
  dimensions?: { length?: number; width?: number; height?: number; weightBrutto?: number };
  characteristics?: Array<{ id?: number; name?: string; value?: string | string[] }>;
  sizes?: Array<{ chrtID?: number; techSize?: string; wbSize?: string; skus?: string[] }>;
  updatedAt?: string;
  createdAt?: string;
  trashedAt?: string;
  kizMarked?: boolean;
  needKiz?: boolean;
};

function normalizeCatalogCard(raw: RawWbCatalogCard, inTrash = false): WildberriesCatalogCard | null {
  if (!raw.nmID || !raw.vendorCode) {
    return null;
  }

  const photos = Array.isArray(raw.photos) ? raw.photos : [];
  const photoUrl =
    photos.find((photo) => photo.big)?.big ||
    photos.find((photo) => photo.c516x688)?.c516x688 ||
    photos.find((photo) => photo.square)?.square ||
    photos.find((photo) => photo.tm)?.tm ||
    null;

  return {
    nmId: raw.nmID,
    imtId: raw.imtID,
    vendorCode: raw.vendorCode,
    title: raw.title || "",
    description: raw.description || "",
    brand: raw.brand || "",
    subjectId: raw.subjectID ?? 0,
    subjectName: raw.subjectName || "",
    photoUrl,
    photoCount: photos.filter((photo) => photo.big || photo.tm || photo.square || photo.c516x688).length,
    dimensions:
      raw.dimensions?.length && raw.dimensions?.width && raw.dimensions?.height && raw.dimensions?.weightBrutto
        ? {
            length: raw.dimensions.length,
            width: raw.dimensions.width,
            height: raw.dimensions.height,
            weightBrutto: raw.dimensions.weightBrutto
          }
        : undefined,
    characteristics: (raw.characteristics ?? [])
      .filter((item) => item.id)
      .map((item) => ({
        id: item.id!,
        name: item.name || "",
        value: item.value ?? ""
      })),
    sizes: (raw.sizes ?? []).map((size) => ({
      chrtId: size.chrtID,
      techSize: size.techSize || "0",
      wbSize: size.wbSize,
      skus: size.skus ?? []
    })),
    updatedAt: raw.updatedAt || raw.trashedAt || new Date().toISOString(),
    createdAt: raw.createdAt || raw.updatedAt || raw.trashedAt || new Date().toISOString(),
    inTrash,
    kizMarked: raw.kizMarked,
    needKiz: raw.needKiz
  };
}

async function fetchWildberriesCardsPage(
  row: WbIntegrationRow,
  query: WildberriesCardsListQuery
): Promise<WildberriesCardsListResult> {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const source = query.source ?? "active";
  const path = source === "trash" ? "/content/v2/get/cards/trash?locale=ru" : "/content/v2/get/cards/list?locale=ru";

  const filter: Record<string, unknown> = { withPhoto: -1 };
  if (query.search?.trim()) {
    filter.textSearch = query.search.trim();
  }

  const cursor: Record<string, unknown> = { limit };
  if (query.updatedAt) {
    cursor.updatedAt = query.updatedAt;
  }
  if (query.nmId) {
    cursor.nmID = query.nmId;
  }
  if (source === "trash" && query.updatedAt) {
    cursor.trashedAt = query.updatedAt;
  }

  const data = await wbFetch(row, path, {
    method: "POST",
    body: {
      settings: {
        sort: { ascending: false },
        filter,
        cursor
      }
    }
  });

  const cards = (Array.isArray(data?.cards) ? data.cards : [])
    .map((item: RawWbCatalogCard) => normalizeCatalogCard(item, source === "trash"))
    .filter((item: WildberriesCatalogCard | null): item is WildberriesCatalogCard => item !== null);

  const responseCursor = data?.cursor ?? {};
  const total = Number(responseCursor.total ?? cards.length);

  return {
    cards,
    cursor: {
      updatedAt: responseCursor.updatedAt || responseCursor.trashedAt,
      nmId: responseCursor.nmID,
      total,
      trashedAt: responseCursor.trashedAt
    },
    hasMore: total >= limit
  };
}

export async function listWildberriesCards(
  userId: string,
  query: WildberriesCardsListQuery = {}
): Promise<WildberriesCardsListResult> {
  if (!(await hasWildberriesAccess(userId))) {
    throw new Error("Просмотр карточек WB доступен с тарифа «Комплект для одного товара».");
  }

  const row = await getIntegration(userId);
  if (!row) throw new Error("WB API-токен не подключен.");

  return fetchWildberriesCardsPage(row, query);
}

export async function getWildberriesCatalogCard(userId: string, nmId: number) {
  if (!(await hasWildberriesAccess(userId))) {
    throw new Error("Просмотр карточек WB доступен с тарифа «Комплект для одного товара».");
  }

  const row = await getIntegration(userId);
  if (!row) throw new Error("WB API-токен не подключен.");

  const active = await fetchWildberriesCardsPage(row, {
    search: String(nmId),
    limit: 20,
    source: "active"
  });

  const activeMatch = active.cards.find((card) => card.nmId === nmId);
  if (activeMatch) {
    return activeMatch;
  }

  const trash = await fetchWildberriesCardsPage(row, {
    search: String(nmId),
    limit: 20,
    source: "trash"
  });

  const trashMatch = trash.cards.find((card) => card.nmId === nmId);
  if (trashMatch) {
    return trashMatch;
  }

  throw new Error("Карточка WB не найдена.");
}

export async function updateWildberriesCatalogCard(
  userId: string,
  input: WildberriesUpdateInput
): Promise<WildberriesUpdateResult> {
  if (!(await hasWildberriesAccess(userId))) {
    throw new Error("Редактирование карточек WB доступно с тарифа «Комплект для одного товара».");
  }

  const row = await getIntegration(userId);
  if (!row) throw new Error("WB API-токен не подключен.");

  const current = await getWildberriesCatalogCard(userId, input.nmId);

  const payload = [
    {
      nmID: input.nmId,
      vendorCode: input.vendorCode || current.vendorCode,
      kizMarked: input.kizMarked ?? current.kizMarked ?? false,
      brand: normalizeText(input.brand) || current.brand || "Нет бренда",
      title: normalizeText(input.title) || current.title,
      description: normalizeText(input.description) || current.description,
      dimensions: input.dimensions || current.dimensions,
      characteristics: (input.characteristics.length ? input.characteristics : current.characteristics).map((item) => ({
        id: item.id,
        value: item.value
      })),
      sizes: (input.sizes.length ? input.sizes : current.sizes).map((size) => ({
        chrtID: size.chrtId,
        techSize: size.techSize,
        wbSize: size.wbSize,
        skus: size.skus
      }))
    }
  ];

  const response = await wbFetch(row, "/content/v2/cards/update", {
    method: "POST",
    body: payload
  });

  return {
    ok: true,
    nmId: input.nmId,
    vendorCode: payload[0].vendorCode,
    response
  };
}
