"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  RELATION_COLORS,
  RELATION_TYPE_OPTIONS,
  defaultRelationLabel,
  findRelationBetween,
  getRelationTypeLabel
} from "@/lib/storystudio/relations";
import type { CharacterRelation, CharacterRelationType, StoryCharacter } from "@/types/storystudio";

const NODE_RADIUS = 28;
const VIEW_SIZE = 400;

type RelationshipTreeProps = {
  characters: StoryCharacter[];
  relations: CharacterRelation[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onUpdate: (payload: { characters: StoryCharacter[]; relations: CharacterRelation[] }) => void;
};

type Point = { x: number; y: number };

type DraftRelation = {
  fromId: string;
  toId: string;
};

type EditorState =
  | { mode: "create"; draft: DraftRelation }
  | { mode: "edit"; relationId: string };

function getSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x, y: transformed.y };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function edgePoints(from: Point, to: Point, radius = NODE_RADIUS) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;

  return {
    x1: from.x + ux * radius,
    y1: from.y + uy * radius,
    x2: to.x - ux * (radius + 6),
    y2: to.y - uy * (radius + 6)
  };
}

function withPositions(characters: StoryCharacter[]) {
  return characters.map((character, index) => ({
    ...character,
    position: character.position ?? defaultPosition(index, characters.length)
  }));
}

