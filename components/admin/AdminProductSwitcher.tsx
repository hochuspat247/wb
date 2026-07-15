"use client";

import type { AdminProductId } from "@/lib/admin/products";
import { ADMIN_PRODUCT_LIST } from "@/lib/admin/products";

type Props = {
  value: AdminProductId;
  onChange: (product: AdminProductId) => void;
};

export function AdminProductSwitcher({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-button border border-clay bg-paper/60 p-1">
      {ADMIN_PRODUCT_LIST.map((product) => {
        const active = product.id === value;
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onChange(product.id)}
            className={`rounded-button px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
              active ? "bg-accent text-on-accent" : "text-muted hover:text-ink"
            }`}
          >
            {product.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
