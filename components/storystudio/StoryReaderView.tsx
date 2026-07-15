"use client";

import { BRAND } from "@/lib/branding";
import { STORY_GENRES } from "@/lib/storystudio/constants";
import type { StoryMediaAsset, StoryProject } from "@/types/storystudio";

function mediaSrc(asset: StoryMediaAsset) {
  if (asset.imageBase64 && asset.imageMimeType) {
    return `data:${asset.imageMimeType};base64,${asset.imageBase64}`;
  }
  return asset.imageUrl || null;
}

function genreLabel(id: string) {
  return STORY_GENRES.find((genre) => genre.id === id)?.label ?? id;
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
  const genres = story.genres.map(genreLabel).join(" · ") || "История";

  return (
    <article className={`story-reader story-print-sheet ${mode === "print" ? "is-print" : ""} ${className}`}>
      <div className="story-print-ornament story-print-ornament--top" aria-hidden>
        <span />
        <span>✦</span>
        <span />
      </div>

      <header className="story-print-letterhead">
        <div className="story-print-brand">
          <span className="story-print-mark" aria-hidden>
            ✦
          </span>
          <div>
            <p className="story-print-brand-name">{BRAND.storyStudio}</p>
            <p className="story-print-brand-tag">фирменный бланк произведения</p>
          </div>
        </div>
        <p className="story-print-meta">{genres}</p>
      </header>

      <div className="story-print-title-block">
        <h1 className="story-print-title">{story.title}</h1>
        {story.hook && <p className="story-print-hook">{story.hook}</p>}
      </div>

      <div className="story-print-ornament" aria-hidden>
        <span />
        <span>◆</span>
        <span />
      </div>

      {worldMedia.length > 0 && (
        <div className="story-print-media-grid">
          {worldMedia.map((asset) => {
            const src = mediaSrc(asset);
            if (!src) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={asset.id} src={src} alt={asset.title} className="story-print-image" />
            );
          })}
        </div>
      )}

      {story.synopsis && (
        <section className="story-print-section">
          <h2 className="story-print-section-title">Синопсис</h2>
          <p className="story-print-text">{story.synopsis}</p>
        </section>
      )}

      {factMedia.length > 0 && (
        <section className="story-print-section">
          <h2 className="story-print-section-title">Мир</h2>
          {factMedia.map((asset) => {
            const src = mediaSrc(asset);
            return (
              <figure key={asset.id} className="story-print-figure">
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={asset.title} className="story-print-image" />
                )}
                <figcaption>{asset.title}</figcaption>
              </figure>
            );
          })}
        </section>
      )}

      <div className="story-print-chapters">
        {story.chapters.length === 0 ? (
          <p className="story-print-empty">Глав пока нет.</p>
        ) : (
          story.chapters.map((chapter) => {
            const chapterMedia =
              (chapter.mediaAssetId && media.find((m) => m.id === chapter.mediaAssetId)) ||
              media.find((m) => m.kind === "chapter" && m.entityId === chapter.id && m.showInReader);
            const src = chapterMedia ? mediaSrc(chapterMedia) : null;

            return (
              <section key={chapter.id} className="story-print-chapter">
                <h2 className="story-print-chapter-title">
                  <span className="story-print-chapter-num">{chapter.number}</span>
                  {chapter.title}
                </h2>
                {src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={chapterMedia?.title || chapter.title}
                    className="story-print-image story-print-image--chapter"
                  />
                )}
                <div className="story-print-body">{chapter.content}</div>
              </section>
            );
          })
        )}
      </div>

      <footer className="story-print-colophon">
        <div className="story-print-ornament" aria-hidden>
          <span />
          <span>✦</span>
          <span />
        </div>
        <p>
          Создано в {BRAND.storyStudio}
          {story.language ? ` · ${story.language.toUpperCase()}` : ""}
        </p>
        <p className="story-print-colophon-sub">хранит персонажей, мир и главы вашего произведения</p>
      </footer>
    </article>
  );
}
