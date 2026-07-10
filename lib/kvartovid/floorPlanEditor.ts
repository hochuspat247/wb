import type { KvartovidFloorPlanLayout, KvartovidFloorPlanRoom } from "@/types/kvartovid";

export type EditorRoom = KvartovidFloorPlanRoom & { id: string };

export const FLOOR_PLAN_MIN_ROOM = 48;
export const FLOOR_PLAN_DEFAULT_WIDTH = 1000;
export const FLOOR_PLAN_DEFAULT_HEIGHT = 700;

export type ResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

let roomIdCounter = 0;

export function createRoomId() {
  roomIdCounter += 1;
  return `room-${Date.now()}-${roomIdCounter}`;
}

export function createEmptyFloorPlanLayout(
  totalArea = 40,
  propertyLabel = "Квартира"
): KvartovidFloorPlanLayout {
  return {
    width: FLOOR_PLAN_DEFAULT_WIDTH,
    height: FLOOR_PLAN_DEFAULT_HEIGHT,
    totalArea,
    propertyLabel,
    rooms: [
      {
        name: "Комната",
        area: totalArea,
        x: 180,
        y: 120,
        width: 640,
        height: 460
      }
    ]
  };
}

export function layoutToEditorRooms(layout: KvartovidFloorPlanLayout): EditorRoom[] {
  return layout.rooms.map((room, index) => ({
    ...room,
    id: createRoomId() + `-${index}`
  }));
}

export function editorRoomsToLayout(rooms: EditorRoom[], layout: KvartovidFloorPlanLayout): KvartovidFloorPlanLayout {
  return {
    ...layout,
    rooms: rooms.map(({ id: _id, ...room }) => room)
  };
}

export function clampRoomToCanvas(room: KvartovidFloorPlanRoom, canvasWidth: number, canvasHeight: number) {
  const width = Math.max(FLOOR_PLAN_MIN_ROOM, Math.min(room.width, canvasWidth));
  const height = Math.max(FLOOR_PLAN_MIN_ROOM, Math.min(room.height, canvasHeight));
  const x = Math.max(0, Math.min(room.x, canvasWidth - width));
  const y = Math.max(0, Math.min(room.y, canvasHeight - height));

  return { ...room, x, y, width, height };
}

export function syncRoomAreasFromPixels(rooms: EditorRoom[], totalArea: number): EditorRoom[] {
  const totalPixels = rooms.reduce((sum, room) => sum + room.width * room.height, 0);
  if (totalPixels <= 0) return rooms;

  return rooms.map((room) => ({
    ...room,
    area: Math.max(1, Math.round(((room.width * room.height) / totalPixels) * totalArea))
  }));
}

export function createDefaultRoom(index: number, canvasWidth: number, canvasHeight: number): EditorRoom {
  const presets = ["Кухня", "Спальня", "Гостиная", "Санузел", "Прихожая", "Лоджия", "Комната"];
  const width = 220;
  const height = 180;
  const gap = 24;
  const col = index % 3;
  const row = Math.floor(index / 3);

  return {
    id: createRoomId(),
    name: presets[index % presets.length],
    area: 8,
    x: Math.min(gap + col * (width + gap), canvasWidth - width - gap),
    y: Math.min(gap + row * (height + gap), canvasHeight - height - gap),
    width,
    height
  };
}

export function resizeRoom(
  room: KvartovidFloorPlanRoom,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  canvasWidth: number,
  canvasHeight: number
) {
  let { x, y, width, height } = room;

  if (handle.includes("e")) {
    width = Math.max(FLOOR_PLAN_MIN_ROOM, width + deltaX);
  }
  if (handle.includes("w")) {
    const nextWidth = Math.max(FLOOR_PLAN_MIN_ROOM, width - deltaX);
    x += width - nextWidth;
    width = nextWidth;
  }
  if (handle.includes("s")) {
    height = Math.max(FLOOR_PLAN_MIN_ROOM, height + deltaY);
  }
  if (handle.includes("n")) {
    const nextHeight = Math.max(FLOOR_PLAN_MIN_ROOM, height - deltaY);
    y += height - nextHeight;
    height = nextHeight;
  }

  return clampRoomToCanvas({ ...room, x, y, width, height }, canvasWidth, canvasHeight);
}

export function moveRoom(
  room: KvartovidFloorPlanRoom,
  deltaX: number,
  deltaY: number,
  canvasWidth: number,
  canvasHeight: number
) {
  return clampRoomToCanvas(
    {
      ...room,
      x: room.x + deltaX,
      y: room.y + deltaY
    },
    canvasWidth,
    canvasHeight
  );
}
