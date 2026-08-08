import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 3;

type View = { zoom: number; x: number; y: number; tiltX: number; rotateZ: number };

const DEFAULT_VIEW: View = { zoom: 1, x: 0, y: 0, tiltX: 17, rotateZ: 0 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Zoom / pan / 3D-rotate wrapper for the board.
 * Wheel + pinch zoom is cursor-anchored and delta-scaled; drag pans.
 */
export function BoardViewport({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const viewRef = useRef(view);
  viewRef.current = view;
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    const v = viewRef.current;
    const next = clamp(v.zoom * Math.exp(-dy * 0.0018), MIN_ZOOM, MAX_ZOOM);
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;
    const k = next / v.zoom;
    setView({ ...v, zoom: next, x: px - (px - v.x) * k, y: py - (py - v.y) * k });
  }, []);

  const wheelRef = useRef(handleWheel);
  wheelRef.current = handleWheel;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelRef.current(e);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full touch-none overflow-hidden [perspective:2400px]"
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const drag = dragRef.current;
          if (!drag || drag.id !== e.pointerId) return;
          const dx = e.clientX - drag.x;
          const dy = e.clientY - drag.y;
          dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <div
          className="flex h-full w-full items-center justify-center"
          style={{
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom}) rotateX(${view.tiltX}deg) rotateZ(${view.rotateZ}deg)`,
            transformStyle: "preserve-3d",
            transition: dragRef.current ? "none" : "transform 0.08s linear",
          }}
        >
          {children}
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-2 left-2 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/85 px-3 py-2 text-[0.62rem] uppercase tracking-widest backdrop-blur">
        <ZoomButton label="−" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom / 1.2, MIN_ZOOM, MAX_ZOOM) }))} />
        <span className="w-10 text-center tabular-nums text-muted-foreground">{Math.round(view.zoom * 100)}%</span>
        <ZoomButton label="+" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom * 1.2, MIN_ZOOM, MAX_ZOOM) }))} />
        <Slider
          label="Tilt"
          value={view.tiltX}
          min={0}
          max={60}
          onChange={(tiltX) => setView((v) => ({ ...v, tiltX }))}
        />
        <Slider
          label="Rotate"
          value={view.rotateZ}
          min={-180}
          max={180}
          onChange={(rotateZ) => setView((v) => ({ ...v, rotateZ }))}
        />
        <button
          type="button"
          onClick={() => setView(DEFAULT_VIEW)}
          className="rounded-full border border-gold/60 px-2 py-0.5 font-black text-gold"
        >
          Reset view
        </button>
      </div>
    </div>
  );
}

function ZoomButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-sm font-black text-foreground",
        "hover:border-gold hover:text-gold",
      )}
    >
      {label}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-muted-foreground">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        aria-label={`${label} board`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-16 accent-[var(--gold)]"
      />
    </label>
  );
}
