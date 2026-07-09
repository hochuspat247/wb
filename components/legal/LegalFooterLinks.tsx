import Link from "next/link";
import { LEGAL_DOCUMENTS } from "@/lib/legal/routes";

type LegalFooterLinksProps = {
  className?: string;
  linkClassName?: string;
  separator?: string;
};

export function LegalFooterLinks({
  className = "flex flex-wrap items-center gap-x-3 gap-y-1",
  linkClassName = "transition hover:underline",
  separator = "·"
}: LegalFooterLinksProps) {
  return (
    <nav aria-label="Юридические документы" className={className}>
      {LEGAL_DOCUMENTS.map((doc, index) => (
        <span className="inline-flex items-center gap-3" key={doc.slug}>
          {index > 0 ? <span aria-hidden>{separator}</span> : null}
          <Link className={linkClassName} href={doc.href}>
            {doc.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
