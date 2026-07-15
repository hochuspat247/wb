import { Cormorant_Garamond, Source_Serif_4 } from "next/font/google";
import { StoryFairyAtmosphere } from "@/components/storystudio/StoryFairyAtmosphere";

const fairyDisplay = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  variable: "--font-fairy-display",
  weight: ["500", "600", "700"]
});

const fairyBody = Source_Serif_4({
  subsets: ["latin", "cyrillic"],
  variable: "--font-fairy-body",
  weight: ["400", "500", "600", "700"]
});

export default function StoryStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`storystudio-theme ${fairyDisplay.variable} ${fairyBody.variable}`}>
      <StoryFairyAtmosphere />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
