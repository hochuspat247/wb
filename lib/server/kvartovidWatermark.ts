import { addWatermarkToImageBuffer } from "@/lib/server/watermark";

export async function applyDemoWatermarkToCoverBase64(base64: string) {
  const watermarked = await addWatermarkToImageBuffer(Buffer.from(base64, "base64"));

  return {
    base64: watermarked.toString("base64"),
    mimeType: "image/png" as const
  };
}
