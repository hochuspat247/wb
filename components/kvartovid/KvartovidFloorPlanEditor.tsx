"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GripVertical,
  LayoutGrid,
  Move,
  MousePointer2,
  Plus,
  RotateCcw,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  clampRoomToCanvas,
  createDefaultRoom,
  createEmptyFloorPlanLayout,
  editorRoomsToLayout,
  layoutToEditorRooms,
  moveRoom,
  resizeRoom,
  syncRoomAreasFromPixels,
  type EditorRoom,
  type ResizeHandle
} from "@/lib/kvartovid/floorPlanEditor";
import { renderFloorPlanSvg } from "@/lib/kvartovid/floorPlanRender";
import type { KvartovidFloorPlanLayout } from "@/types/kvartovid";

type DragState =
  | { mode: "move"; roomId: string; startX: number; startY: number; origin: EditorRoom }
  | { mode: "resize"; roomId: string; handle: ResizeHandle; startX: number; startY: number; origin: EditorRoom };

type KvartovidFloorPlanEditorProps = {
  layout: KvartovidFloorPlanLayout;
  onChange: (payload: { layout: KvartovidFloorPlanLayout; svg: string }) => void;
  showExportPreview?: boolean;
};

const HANDLE_SIZE = 10;

function getSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };
  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x, y: transformed.y };
}

function roomFontSize(room: EditorRoom) {
  return Math.min(18, Math.max(11, Math.floor(Math.min(room.width, room.height) / 8)));
}

