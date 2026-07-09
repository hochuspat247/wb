export type AdminProductId = "marketcard" | "storystudio";

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
    label: "MarketCard AI",
    shortLabel: "MarketCard",
    title: "Аналитика MarketCard AI",
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
    label: "StoryStudio",
    shortLabel: "StoryStudio",
    title: "Аналитика StoryStudio",
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
  }
};

export const ADMIN_PRODUCT_LIST = Object.values(ADMIN_PRODUCTS);

export function isAdminProductId(value: string | null | undefined): value is AdminProductId {
  return value === "marketcard" || value === "storystudio";
}

export function resolveAdminProduct(value: string | null | undefined): AdminProduct {
  return isAdminProductId(value) ? ADMIN_PRODUCTS[value] : ADMIN_PRODUCTS.marketcard;
}

export function belongsToAdminProduct(path: string, product: AdminProductId) {
  const pathname = path.split("#")[0] || path;
  if (product === "storystudio") {
    return pathname === "/storystudio" || pathname.startsWith("/storystudio/");
  }
  return !pathname.startsWith("/storystudio");
}
