import type { StaticImageData } from "next/image";
import faceCreamBefore from "@/publick/f0081719-2140-4122-9896-3ad207466049.png";
import steamerBefore from "@/publick/2f992b7f-7f3c-4871-95b5-252897d799cc.png";
import headphonesBefore from "@/publick/hero-demo-headphones.png";

export type HeroDemoExample = {
  id: string;
  label: string;
  description: string;
  image: StaticImageData;
};

export const heroDemoExamples: HeroDemoExample[] = [
  {
    id: "headphones",
    label: "Наушники",
    description: "беспроводные наушники, чёрные, с кейсом",
    image: headphonesBefore
  },
  {
    id: "cosmetics",
    label: "Косметика",
    description: "крем для лица, увлажнение 24 часа, 50 мл",
    image: faceCreamBefore
  },
  {
    id: "home",
    label: "Товар для дома",
    description: "пароочиститель для дома, компактный, 5 насадок",
    image: steamerBefore
  }
];

export async function loadExampleImageDataUrl(image: StaticImageData) {
  const response = await fetch(image.src);
  if (!response.ok) {
    throw new Error("Не удалось загрузить пример.");
  }

  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