export function KvartovidFloorPlanEditor({
  layout,
  onChange,
  showExportPreview = true
}: KvartovidFloorPlanEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const roomsRef = useRef<EditorRoom[]>([]);
  const metaRef = useRef({
    width: layout.width,
    height: layout.height,
    totalArea: layout.totalArea,
    propertyLabel: layout.propertyLabel
  });
  const [rooms, setRooms] = useState<EditorRoom[]>(() => layoutToEditorRooms(layout));
  const [meta, setMeta] = useState({
    width: layout.width,
    height: layout.height,
    totalArea: layout.totalArea,
    propertyLabel: layout.propertyLabel
  });
  const [selectedId, setSelectedId] = useState<string | null>(rooms[0]?.id ?? null);
  const [drag, setDrag] = useState<DragState | null>(null);

  roomsRef.current = rooms;
  metaRef.current = meta;

  const selectedRoom = rooms.find((room) => room.id === selectedId) ?? null;

  const commit = useCallback(
    (nextRooms: EditorRoom[], nextMeta = meta) => {
      const syncedRooms = syncRoomAreasFromPixels(nextRooms, nextMeta.totalArea);
      const nextLayout = editorRoomsToLayout(syncedRooms, {
        width: nextMeta.width,
        height: nextMeta.height,
        totalArea: nextMeta.totalArea,
        propertyLabel: nextMeta.propertyLabel,
        rooms: []
      });

      setRooms(syncedRooms);
      setMeta(nextMeta);
      onChange({ layout: nextLayout, svg: renderFloorPlanSvg(nextLayout) });
    },
    [meta, onChange]
  );

  useEffect(() => {
    if (!drag) return;

    function onPointerMove(event: PointerEvent) {
      const svg = svgRef.current;
      if (!svg || !drag) return;

      const point = getSvgPoint(svg, event.clientX, event.clientY);
      const currentMeta = metaRef.current;

      setRooms((current) =>
        current.map((room) => {
          if (room.id !== drag.roomId) return room;

          const deltaX = point.x - drag.startX;
          const deltaY = point.y - drag.startY;

          if (drag.mode === "move") {
            const moved = moveRoom(drag.origin, deltaX, deltaY, currentMeta.width, currentMeta.height);
            return { ...room, ...moved };
          }

          const resized = resizeRoom(drag.origin, drag.handle, deltaX, deltaY, currentMeta.width, currentMeta.height);
          return { ...room, ...resized };
        })
      );
    }

    function onPointerUp() {
      setDrag(null);
      commit(roomsRef.current, metaRef.current);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [commit, drag]);

  const previewSvg = useMemo(() => {
    const currentLayout = editorRoomsToLayout(rooms, {
      ...meta,
      rooms: []
    });
    return renderFloorPlanSvg(currentLayout);
  }, [meta, rooms]);

  function startDrag(event: React.PointerEvent, state: DragState) {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
    setDrag(state);
    setSelectedId(state.roomId);
  }

  function handleAddRoom() {
    const nextRoom = createDefaultRoom(rooms.length, meta.width, meta.height);
    const nextRooms = [...rooms, nextRoom];
    setSelectedId(nextRoom.id);
    commit(nextRooms, meta);
  }

  function handleReset() {
    if (!window.confirm("Сбросить планировку и начать с чистого листа?")) return;
    const empty = createEmptyFloorPlanLayout(meta.totalArea, meta.propertyLabel);
    const nextRooms = layoutToEditorRooms(empty);
    setSelectedId(nextRooms[0]?.id ?? null);
    commit(nextRooms, {
      width: empty.width,
      height: empty.height,
      totalArea: empty.totalArea,
      propertyLabel: empty.propertyLabel
    });
  }

  function handleDeleteRoom() {
    if (!selectedRoom) return;
    if (rooms.length <= 1) {
      window.alert("Нужна хотя бы одна комната.");
      return;
    }
    if (!window.confirm(`Удалить «${selectedRoom.name}»?`)) return;

    const nextRooms = rooms.filter((room) => room.id !== selectedRoom.id);
    setSelectedId(nextRooms[0]?.id ?? null);
    commit(nextRooms, meta);
  }

  function updateSelectedRoom(patch: Partial<EditorRoom>) {
    if (!selectedRoom) return;

    const nextRooms = rooms.map((room) => {
      if (room.id !== selectedRoom.id) return room;
      const updated = clampRoomToCanvas({ ...room, ...patch }, meta.width, meta.height);
      return { ...room, ...updated };
    });

    commit(nextRooms, meta);
  }

  function updateTotalArea(value: number) {
    const totalArea = Number.isFinite(value) && value > 0 ? Math.round(value) : meta.totalArea;
    const nextMeta = { ...meta, totalArea };
    commit(rooms, nextMeta);
  }

  const handles: Array<{ id: ResizeHandle; x: number; y: number; cursor: string }> = selectedRoom
    ? [
        { id: "nw", x: selectedRoom.x, y: selectedRoom.y, cursor: "nwse-resize" },
        { id: "n", x: selectedRoom.x + selectedRoom.width / 2, y: selectedRoom.y, cursor: "ns-resize" },
        { id: "ne", x: selectedRoom.x + selectedRoom.width, y: selectedRoom.y, cursor: "nesw-resize" },
        {
          id: "e",
          x: selectedRoom.x + selectedRoom.width,
          y: selectedRoom.y + selectedRoom.height / 2,
          cursor: "ew-resize"
        },
        {
          id: "se",
          x: selectedRoom.x + selectedRoom.width,
          y: selectedRoom.y + selectedRoom.height,
          cursor: "nwse-resize"
        },
        {
          id: "s",
          x: selectedRoom.x + selectedRoom.width / 2,
          y: selectedRoom.y + selectedRoom.height,
          cursor: "ns-resize"
        },
        { id: "sw", x: selectedRoom.x, y: selectedRoom.y + selectedRoom.height, cursor: "nesw-resize" },
        { id: "w", x: selectedRoom.x, y: selectedRoom.y + selectedRoom.height / 2, cursor: "ew-resize" }
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-[#0a1210] to-amber-500/5 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Конструктор планировки</p>
              <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted">
                Подгоните схему под реальную квартиру — комнаты, метраж и названия зон.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="border-emerald-500/25 bg-emerald-500/10 text-emerald-100 hover:border-emerald-500/40 hover:bg-emerald-500/15"
              onClick={handleAddRoom}
            >
              <Plus className="h-4 w-4" />
              Комната
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
              С нуля
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Общая площадь, м²
            </label>
            <Input
              type="number"
              min={1}
              value={meta.totalArea}
              onChange={(event) => updateTotalArea(Number(event.target.value))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Тип объекта
            </label>
            <Input
              value={meta.propertyLabel}
              onChange={(event) => commit(rooms, { ...meta, propertyLabel: event.target.value || "Квартира" })}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a1210]/80 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <MousePointer2 className="h-4 w-4 text-amber-400" />
              Холст
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted">
              {meta.propertyLabel} · {meta.totalArea} м² · {rooms.length}{" "}
              {rooms.length === 1 ? "зона" : rooms.length < 5 ? "зоны" : "зон"}
            </span>
          </div>

          <div className="bg-[#eef3f1] p-3 sm:p-4">
            <div className="overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(26,46,40,0.12)]">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${meta.width} ${meta.height}`}
                className="block h-auto w-full touch-none select-none bg-white"
                onPointerDown={() => setSelectedId(null)}
              >
                <rect width="100%" height="100%" fill="#ffffff" />
                <rect
                  x={0}
                  y={0}
                  width={meta.width}
                  height={meta.height}
                  fill="none"
                  stroke="#1a2e28"
                  strokeWidth={6}
                />

                {rooms.map((room) => {
                  const selected = room.id === selectedId;
                  const fontSize = roomFontSize(room);

                  return (
                    <g key={room.id}>
                      <rect
                        x={room.x}
                        y={room.y}
                        width={room.width}
                        height={room.height}
                        fill={selected ? "#fff8eb" : "#f8faf9"}
                        stroke={selected ? "#f59e0b" : "#1a2e28"}
                        strokeWidth={selected ? 4 : 3}
                        className="cursor-move"
                        onPointerDown={(event) => {
                          const point = getSvgPoint(svgRef.current!, event.clientX, event.clientY);
                          startDrag(event, {
                            mode: "move",
                            roomId: room.id,
                            startX: point.x,
                            startY: point.y,
                            origin: room
                          });
                        }}
                      />
                      <text
                        x={room.x + room.width / 2}
                        y={room.y + room.height / 2 - (room.area ? 6 : 0)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={fontSize}
                        fontWeight={700}
                        fill="#102019"
                        pointerEvents="none"
                      >
                        {room.name}
                      </text>
                      {room.area ? (
                        <text
                          x={room.x + room.width / 2}
                          y={room.y + room.height / 2 + fontSize}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={Math.max(10, fontSize - 2)}
                          fill="#4b635c"
                          pointerEvents="none"
                        >
                          {room.area} м²
                        </text>
                      ) : null}
                    </g>
                  );
                })}

                {selectedRoom
                  ? handles.map((handle) => (
                      <rect
                        key={handle.id}
                        x={handle.x - HANDLE_SIZE / 2}
                        y={handle.y - HANDLE_SIZE / 2}
                        width={HANDLE_SIZE}
                        height={HANDLE_SIZE}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth={2}
                        rx={2}
                        style={{ cursor: handle.cursor }}
                        onPointerDown={(event) => {
                          const point = getSvgPoint(svgRef.current!, event.clientX, event.clientY);
                          startDrag(event, {
                            mode: "resize",
                            roomId: selectedRoom.id,
                            handle: handle.id,
                            startX: point.x,
                            startY: point.y,
                            origin: selectedRoom
                          });
                        }}
                      />
                    ))
                  : null}
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 px-4 py-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Move className="h-3.5 w-3.5 text-amber-400" />
              Перетащите комнату
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GripVertical className="h-3.5 w-3.5 text-amber-400" />
              Потяните углы для стен
            </span>
            <span>Площади пересчитываются автоматически</span>
          </div>
        </div>

        <div className="flex flex-col rounded-xl border border-white/10 bg-[#0a1210]/80 shadow-card">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <GripVertical className="h-4 w-4 text-amber-400" />
              {selectedRoom ? selectedRoom.name : "Выберите комнату"}
            </div>
            {selectedRoom?.area ? (
              <p className="mt-0.5 text-xs text-muted">{selectedRoom.area} м² на схеме</p>
            ) : null}
          </div>

          {selectedRoom ? (
            <div className="space-y-3 p-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Название
                </label>
                <Input
                  value={selectedRoom.name}
                  onChange={(event) => updateSelectedRoom({ name: event.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                  Площадь, м²
                </label>
                <Input
                  type="number"
                  min={1}
                  value={selectedRoom.area ?? ""}
                  onChange={(event) =>
                    updateSelectedRoom({
                      area: Math.max(1, Number(event.target.value) || selectedRoom.area || 1)
                    })
                  }
                />
              </div>
              <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleDeleteRoom}>
                <Trash2 className="h-4 w-4" />
                Удалить комнату
              </Button>
            </div>
          ) : (
            <p className="p-4 text-sm text-muted">Нажмите на комнату на схеме или добавьте новую кнопкой выше.</p>
          )}

          <div className="mt-auto border-t border-white/10 p-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">
              Все зоны ({rooms.length})
            </p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1">
              {rooms.map((room) => (
                <li key={room.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      room.id === selectedId
                        ? "border border-amber-500/35 bg-amber-500/12 text-amber-100"
                        : "border border-transparent text-muted hover:border-white/10 hover:bg-white/5 hover:text-ink"
                    }`}
                    onClick={() => setSelectedId(room.id)}
                  >
                    <span className="truncate font-medium">{room.name}</span>
                    {room.area ? <span className="shrink-0 text-xs text-muted">{room.area} м²</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showExportPreview ? (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a1210]/80 shadow-card">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Превью для объявления</p>
            <p className="mt-0.5 text-xs text-muted">Так схема будет выглядеть в карточке на площадках</p>
          </div>
          <div className="bg-[#eef3f1] p-3">
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(previewSvg)}`}
              alt="Превью схемы планировки"
              className="w-full rounded-lg bg-white shadow-[inset_0_0_0_1px_rgba(26,46,40,0.12)]"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