function defaultPosition(index: number, total: number): Point {
  const angle = (index / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2;
  const radius = 130;
  return {
    x: VIEW_SIZE / 2 + Math.cos(angle) * radius,
    y: VIEW_SIZE / 2 + Math.sin(angle) * radius
  };
}

export function RelationshipTree({
  characters,
  relations,
  selectedId,
  onSelect,
  onUpdate
}: RelationshipTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [localCharacters, setLocalCharacters] = useState<StoryCharacter[]>(() => withPositions(characters));
  const [localRelations, setLocalRelations] = useState(relations);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorType, setEditorType] = useState<CharacterRelationType>("ally");
  const [editorLabel, setEditorLabel] = useState("");
  const [editorIntensity, setEditorIntensity] = useState(6);
  const [linkFromId, setLinkFromId] = useState<string | null>(null);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    setLocalCharacters(withPositions(characters));
  }, [characters]);

  useEffect(() => {
    setLocalRelations(relations);
  }, [relations]);

  const commit = useCallback(
    (nextCharacters: StoryCharacter[], nextRelations: CharacterRelation[]) => {
      const positioned = withPositions(nextCharacters);
      setLocalCharacters(positioned);
      setLocalRelations(nextRelations);
      onUpdate({ characters: positioned, relations: nextRelations });
    },
    [onUpdate]
  );

  const byId = new Map(localCharacters.map((character) => [character.id, character]));

  function openCreateEditor(fromId: string, toId: string) {
    if (fromId === toId) return;
    if (findRelationBetween(localRelations, fromId, toId)) return;

    setEditor({ mode: "create", draft: { fromId, toId } });
    setEditorType("ally");
    setEditorLabel(defaultRelationLabel("ally"));
    setEditorIntensity(6);
    onSelect(toId);
  }

  function openEditEditor(relation: CharacterRelation) {
    setEditor({ mode: "edit", relationId: relation.id });
    setEditorType(relation.type);
    setEditorLabel(relation.label);
    setEditorIntensity(relation.intensity);
    onSelect(relation.toId);
  }

  function closeEditor() {
    setEditor(null);
    setLinkFromId(null);
    setCursorPoint(null);
  }

  function saveEditor() {
    if (!editor) return;

    const label = editorLabel.trim() || defaultRelationLabel(editorType);

    if (editor.mode === "create") {
      const relation: CharacterRelation = {
        id: crypto.randomUUID(),
        fromId: editor.draft.fromId,
        toId: editor.draft.toId,
        type: editorType,
        label,
        intensity: editorIntensity
      };
      commit(localCharacters, [...localRelations, relation]);
    } else {
      commit(
        localCharacters,
        localRelations.map((relation) =>
          relation.id === editor.relationId
            ? { ...relation, type: editorType, label, intensity: editorIntensity }
            : relation
        )
      );
    }

    closeEditor();
  }

  function deleteEditorRelation() {
    if (!editor || editor.mode !== "edit") return;
    commit(
      localCharacters,
      localRelations.filter((relation) => relation.id !== editor.relationId)
    );
    closeEditor();
  }

  function handlePointerDown(characterId: string, event: React.PointerEvent) {
    if (event.button !== 0) return;
    event.stopPropagation();
    onSelect(characterId);

    const svg = svgRef.current;
    const character = byId.get(characterId);
    if (!svg || !character?.position) return;

    const point = getSvgPoint(svg, event.clientX, event.clientY);

    if (event.shiftKey) {
      setLinkFromId(characterId);
      setCursorPoint(point);
      setDraggingId(null);
      return;
    }

    setDraggingId(characterId);
    dragOffsetRef.current = {
      x: point.x - character.position.x,
      y: point.y - character.position.y
    };
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  }

  function handleSvgPointerMove(event: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return;

    const point = getSvgPoint(svg, event.clientX, event.clientY);

    if (linkFromId) {
      setCursorPoint(point);
      return;
    }

    if (!draggingId) return;

    const nextCharacters = localCharacters.map((character) =>
      character.id === draggingId
        ? {
            ...character,
            position: {
              x: clamp(point.x - dragOffsetRef.current.x, NODE_RADIUS + 8, VIEW_SIZE - NODE_RADIUS - 8),
              y: clamp(point.y - dragOffsetRef.current.y, NODE_RADIUS + 8, VIEW_SIZE - NODE_RADIUS - 8)
            }
          }
        : character
    );
    setLocalCharacters(nextCharacters);
  }

  function handleSvgPointerUp(event: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return;

    if (linkFromId) {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const targetId = target?.closest("[data-character-id]")?.getAttribute("data-character-id");
      if (targetId && targetId !== linkFromId) {
        openCreateEditor(linkFromId, targetId);
      }
      setLinkFromId(null);
      setCursorPoint(null);
      return;
    }

    if (draggingId) {
      commit(localCharacters, localRelations);
      setDraggingId(null);
    }
  }

  function handleRelationPointerDown(relationId: string, event: React.PointerEvent) {
    event.stopPropagation();
    const relation = localRelations.find((item) => item.id === relationId);
    if (relation) openEditEditor(relation);
  }

  if (!localCharacters.length) {
    return (
      <div className="flex h-80 items-center justify-center rounded-card border border-dashed border-white/15 text-sm text-muted">
        Дерево связей появится вместе с персонажами
      </div>
    );
  }

  const linkFrom = linkFromId ? byId.get(linkFromId) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-white/10 bg-[#0d0a16] p-3 sm:p-4">
        <p className="mb-3 text-xs text-muted sm:text-sm">
          <span className="sm:hidden">Потяните героя. Долгое нажатие + перетаскивание — связь. Клик по стрелке — редактирование.</span>
          <span className="hidden sm:inline">
            Перетащите персонажа, чтобы расставить на карте. Зажмите{" "}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-ink">Shift</kbd> и потяните стрелку к другому
            герою, чтобы создать связь. Клик по стрелке — редактирование.
          </span>
        </p>

        <div className="-mx-1 overflow-x-auto sm:mx-0">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          className="mx-auto h-[min(18rem,70vw)] w-full min-w-[280px] max-w-lg touch-none select-none sm:h-[22rem]"
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerLeave={() => {
            if (draggingId) {
              commit(localCharacters, localRelations);
              setDraggingId(null);
            }
            setLinkFromId(null);
            setCursorPoint(null);
          }}
        >
          <defs>
            {RELATION_TYPE_OPTIONS.map((option) => (
              <marker
                key={option.value}
                id={`arrow-${option.value}`}
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill={RELATION_COLORS[option.value]} />
              </marker>
            ))}
            <filter id="relation-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {localRelations.map((relation) => {
            const from = byId.get(relation.fromId);
            const to = byId.get(relation.toId);
            if (!from?.position || !to?.position) return null;

            const color = RELATION_COLORS[relation.type];
            const edge = edgePoints(from.position, to.position);
            const midX = (edge.x1 + edge.x2) / 2;
            const midY = (edge.y1 + edge.y2) / 2;
            const selected = editor?.mode === "edit" && editor.relationId === relation.id;

            return (
              <g
                key={relation.id}
                className="cursor-pointer"
                onPointerDown={(event) => handleRelationPointerDown(relation.id, event)}
              >
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={color}
                  strokeWidth={selected ? Math.max(2.5, relation.intensity / 3) : Math.max(1.5, relation.intensity / 4)}
                  strokeOpacity={selected ? 1 : 0.75}
                  markerEnd={`url(#arrow-${relation.type})`}
                  filter={selected ? "url(#relation-glow)" : undefined}
                />
                <text x={midX} y={midY - 8} textAnchor="middle" className="fill-muted text-[9px]">
                  {getRelationTypeLabel(relation.type)}
                </text>
                {relation.label && (
                  <text x={midX} y={midY + 6} textAnchor="middle" className="fill-ink text-[8px] opacity-80">
                    {relation.label.slice(0, 28)}
                  </text>
                )}
              </g>
            );
          })}

          {linkFrom?.position && cursorPoint && (
            <line
              x1={linkFrom.position.x}
              y1={linkFrom.position.y}
              x2={cursorPoint.x}
              y2={cursorPoint.y}
              stroke="#8C7BFF"
              strokeWidth={2}
              strokeDasharray="6 4"
              pointerEvents="none"
            />
          )}

          {localCharacters.map((character) => {
            const pos = character.position ?? { x: VIEW_SIZE / 2, y: VIEW_SIZE / 2 };
            const selected = selectedId === character.id;
            const linking = linkFromId === character.id;
            const imageSrc = character.imageBase64
              ? `data:${character.imageMimeType || "image/png"};base64,${character.imageBase64}`
              : character.imageUrl;

            return (
              <g
                key={character.id}
                data-character-id={character.id}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => handlePointerDown(character.id, event)}
                filter={selected || linking ? "url(#relation-glow)" : undefined}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={selected || linking ? 34 : 28}
                  fill={selected || linking ? "#8C7BFF33" : "#171C26"}
                  stroke={selected || linking ? "#8C7BFF" : "#ffffff22"}
                  strokeWidth={selected || linking ? 2.5 : 1.5}
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
                      pointerEvents="none"
                    />
                  </>
                ) : (
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    className="fill-ink text-[11px] font-semibold"
                    pointerEvents="none"
                  >
                    {character.name.slice(0, 1)}
                  </text>
                )}
                <text
                  x={pos.x}
                  y={pos.y + 44}
                  textAnchor="middle"
                  className={`text-[10px] ${selected ? "fill-violet" : "fill-muted"}`}
                  pointerEvents="none"
                >
                  {character.name.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2 text-[11px] text-muted sm:gap-3 sm:text-xs">
          {RELATION_TYPE_OPTIONS.map((option) => (
            <span key={option.value} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: RELATION_COLORS[option.value] }} />
              {option.label}
            </span>
          ))}
        </div>
      </div>

      {editor && (
        <div className="rounded-card border border-violet/30 bg-violet/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Link2 className="h-4 w-4 text-violet" />
            {editor.mode === "create" ? "Новая связь" : "Редактирование связи"}
          </div>

          {editor.mode === "create" && (
            <p className="mb-3 text-sm text-muted">
              {byId.get(editor.draft.fromId)?.name} → {byId.get(editor.draft.toId)?.name}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-muted">
              Тип связи
              <Select
                value={editorType}
                onChange={(event) => {
                  const nextType = event.target.value as CharacterRelationType;
                  setEditorType(nextType);
                  if (!editorLabel.trim() || RELATION_TYPE_OPTIONS.some((option) => option.label === editorLabel)) {
                    setEditorLabel(defaultRelationLabel(nextType));
                  }
                }}
              >
                {RELATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>

            <label className="grid gap-1 text-xs font-semibold text-muted">
              Напряжение: {editorIntensity}/10
              <input
                type="range"
                min={1}
                max={10}
                value={editorIntensity}
                onChange={(event) => setEditorIntensity(Number(event.target.value))}
                className="w-full accent-violet"
              />
            </label>

            <label className="grid gap-1 text-xs font-semibold text-muted sm:col-span-2">
              Описание связи
              <Input
                value={editorLabel}
                onChange={(event) => setEditorLabel(event.target.value)}
                placeholder="Например: тайная вражда под видом дружбы"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="!bg-violet !text-white !border-violet"
              onClick={saveEditor}
            >
              Сохранить связь
            </Button>
            <Button type="button" variant="secondary" onClick={closeEditor}>
              Отмена
            </Button>
            {editor.mode === "edit" && (
              <Button type="button" variant="secondary" onClick={deleteEditorRelation}>
                <Trash2 className="h-4 w-4" />
                Удалить
              </Button>
            )}
          </div>
        </div>
      )}

      {selectedId && byId.get(selectedId) && (
        <div className="rounded-xl border border-violet/20 bg-violet/5 p-3 text-sm">
          <p className="font-semibold text-ink">{byId.get(selectedId)!.name}</p>
          <p className="mt-1 text-muted">{byId.get(selectedId)!.motivation}</p>
        </div>
      )}
    </div>
  );
}
