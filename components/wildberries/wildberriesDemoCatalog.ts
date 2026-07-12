import type { WildberriesCatalogCard } from "@/types/wildberries";

const now = new Date().toISOString();

export const WILDBERRIES_DEMO_CATALOG_CARDS: WildberriesCatalogCard[] = [
  {
    nmId: 184729301,
    vendorCode: "MC-DRYER-01",
    title: "Фен для волос профессиональный 2200 Вт с ионизацией",
    description: "Мощный профессиональный фен с 3 режимами температуры и 2 скоростями обдува.",
    brand: "Avenir Home",
    subjectId: 642,
    subjectName: "Фены для волос",
    photoUrl: null,
    photoCount: 5,
    dimensions: { length: 28, width: 12, height: 22, weightBrutto: 0.65 },
    characteristics: [],
    sizes: [{ techSize: "0", skus: ["4601234567890"] }],
    updatedAt: now,
    createdAt: now,
    inTrash: false
  },
  {
    nmId: 184729302,
    vendorCode: "MC-BLENDER-02",
    title: "Блендер стационарный 1200 Вт, 6 скоростей",
    description: "Стационарный блендер для смузи и коктейлей. Чаша 1,5 л из ударопрочного пластика.",
    brand: "Avenir Kitchen",
    subjectId: 812,
    subjectName: "Блендеры",
    photoUrl: null,
    photoCount: 4,
    dimensions: { length: 20, width: 20, height: 38, weightBrutto: 2.1 },
    characteristics: [],
    sizes: [{ techSize: "0", skus: ["4601234567891"] }],
    updatedAt: now,
    createdAt: now,
    inTrash: false
  },
  {
    nmId: 184729303,
    vendorCode: "MC-LAMP-03",
    title: "Настольная лампа LED с регулировкой яркости",
    description: "Современная LED-лампа с тёплым и холодным светом, сенсорное управление.",
    brand: "Avenir Light",
    subjectId: 1044,
    subjectName: "Настольные лампы",
    photoUrl: null,
    photoCount: 3,
    dimensions: { length: 18, width: 18, height: 45, weightBrutto: 0.9 },
    characteristics: [],
    sizes: [{ techSize: "0", skus: ["4601234567892"] }],
    updatedAt: now,
    createdAt: now,
    inTrash: false
  }
];
