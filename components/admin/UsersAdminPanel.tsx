"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Loader } from "@/components/ui/Loader";
import { Select } from "@/components/ui/Select";
import { ADMIN_PRODUCT_LIST, type AdminProductId } from "@/lib/admin/products";
import {
  planTierLabel,
  registrationProductLabel,
  registrationProductOriginLabel,
  registrationSourceLabel,
  type RegistrationSource,
  type UserPlanTier
} from "@/lib/auth/registrationMeta";
import {
  AdminUsersApiError,
  fetchAdminUsers,
  type AdminUserListItem,
  type AdminUsersByProduct
} from "@/lib/api/adminUsers";
import { formatAccountEmail, getEmailVerificationLabel } from "@/lib/auth/email-utils";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function tierBadgeClass(tier: UserPlanTier) {
  switch (tier) {
    case "premium":
      return "bg-violet/15 text-violet";
    case "pro":
      return "bg-mint/15 text-mint";
    case "unlimited":
      return "bg-amber-500/15 text-amber-700";
    default:
      return "bg-clay/40 text-muted";
  }
}

function productBadgeClass(product: AdminUserListItem["registrationProduct"]) {
  switch (product) {
    case "storystudio":
      return "bg-violet/10 text-violet";
    case "kvartovid":
      return "bg-cyan/10 text-cyan-700";
    case "marketcard":
      return "bg-accent/10 text-accent";
    default:
      return "bg-clay/30 text-muted";
  }
}

function ProductSummaryCards({ byProduct }: { byProduct: AdminUsersByProduct }) {
  const cards: { id: AdminProductId | "unknown"; count: number }[] = [
    { id: "marketcard", count: byProduct.marketcard },
    { id: "storystudio", count: byProduct.storystudio },
    { id: "kvartovid", count: byProduct.kvartovid },
    { id: "unknown", count: byProduct.unknown }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.id} className="rounded-card border border-clay bg-paper/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Регистрации</p>
          <p className={`mt-2 text-2xl font-black ${card.id === "unknown" ? "text-muted" : "text-ink"}`}>
            {card.count}
          </p>
          <p className={`mt-1 text-sm font-semibold ${productBadgeClass(card.id)} inline-block rounded-full px-2 py-0.5`}>
            {registrationProductLabel(card.id)}
          </p>
        </div>
      ))}
    </div>
  );
}

