import { ImageResponse } from "next/og";
import { StoryStudioBrandIcon } from "@/lib/storystudio/brandIcon";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function StoryStudioAppleIcon() {
  return new ImageResponse(<StoryStudioBrandIcon size={180} />, size);
}
