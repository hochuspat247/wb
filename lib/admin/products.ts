import { BRAND } from "@/lib/branding";

export type AdminProductId = "marketcard" | "storystudio" | "kvartovid";

export type AdminProduct = {
  id: AdminProductId;
  label: string;
  shortLabel: string;
  title: string;
  description: string;
  pathPrefix: string;
  defaultHeatmapPath: string;
  heatmapPaths: string[];
  journeyZones: { id: string; label: string }[];
};

export const ADMIN_PRODUCTS: Record<AdminProductId, AdminProduct> = {
  marketcard: {
    id: "marketcard",
    label: BRAND.marketCard,
    shortLabel: BRAND.marketCardShort,
    title: `Аналитика ${BRAND.marketCard}`,
    description: "Карточки товаров, демо и видео",
    pathPrefix: "/",
    defaultHeatmapPath: "/",
    heatmapPaths: ["/", "/login", "/register", "/cabinet"],
    journeyZones: [
      { id: "/", label: "Главная" },
      { id: "/login", label: "Вход" },
      { id: "/register", label: "Регистрация" },
      { id: "/cabinet", label: "Кабинет" },
      { id: "/admin", label: "Админка" },
      { id: "/generations", label: "Демо" }
    ]
  },
  storystudio: {
    id: "storystudio",
    label: BRAND.storyStudio,
    shortLabel: BRAND.storyStudio,
    title: `Аналитика ${BRAND.storyStudio}`,
    description: "Истории, персонажи и видео-серии",
    pathPrefix: "/storystudio",
    defaultHeatmapPath: "/storystudio",
    heatmapPaths: ["/storystudio", "/storystudio/create", "/storystudio/cabinet"],
    journeyZones: [
      { id: "/storystudio", label: "Лендинг" },
      { id: "/storystudio/create", label: "Создание" },
      { id: "/storystudio/cabinet", label: "Кабинет" },
      { id: "/login", label: "Вход" },
      { id: "/register", label: "Регистрация" }
    ]
  },
  kvartovid: {
    id: "kvartovid",
    label: BRAND.kvartovid,
    shortLabel: BRAND.kvartovid,
    title: `Аналитика ${BRAND.kvartovid}`,
    description: "Объявления о недвижимости, обложки и тексты",
    pathPrefix: "/kvartovid",
    defaultHeatmapPath: "/kvartovid",
    heatmapPaths: ["/kvartovid", "/kvartovid/create", "/kvartovid/cabinet"],
    journeyZones: [
      { id: "/kvartovid", label: "Лендинг" },
      { id: "/kvartovid/create", label: "Создание" },
      { id: "/kvartovid/cabinet", label: "Кабинет" },
      { id: "/login", label: "Вход" },
      { id: "/register", label: "Регистрация" }
    ]
  }
};

export const ADMIN_PRODUCT_LIST = Object.values(ADMIN_PRODUCTS);

export function isAdminProductId(value: string | null | undefined): value is AdminProductId {
  return value === "marketcard" || value === "storystudio" || value === "kvartovid";
}

export function resolveAdminProduct(value: string | null | undefined): AdminProduct {
  return isAdminProductId(value) ? ADMIN_PRODUCTS[value] : ADMIN_PRODUCTS.marketcard;
}

export function belongsToAdminProduct(path: string, product: AdminProductId) {
  const pathname = path.split("#")[0] || path;
  if (product === "storystudio") {
    return pathname === "/storystudio" || pathname.startsWith("/storystudio/");
  }
  if (product === "kvartovid") {
    return pathname === "/kvartovid" || pathname.startsWith("/kvartovid/");
  }
  return !pathname.startsWith("/storystudio") && !pathname.startsWith("/kvartovid");
}
