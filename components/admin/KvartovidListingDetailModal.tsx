"use client";

import { X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { formatAccountEmail } from "@/lib/auth/email-utils";
import { DEAL_TYPE_LABELS, PROPERTY_TYPE_LABELS } from "@/lib/kvartovid/constants";
import type { KvartovidSavedListing } from "@/types/kvartovid";

export type AdminKvartovidListingDetail = {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userListingsCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  payload: KvartovidSavedListing;
};

function DetailField({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div className="rounded-[14px] border border-clay bg-paper/40 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{String(value)}</p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">{label}</h4>
      <p className="mt-2 whitespace-pre-wrap rounded-[14px] border border-clay bg-paper/40 p-4 text-sm leading-6 text-ink">
        {value}
      </p>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">{label}</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span className="rounded-full border border-clay bg-paper px-3 py-1 text-xs font-semibold text-ink" key={item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function coverSrc(listing: KvartovidSavedListing) {
  if (listing.coverImageBase64) {
    return `data:${listing.coverImageMimeType || "image/png"};base64,${listing.coverImageBase64}`;
  }

  return listing.coverImageUrl ?? null;
}

export function KvartovidListingDetailModal({
  detail,
  loading,
  onClose
}: {
  detail: AdminKvartovidListingDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  if (!detail && !loading) {
    return null;
  }

  const listing = detail?.payload;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm md:items-center">
      <Card className="max-h-[92vh] w-full max-w-6xl overflow-hidden p-0" padding="none">
        <div className="flex items-center justify-between gap-4 border-b border-clay px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-accent-ink">Объявление пользователя</p>
            <h3 className="mt-1 truncate text-lg font-black text-ink">{listing?.title || "Загрузка..."}</h3>
          </div>
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-paper" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="grid min-h-80 place-items-center">
            <Loader label="Загружаем объявление..." />
          </div>
        ) : listing && detail ? (
          <div className="max-h-[calc(92vh-78px)] space-y-8 overflow-y-auto p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <DetailField label="Пользователь" value={detail.userName || "Без имени"} />
              <DetailField
                label="Email"
                value={detail.userEmail ? formatAccountEmail(detail.userEmail) : "Вход через соцсеть — email не указан"}
              />
              <DetailField
                label="Объектов у пользователя"
                value={detail.userListingsCount === 1 ? "1 объект" : `${detail.userListingsCount} объявл.`}
              />
              <DetailField label="Создано" value={new Date(detail.createdAt).toLocaleString("ru-RU")} />
              <DetailField label="Обновлено" value={new Date(detail.updatedAt).toLocaleString("ru-RU")} />
              <DetailField label="ID объявления" value={detail.id} />
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Параметры объекта</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <DetailField label="Сделка" value={DEAL_TYPE_LABELS[listing.dealType]} />
                <DetailField label="Тип" value={PROPERTY_TYPE_LABELS[listing.propertyType]} />
                <DetailField label="Комнат" value={listing.rooms} />
                <DetailField label="Площадь" value={`${listing.area} м²`} />
                <DetailField label="Этаж" value={listing.floor ? `${listing.floor}${listing.totalFloors ? ` / ${listing.totalFloors}` : ""}` : undefined} />
                <DetailField label="Цена" value={listing.price} />
                <DetailField label="Город" value={listing.city} />
                <DetailField label="Район" value={listing.district} />
                <DetailField label="Метро" value={listing.metro} />
                <DetailField label="Фото при генерации" value={listing.photoCount} />
                <DetailField label="Готовность" value={typeof listing.qualityScore === "number" ? `${listing.qualityScore}/100` : undefined} />
                <DetailField label="Водяной знак DEMO" value={listing.watermarkLocked ? "Да" : listing.watermarkLocked === false ? "Нет" : "Не указано"} />
              </div>
            </div>

            <TextBlock label="Универсальный заголовок" value={listing.title} />
            <TextBlock label="Универсальное описание" value={listing.description} />
            <ListBlock label="Преимущества" items={listing.advantages} />
            <ListBlock label="Подсказки по качеству" items={listing.qualityTips} />
            <ListBlock label="Подсветки" items={listing.suggestedHighlights} />

            {listing.platformTexts.length ? (
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Тексты для площадок</h4>
                {listing.platformTexts.map((platform) => (
                  <div className="rounded-[18px] border border-clay bg-paper/40 p-4" key={platform.platform}>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-accent-ink">{platform.label}</p>
                    <TextBlock label="Заголовок" value={platform.title} />
                    <TextBlock label="Описание" value={platform.description} />
                  </div>
                ))}
              </div>
            ) : null}

            {coverSrc(listing) ? (
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Обложка</h4>
                <div className="mt-3 max-w-md overflow-hidden rounded-[18px] border border-clay">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={listing.title} className="w-full object-cover" src={coverSrc(listing)!} />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <DetailField label="Провайдер" value={listing.coverImageProvider} />
                  <DetailField label="Модель" value={listing.coverImageModel} />
                </div>
              </div>
            ) : listing.coverImageError ? (
              <TextBlock label="Ошибка обложки" value={listing.coverImageError} />
            ) : null}

            {listing.floorPlanSvg ? (
              <div>
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-muted">Планировка</h4>
                <div
                  className="mt-3 overflow-auto rounded-[18px] border border-clay bg-white p-4"
                  dangerouslySetInnerHTML={{ __html: listing.floorPlanSvg }}
                />
                {listing.floorPlanLayout ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <DetailField label="Подпись" value={listing.floorPlanLayout.propertyLabel} />
                    <DetailField label="Площадь плана" value={`${listing.floorPlanLayout.totalArea} м²`} />
                    <DetailField label="Комнат в плане" value={listing.floorPlanLayout.rooms.length} />
                  </div>
                ) : null}
              </div>
            ) : listing.floorPlanError ? (
              <TextBlock label="Ошибка планировки" value={listing.floorPlanError} />
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
