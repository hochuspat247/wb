"use client";

import type { StoryCharacter } from "@/types/storystudio";
import { User, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type CharacterGridProps = {
  characters: StoryCharacter[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onGeneratePortrait: (id: string) => void;
  portraitLoadingId?: string | null;
};

export function CharacterGrid({
  characters,
  selectedId,
  onSelect,
  onGeneratePortrait,
  portraitLoadingId
}: CharacterGridProps) {
  if (!characters.length) {
    return (
      <div className="rounded-card border border-dashed border-white/15 p-8 text-center text-sm text-muted">
        Персонажи появятся после создания истории или генерации нового героя.
      </div>
    );
  }

  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {characters.map((character) => {
        const selected = selectedId === character.id;
        const imageSrc = character.imageBase64
          ? `data:${character.imageMimeType || "image/png"};base64,${character.imageBase64}`
          : character.imageUrl;

        return (
          <article
            key={character.id}
            onClick={() => onSelect(character.id)}
            className={`group flex cursor-pointer flex-col overflow-hidden rounded-card border transition ${
              selected ? "border-violet bg-violet/10" : "border-white/10 bg-card hover:border-violet/30"
            }`}
          >
            <div className="relative aspect-[3/4] shrink-0 bg-sand">
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc} alt={character.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
                  <User className="h-12 w-12 opacity-40" />
                  <span className="text-xs">Портрет не создан</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <h3 className="font-semibold text-ink">{character.name}</h3>
                <p className="text-xs text-muted">{character.role}</p>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <p className="line-clamp-2 text-sm text-muted">{character.personality}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {character.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-muted">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-4">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled={portraitLoadingId === character.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGeneratePortrait(character.id);
                  }}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {portraitLoadingId === character.id ? "Рисуем..." : "Портрет AI"}
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
