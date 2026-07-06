import { Sparkles } from "lucide-react";
import Link from "next/link";

type LogoProps = {
  light?: boolean;
  href?: string;
};

export function Logo({ light = false, href = "/" }: LogoProps) {
  return (
    <Link className="group flex items-center gap-3 font-bold" href={href}>
      <span
        className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl transition-transform duration-300 group-hover:scale-105 ${
          light ? "bg-white/10 text-mint" : "bg-ink text-mint shadow-glow-mint"
        }`}
      >
        <span className="absolute inset-0 animate-pulse-glow bg-gradient-to-br from-coral/30 to-violet/30" />
        <Sparkles className="relative z-10" size={18} />
      </span>
      <span className={light ? "text-white" : "text-ink"}>
        MarketCard <span className={light ? "text-mint" : "gradient-text"}>AI</span>
      </span>
    </Link>
  );
}
