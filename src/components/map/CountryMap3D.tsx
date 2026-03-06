"use client";

import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { formatNumber } from "@/lib/format";
import type { CityMapEntry } from "@/app/dashboard/page";

const MAP_WIDTH = 960;
const MAP_HEIGHT = 500;
const PADDING = 0;

const COUNTRY_FILL = "#222222";
const COUNTRY_STROKE = "#444444";
const OCEAN_BG = "#0d0d0d";
const CIRCLE_COLOR = "#c8b832";
const MIN_RADIUS = 8;
const MAX_RADIUS = 28;

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.5;

function projectLng(lng: number): number {
  return ((lng + 180) / 360) * MAP_WIDTH + PADDING;
}

function projectLat(lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const clampedMercN = Math.max(-Math.PI, Math.min(Math.PI, mercN));
  const y = MAP_HEIGHT / 2 - (MAP_WIDTH / (2 * Math.PI)) * clampedMercN;
  return y + PADDING;
}

function coordsToPath(coords: number[][]): string {
  let d = "";
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat] = coords[i];
    const x = projectLng(lng);
    const y = projectLat(lat);
    d += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : `L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  d += "Z";
  return d;
}

function geometryToPath(geometry: Record<string, unknown>): string {
  const type = geometry.type as string;
  const coordinates = geometry.coordinates;
  let d = "";

  if (type === "Polygon") {
    const rings = coordinates as number[][][];
    for (const ring of rings) {
      d += coordsToPath(ring);
    }
  } else if (type === "MultiPolygon") {
    const polys = coordinates as number[][][][];
    for (const poly of polys) {
      for (const ring of poly) {
        d += coordsToPath(ring);
      }
    }
  }

  return d;
}

function radiusForCount(count: number, maxCount: number): number {
  if (maxCount <= 0) return MIN_RADIUS;
  const t = Math.sqrt(count / maxCount);
  return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
}

interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  city: string;
  country: string;
  total: number;
  sales: number;
  groups: number;
}

const INITIAL_TOOLTIP: TooltipState = {
  show: false,
  x: 0,
  y: 0,
  city: "",
  country: "",
  total: 0,
  sales: 0,
  groups: 0,
};

export interface CountryMap3DProps {
  cities: CityMapEntry[];
}

interface PathEntry {
  key: number;
  d: string;
}

function clampPan(x: number, y: number, zoom: number): { x: number; y: number } {
  const vw = MAP_WIDTH / zoom;
  const vh = MAP_HEIGHT / zoom;
  const maxX = MAP_WIDTH - vw;
  const maxY = MAP_HEIGHT - vh;
  return {
    x: Math.max(0, Math.min(maxX, x)),
    y: Math.max(0, Math.min(maxY, y)),
  };
}

export function CountryMap3D({ cities }: CountryMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>(INITIAL_TOOLTIP);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [countryPaths, setCountryPaths] = useState<PathEntry[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    let cancelled = false;
    fetch("/world.geo.json")
      .then((res) => res.json())
      .then((geo) => {
        if (cancelled) return;
        const features = (geo.features ?? []) as Record<string, unknown>[];
        const paths = features.map((f, i) => ({
          key: i,
          d: geometryToPath((f.geometry ?? {}) as Record<string, unknown>),
        }));
        setCountryPaths(paths);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleZoom = useCallback((direction: 1 | -1) => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + direction * ZOOM_STEP));
      if (next === 1) {
        setPan({ x: 0, y: 0 });
      } else {
        setPan((p) => clampPan(p.x, p.y, next));
      }
      return next;
    });
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoom <= 1) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [zoom, pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scaleX = MAP_WIDTH / rect.width;
      const scaleY = MAP_HEIGHT / rect.height;
      const dx = (e.clientX - panStart.current.x) * scaleX / zoom;
      const dy = (e.clientY - panStart.current.y) * scaleY / zoom;
      setPan(clampPan(panStart.current.panX - dx, panStart.current.panY - dy, zoom));
    },
    [isPanning, zoom]
  );

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY < 0 ? 1 : -1);
    },
    [handleZoom]
  );

  const maxCount = useMemo(
    () => Math.max(...cities.map((c) => c.total), 1),
    [cities]
  );

  const sortedCities = useMemo(
    () => [...cities].sort((a, b) => b.total - a.total),
    [cities]
  );

  const handleMouseEnter = useCallback(
    (entry: CityMapEntry, e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setHoveredCity(entry.city);
      setTooltip({
        show: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        city: entry.city,
        country: entry.country,
        total: entry.total,
        sales: entry.sales,
        groups: entry.groups,
      });
    },
    []
  );

  const handleMouseMove = useCallback(
    (entry: CityMapEntry, e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltip((prev) => ({
        ...prev,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }));
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCity(null);
    setTooltip(INITIAL_TOOLTIP);
  }, []);

  const vw = MAP_WIDTH / zoom;
  const vh = MAP_HEIGHT / zoom;
  const viewBox = `${pan.x} ${pan.y} ${vw} ${vh}`;

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[400px] w-full overflow-hidden"
      style={{ background: OCEAN_BG, cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
    >
      <svg
        viewBox={viewBox}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {countryPaths.map((cp) => (
          <path
            key={cp.key}
            d={cp.d}
            fill={COUNTRY_FILL}
            stroke={COUNTRY_STROKE}
            strokeWidth={0.5 / zoom}
          />
        ))}

        {sortedCities.map((entry) => {
          if (entry.lng === 0 && entry.lat === 0) return null;
          const cx = projectLng(entry.lng);
          const cy = projectLat(entry.lat);
          const r = radiusForCount(entry.total, maxCount) / zoom;
          const isHovered = hoveredCity === entry.city;
          const displayR = isHovered ? r * 1.15 : r;
          const fontSize = (r * zoom < 12 ? 6 : r * zoom < 18 ? 7.5 : 9) / zoom;

          return (
            <g
              key={entry.city}
              onMouseEnter={(e) => handleMouseEnter(entry, e)}
              onMouseMove={(e) => handleMouseMove(entry, e)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={displayR + 2 / zoom}
                fill="none"
                stroke="rgba(200, 184, 50, 0.25)"
                strokeWidth={(isHovered ? 3 : 1.5) / zoom}
              />
              <circle
                cx={cx}
                cy={cy}
                r={displayR}
                fill={CIRCLE_COLOR}
                fillOpacity={isHovered ? 1 : 0.9}
              />
              <text
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#0a0a0a"
                fontFamily="var(--font-jetbrains), monospace"
                fontWeight="700"
                fontSize={fontSize}
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {String(entry.total)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Map controls */}
      <div className="absolute right-3 top-3 z-40 flex flex-col gap-2">
        {/* Fullscreen button */}
        <button
          type="button"
          onClick={handleFullscreen}
          className="flex h-8 w-8 items-center justify-center rounded-sm transition-colors"
          style={{ background: "#1a1a1a", border: "1px solid #444" }}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 1 6 6 1 6" />
              <polyline points="10 15 10 10 15 10" />
              <polyline points="15 6 10 6 10 1" />
              <polyline points="1 10 6 10 6 15" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 6 1 1 6 1" />
              <polyline points="15 10 15 15 10 15" />
              <polyline points="10 1 15 1 15 6" />
              <polyline points="6 15 1 15 1 10" />
            </svg>
          )}
        </button>

        {/* Zoom buttons */}
        <div className="flex flex-col overflow-hidden rounded-sm" style={{ border: "1px solid #444" }}>
          <button
            type="button"
            onClick={() => handleZoom(1)}
            disabled={zoom >= MAX_ZOOM}
            className="flex h-8 w-8 items-center justify-center transition-colors disabled:opacity-30"
            style={{ background: "#f0f0f0", borderBottom: "1px solid #ccc" }}
            title="Zoom in"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
              <line x1="7" y1="2" x2="7" y2="12" />
              <line x1="2" y1="7" x2="12" y2="7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => handleZoom(-1)}
            disabled={zoom <= MIN_ZOOM}
            className="flex h-8 w-8 items-center justify-center transition-colors disabled:opacity-30"
            style={{ background: "#f0f0f0" }}
            title="Zoom out"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="7" x2="12" y2="7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="pointer-events-none absolute z-50 border border-border bg-background-elevated shadow-tooltip"
          style={{
            left: Math.max(100, Math.min(tooltip.x, (containerRef.current?.clientWidth ?? 960) - 100)),
            top: tooltip.y,
            transform: tooltip.y < 140
              ? "translate(-50%, 16px)"
              : "translate(-50%, -100%) translateY(-12px)",
            minWidth: "180px",
            padding: "12px 16px",
          }}
        >
          <p className="font-serif text-body-sm font-semibold text-primary" style={{ marginBottom: "2px" }}>
            {tooltip.city}
          </p>
          <p className="font-mono text-primary-muted" style={{ fontSize: "10px", letterSpacing: "0.15em", marginBottom: "8px" }}>
            {tooltip.country.toUpperCase()}
          </p>
          <div style={{ borderTop: "1px solid #333333", paddingTop: "8px" }}>
            <div className="flex justify-between gap-4 font-mono" style={{ fontSize: "11px", marginBottom: "4px" }}>
              <span className="text-primary-muted">Total</span>
              <span className="text-primary font-bold">{formatNumber(tooltip.total)}</span>
            </div>
            <div className="flex justify-between gap-4 font-mono" style={{ fontSize: "11px", marginBottom: "2px" }}>
              <span className="text-accent">Sales</span>
              <span className="text-accent">{formatNumber(tooltip.sales)}</span>
            </div>
            <div className="flex justify-between gap-4 font-mono" style={{ fontSize: "11px" }}>
              <span className="text-primary-muted">Groups</span>
              <span className="text-primary-muted">{formatNumber(tooltip.groups)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
