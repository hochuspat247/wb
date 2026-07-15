import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/branding";

type LogoProps = {
  light?: boolean;
  href?: string;
  className?: string;
};

export function Logo({ light = false, href = "/", className = "" }: LogoProps) {
  return (
    <Link className={`group inline-flex items-center gap-2.5 ${className}`.trim()} href={href}>
      <Image
        alt={BRAND.marketCard}
        className="h-9 w-9 shrink-0"
        height={36}
        priority
        src="/logo.png"
        width={36}
      />
      <span className={`font-display text-[15px] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        {BRAND.marketCardShort} <span className={light ? "text-accent" : "text-accent-ink"}>ИИ</span>
      </span>
    </Link>
  );
}
