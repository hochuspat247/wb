"use client";

import type { StoryMediaAsset, StoryProject } from "@/types/storystudio";

function mediaSrc(asset: StoryMediaAsset) {
  if (asset.imageBase64 && asset.imageMimeType) {
    return `data:${asset.imageMimeType};base64,${asset.imageBase64}`;
  }
  return asset.imageUrl || null;
}

type Props = {
  story: StoryProject;
  mode?: "reader" | "print";
  className?: string;
};

export function StoryReaderView({ story, mode = "reader", className = "" }: Props) {
  const media = story.media ?? [];
  const worldMedia = media.filter((m) => m.kind === "world" && m.showInReader);
  const factMedia = media.filter((m) => m.kind === "fact" && m.showInReader);

  return (
    <article
      className={`story-reader mx-auto max-w-3xl ${mode === "print" ? "print:max-w-none" : ""} ${className}`}
    >
      <header className="mb-8 border-b border-white/10 pb-6 print:border-black/20">
        <p className="text-xs uppercase tracking-[0.2em] text-violet print:text-black/50">
          {story.genres.join(" · ") || "История"}
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink print:text-black sm:text-4xl">
          {story.title}
        </h1>
        {story.hook && (
          <p className="mt-4 text-lg text-muted print:text-black/70">{story.hook}</p>
        )}
      </header>

      {worldMedia.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {worldMedia.map((asset) => {
            const src = mediaSrc(asset);
            if (!src) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={asset.id}
                src={src}
                alt={asset.title}
                className="w-full rounded-xl border border-white/10 object-cover print:border-black/10"
              />
            );
          })}
        </div>
      )}

      {story.synopsis && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet print:text-black">
            Синопсис
          </h2>
          <p className="whitespace-pre-wrap text-base leading-relaxed text-ink/90 print:text-black">
            {story.synopsis}
          </p>
        </section>
      )}

      {factMedia.length > 0 && (
        <section className="mb-10 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-violet print:text-black">
            Мир
          </h2>
          {factMedia.map((asset) => {
            const src = mediaSrc(asset);
            return (
              <figure key={asset.id} className="space-y-2">
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={asset.title}
                    className="w-full rounded-xl border border-white/10 object-cover print:border-black/10"
                  />
                )}
                <figcaption className="text-sm text-muted print:text-black/60">{asset.title}</figcaption>
              </figure>
            );
          })}
        </section>
      )}

      <div className="space-y-12">
        {story.chapters.length === 0 ? (
          <p className="text-muted print:text-black/60">Глав пока нет.</p>
        ) : (
          story.chapters.map((chapter) => {
            const chapterMedia =
              (chapter.mediaAssetId && media.find((m) => m.id === chapter.mediaAssetId)) ||
              media.find((m) => m.kind === "chapter" && m.entityId === chapter.id && m.showInReader);
            const src = chapterMedia ? mediaSrc(chapterMedia) : null;

            return (
              <section key={chapter.id} className="break-inside-avoid">
                <h2 className="mb-4 text-2xl font-semibold text-ink print:text-black">
                  {chapter.number}. {chapter.title}
                </h2>
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={chapterMedia?.title || chapter.title}
                    className="mb-6 w-full rounded-xl border border-white/10 object-cover print:border-black/10"
                  />
                )}
                <div className="whitespace-pre-wrap text-base leading-[1.8] text-ink/90 print:text-black">
                  {chapter.content}
                </div>
              </section>
            );
          })
        )}
      </div>
    </article>
  );
}