export function UsersAdminPanel() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [byProduct, setByProduct] = useState<AdminUsersByProduct>({
    marketcard: 0,
    storystudio: 0,
    kvartovid: 0,
    unknown: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [product, setProduct] = useState<AdminProductId | "">("");
  const [source, setSource] = useState<RegistrationSource | "">("");
  const [tier, setTier] = useState<UserPlanTier | "">("");
  const [fromDemo, setFromDemo] = useState<"" | "true" | "false">("");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetchAdminUsers({
        product,
        source,
        tier,
        fromDemo,
        q: query,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        limit: 200
      });
      setUsers(result.users);
      setTotal(result.total);
      setByProduct(result.byProduct);
    } catch (err) {
      setError(err instanceof AdminUsersApiError ? err.message : "Не удалось загрузить пользователей.");
    } finally {
      setLoading(false);
    }
  }, [product, source, tier, fromDemo, query, dateFrom, dateTo]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  return (
    <div className="space-y-4">
      <ProductSummaryCards byProduct={byProduct} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Select value={product} onChange={(event) => setProduct(event.target.value as AdminProductId | "")}>
          <option value="">Все проекты</option>
          {ADMIN_PRODUCT_LIST.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск: email или имя"
        />
        <Select value={source} onChange={(event) => setSource(event.target.value as RegistrationSource | "")}>
          <option value="">Способ входа: все</option>
          <option value="email">Email</option>
          <option value="vk">VK / Mail</option>
          <option value="yandex">Яндекс</option>
        </Select>
        <Select value={tier} onChange={(event) => setTier(event.target.value as UserPlanTier | "")}>
          <option value="">Тариф: все</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium 18+</option>
          <option value="unlimited">Unlimited</option>
        </Select>
        <Select value={fromDemo} onChange={(event) => setFromDemo(event.target.value as "" | "true" | "false")}>
          <option value="">Демо: все</option>
          <option value="true">С демо</option>
          <option value="false">Без демо</option>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} title="С даты" />
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} title="По дату" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <Users size={16} />
          В таблице {users.length} из {total} (после фильтров)
        </span>
        {loading ? <Loader /> : null}
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <div className="grid max-h-[70vh] gap-3 overflow-y-auto md:hidden">
        {users.map((user) => (
          <div className="rounded-card border border-clay bg-paper/40 p-4" key={user.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className={`rounded-full px-2.5 py-1 text-xs font-black ${productBadgeClass(user.registrationProduct)}`}>
                  {registrationProductLabel(user.registrationProduct)}
                </span>
                <p className="mt-2 truncate font-bold text-ink">{user.name || "—"}</p>
                <p className="mt-1 break-all text-sm text-muted">{formatAccountEmail(user.email)}</p>
                <p className="mt-1 text-[11px] text-muted">
                  {registrationProductOriginLabel(user.registrationProductOrigin)}
                </p>
              </div>
              <span className={`shrink-0 rounded-button px-2.5 py-1 text-xs font-black ${tierBadgeClass(user.planTier)}`}>
                {planTierLabel(user.planTier)}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted">Регистрация: {formatDate(user.createdAt)}</p>
          </div>
        ))}
        {!loading && users.length === 0 ? <p className="text-sm text-muted">Пользователи не найдены.</p> : null}
      </div>

      <div className="hidden max-h-[70vh] overflow-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-clay text-muted">
              <th className="px-3 py-2 font-semibold">Проект регистрации</th>
              <th className="px-3 py-2 font-semibold">Пользователь</th>
              <th className="px-3 py-2 font-semibold">Тариф</th>
              <th className="px-3 py-2 font-semibold">Способ входа</th>
              <th className="px-3 py-2 font-semibold">Откуда пришёл</th>
              <th className="px-3 py-2 font-semibold">Демо</th>
              <th className="px-3 py-2 font-semibold">Активность в проектах</th>
              <th className="px-3 py-2 font-semibold">Регистрация</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b border-clay/70 align-top" key={user.id}>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${productBadgeClass(user.registrationProduct)}`}>
                    {registrationProductLabel(user.registrationProduct)}
                  </span>
                  <div className="mt-2 text-[11px] text-muted">
                    {registrationProductOriginLabel(user.registrationProductOrigin)}
                  </div>
                  {user.registrationCallbackUrl ? (
                    <div className="mt-1 max-w-[200px] truncate text-[11px] text-muted" title={user.registrationCallbackUrl}>
                      {user.registrationCallbackUrl}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium text-ink">{user.name || "—"}</div>
                  <div className="text-xs text-muted">{formatAccountEmail(user.email)}</div>
                  <div className="mt-1 text-xs text-muted">{getEmailVerificationLabel(user)}</div>
                </td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-black ${tierBadgeClass(user.planTier)}`}>
                    {planTierLabel(user.planTier)}
                  </span>
                  <div className="mt-2 text-xs text-muted">
                    {user.generationsUsed}/{user.generationCredits} ген.
                  </div>
                </td>
                <td className="px-3 py-3 text-muted">{registrationSourceLabel(user.registrationSource)}</td>
                <td className="px-3 py-3 text-xs text-muted">
                  {user.registrationReferrer ? (
                    <div className="max-w-[180px] truncate" title={user.registrationReferrer}>
                      {user.registrationReferrer}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-3 text-muted">{user.registeredFromDemo ? "Да" : "—"}</td>
                <td className="px-3 py-3 text-xs text-muted">
                  MC: {user.projectCardsCount} карт. · SS: {user.projectStoriesCount} ист. · KV: {user.projectListingsCount}{" "}
                  объявл.
                </td>
                <td className="px-3 py-3 text-muted">{formatDate(user.createdAt)}</td>
              </tr>
            ))}
            {!loading && users.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-muted" colSpan={8}>
                  Пользователи не найдены.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
