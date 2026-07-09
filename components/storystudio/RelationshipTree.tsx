"use client";

import type { CharacterRelation, StoryCharacter } from "@/types/storystudio";

const RELATION_COLORS: Record<CharacterRelation["type"], string> = {
  ally: "#6EDCFF",
  enemy: "#ff6b8a",
  lover: "#ff8fd4",
  family: "#7CFF6B",
  mentor: "#ffd56e",
  rival: "#ff9f43",
  neutral: "#96A0B5"
};

type RelationshipTreeProps = {
  characters: StoryCharacter[];
  relations: CharacterRelation[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
};

export function RelationshipTree({ characters, relations, selectedId, onSelect }: RelationshipTreeProps) {
  if (!characters.length) {
    return (
      <div className="flex h-80 items-center justify-center rounded-card border border-dashed border-white/15 text-sm text-muted">
        Дерево связей появится вместе с персонажами
      </div>
    );
  }

  const byId = new Map(characters.map((c) => [c.id, c]));

  return (
    <div className="overflow-auto rounded-card border border-white/10 bg-[#0d0a16] p-4">
      <svg viewBox="0 0 400 400" className="mx-auto h-80 w-full max-w-md">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {relations.map((relation) => {
          const from = characters.find((c) => c.id === relation.fromId);
          const to = characters.find((c) => c.id === relation.toId);
          if (!from?.position || !to?.position) return null;

          const color = RELATION_COLORS[relation.type];
          const midX = (from.position.x + to.position.x) / 2;
          const midY = (from.position.y + to.position.y) / 2;

          return (
            <g key={relation.id}>
              <line
                x1={from.position.x}
                y1={from.position.y}
                x2={to.position.x}
                y2={to.position.y}
                stroke={color}
                strokeWidth={Math.max(1, relation.intensity / 4)}
                strokeOpacity={0.6}
              />
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                className="fill-muted text-[9px]"
              >
                {relation.label.slice(0, 24)}
              </text>
            </g>
          );
        })}

        {characters.map((character) => {
          const pos = character.position ?? { x: 200, y: 200 };
          const selected = selectedId === character.id;
          const imageSrc = character.imageBase64
            ? `data:${character.imageMimeType || "image/png"};base64,${character.imageBase64}`
            : character.imageUrl;

          return (
            <g
              key={character.id}
              className="cursor-pointer"
              onClick={() => onSelect(character.id)}
              filter={selected ? "url(#glow)" : undefined}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={selected ? 34 : 28}
                fill={selected ? "#8C7BFF33" : "#171C26"}
                stroke={selected ? "#8C7BFF" : "#ffffff22"}
                strokeWidth={selected ? 2.5 : 1.5}
              />
              {imageSrc ? (
                <>
                  <defs>
                    <clipPath id={`clip-${character.id}`}>
                      <circle cx={pos.x} cy={pos.y} r={24} />
                    </clipPath>
                  </defs>
                  <image
                    href={imageSrc}
                    x={pos.x - 24}
                    y={pos.y - 24}
                    width={48}
                    height={48}
                    clipPath={`url(#clip-${character.id})`}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </>
              ) : (
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  className="fill-ink text-[11px] font-semibold"
                >
                  {character.name.slice(0, 1)}
                </text>
              )}
              <text
                x={pos.x}
                y={pos.y + 44}
                textAnchor="middle"
                className={`text-[10px] ${selected ? "fill-violet" : "fill-muted"}`}
              >
                {character.name.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-muted">
        {Object.entries(RELATION_COLORS).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {type}
          </span>
        ))}
      </div>

      {selectedId && byId.get(selectedId) && (
        <div className="mt-4 rounded-xl border border-violet/20 bg-violet/5 p-3 text-sm">
          <p className="font-semibold text-ink">{byId.get(selectedId)!.name}</p>
          <p className="mt-1 text-muted">{byId.get(selectedId)!.motivation}</p>
        </div>
      )}
    </div>
  );
}
