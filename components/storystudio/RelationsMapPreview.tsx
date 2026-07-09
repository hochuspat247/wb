"use client";

import { useRef, useState } from "react";
import { RELATIONS_PREVIEW_PORTRAITS } from "@/lib/storystudio/relationsPreview";

type Point = { x: number; y: number };

type PreviewNode = {
  id: string;
  label: string;
  color: string;
  image: string;
  position: Point;
};

type PreviewEdge = {
  fromId: string;
  toId: string;
  color: string;
  label: string;
  markerId: string;
};

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 260;
const NODE_RADIUS = 30;
const IMAGE_RADIUS = 26;

const INITIAL_NODES: PreviewNode[] = [
  {
    id: "a",
    label: RELATIONS_PREVIEW_PORTRAITS.a.label,
    color: RELATIONS_PREVIEW_PORTRAITS.a.color,
    image: RELATIONS_PREVIEW_PORTRAITS.a.image,
    position: { x: 70, y: 90 }
  },
  {
    id: "b",
    label: RELATIONS_PREVIEW_PORTRAITS.b.label,
    color: RELATIONS_PREVIEW_PORTRAITS.b.color,
    image: RELATIONS_PREVIEW_PORTRAITS.b.image,
    position: { x: 250, y: 70 }
  },
  {
    id: "c",
    label: RELATIONS_PREVIEW_PORTRAITS.c.label,
    color: RELATIONS_PREVIEW_PORTRAITS.c.color,
    image: RELATIONS_PREVIEW_PORTRAITS.c.image,
    position: { x: 160, y: 210 }
  }
];

const EDGES: PreviewEdge[] = [
  { fromId: "a", toId: "b", color: "#ff8fd4", label: "Любовь", markerId: "preview-arrow-lover" },
  { fromId: "a", toId: "c", color: "#ff6b8a", label: "Враг", markerId: "preview-arrow-enemy" },
  { fromId: "b", toId: "c", color: "#ffd56e", label: "Наставник", markerId: "preview-arrow-mentor" }
];

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
    x2: to.x - ux * (radius + 5),
    y2: to.y - uy * (radius + 5)
  };
}

export function RelationsMapPreview() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<Point>({ x: 0, y: 0 });

  const byId = new Map(nodes.map((node) => [node.id, node]));

  function handlePointerDown(nodeId: string, event: React.PointerEvent) {
    if (event.button !== 0) return;
    event.stopPropagation();

    const svg = svgRef.current;
    const node = byId.get(nodeId);
    if (!svg || !node) return;

    const point = getSvgPoint(svg, event.clientX, event.clientY);
    setDraggingId(nodeId);
    dragOffsetRef.current = {
      x: point.x - node.position.x,
      y: point.y - node.position.y
    };
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent) {
    if (!draggingId) return;

    const svg = svgRef.current;
    if (!svg) return;

    const point = getSvgPoint(svg, event.clientX, event.clientY);

    setNodes((prev) =>
      prev.map((node) =>
        node.id === draggingId
          ? {
              ...node,
              position: {
                x: clamp(point.x - dragOffsetRef.current.x, NODE_RADIUS + 8, VIEW_WIDTH - NODE_RADIUS - 8),
                y: clamp(point.y - dragOffsetRef.current.y, NODE_RADIUS + 8, VIEW_HEIGHT - NODE_RADIUS - 8)
              }
            }
          : node
      )
    );
  }

  function handlePointerUp() {
    setDraggingId(null);
  }

  return (
    <div className="relative mx-auto w-full max-w-md overflow-hidden">
      <div className="relative rounded-card border border-white/10 bg-[#0a0812]/80 p-3 backdrop-blur-sm sm:p-4">
        <div className="absolute left-3 top-3 z-10 rounded-full border border-violet/30 bg-violet/15 px-2.5 py-1 text-[10px] font-semibold text-violet sm:left-4 sm:top-4 sm:px-3 sm:text-xs">
          Drag & drop
        </div>
        <p className="mb-3 pt-8 text-center text-[11px] font-semibold uppercase tracking-wider text-muted sm:text-xs">
          Интерактивная карта · потяните героя
        </p>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="h-auto w-full touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <defs>
            {nodes.map((node) => (
              <clipPath key={`clip-${node.id}`} id={`preview-clip-${node.id}`}>
                <circle cx={node.position.x} cy={node.position.y} r={IMAGE_RADIUS} />
              </clipPath>
            ))}

            {EDGES.map((edge) => (
              <marker
                key={edge.markerId}
                id={edge.markerId}
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <path d="M0,0 L7,3.5 L0,7 Z" fill={edge.color} />
              </marker>
            ))}
          </defs>

          {EDGES.map((edge) => {
            const from = byId.get(edge.fromId);
            const to = byId.get(edge.toId);
            if (!from || !to) return null;

            const line = edgePoints(from.position, to.position);
            const midX = (line.x1 + line.x2) / 2;
            const midY = (line.y1 + line.y2) / 2;

            return (
              <g key={`${edge.fromId}-${edge.toId}`}>
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={edge.color}
                  strokeWidth={2}
                  strokeOpacity={0.85}
                  markerEnd={`url(#${edge.markerId})`}
                />
                <text x={midX} y={midY - 6} textAnchor="middle" className="fill-muted text-[10px]">
                  {edge.label}
                </text>
              </g>
            );
          })}

          {nodes.map((node) => {
            const dragging = draggingId === node.id;
            const radius = dragging ? 34 : NODE_RADIUS;

            return (
              <g
                key={node.id}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(event) => handlePointerDown(node.id, event)}
              >
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={radius}
                  fill={dragging ? "#8C7BFF22" : "#171C26"}
                  stroke={node.color}
                  strokeWidth={dragging ? 2.5 : 2}
                />
                <image
                  href={node.image}
                  x={node.position.x - IMAGE_RADIUS}
                  y={node.position.y - IMAGE_RADIUS}
                  width={IMAGE_RADIUS * 2}
                  height={IMAGE_RADIUS * 2}
                  clipPath={`url(#preview-clip-${node.id})`}
                  preserveAspectRatio="xMidYMid slice"
                  pointerEvents="none"
                />
                <text
                  x={node.position.x}
                  y={node.position.y + 46}
                  textAnchor="middle"
                  className="fill-muted text-[10px]"
                  pointerEvents="none"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[10px] text-muted sm:gap-2">
          <span className="rounded-full border border-white/10 px-2 py-0.5 sm:px-2 sm:py-1">Союзник</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 sm:px-2 sm:py-1">Любовь</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 sm:px-2 sm:py-1">Враг</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 sm:px-2 sm:py-1">Семья</span>
        </div>
      </div>
    </div>
  );
}
