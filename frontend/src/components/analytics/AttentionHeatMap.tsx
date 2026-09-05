import React, { useEffect, useRef, useMemo } from 'react';
import { Flame, Layers } from 'lucide-react';
import { ShelfMetric, CustomerTrackingRecord } from '../../types/analytics';

export interface AttentionHeatMapProps {
  heatmapData?: Array<{ x: number; y: number; intensity: number; shelfId?: string }>;
  attentionScores?: Record<string, number>;
  shelfMetrics?: ShelfMetric[] | Record<string, ShelfMetric>;
  customers?: CustomerTrackingRecord[];
  mostAttendedShelf?: string | null;
  resolution?: string;
}

interface ShelfZoneDef {
  id: string;
  name: string;
  category: string;
  gridArea: string;
}

const SHELF_ZONES: ShelfZoneDef[] = [
  { id: 'shelf_1', name: 'Shelf 1', category: 'Beverages & Snacks', gridArea: 'top-left' },
  { id: 'shelf_2', name: 'Shelf 2', category: 'Dairy & Produce', gridArea: 'top-right' },
  { id: 'shelf_3', name: 'Shelf 3', category: 'Personal Care', gridArea: 'bottom-left' },
  { id: 'shelf_4', name: 'Shelf 4', category: 'Packaged Goods', gridArea: 'bottom-right' },
];

export const AttentionHeatMap: React.FC<AttentionHeatMapProps> = ({
  heatmapData = [],
  attentionScores = {},
  customers = [],
  mostAttendedShelf,
  resolution = '1920x1080',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parse reference resolution
  const [refW, refH] = useMemo(() => {
    const parts = resolution.split('x');
    if (parts.length === 2) {
      const w = parseInt(parts[0], 10) || 1920;
      const h = parseInt(parts[1], 10) || 1080;
      return [w, h];
    }
    return [1920, 1080];
  }, [resolution]);

  // Aggregate real coordinates from existing data
  const realPoints = useMemo(() => {
    const points: Array<{ xRatio: number; yRatio: number; weight: number }> = [];

    if (heatmapData && heatmapData.length > 0) {
      heatmapData.forEach((p) => {
        // If coordinates are already normalized [0, 1]
        const isNorm = p.x <= 1.05 && p.y <= 1.05 && p.x >= 0 && p.y >= 0;
        const xRatio = isNorm ? p.x : Math.max(0, Math.min(1, p.x / refW));
        const yRatio = isNorm ? p.y : Math.max(0, Math.min(1, p.y / refH));
        points.push({
          xRatio,
          yRatio,
          weight: Math.min(Math.max(p.intensity || 1.0, 0.5), 2.5),
        });
      });
    } else if (customers && customers.length > 0) {
      // Use real tracking paths if heatmapData was not output separately
      customers.forEach((c) => {
        if (c.pathCoordinates && c.pathCoordinates.length > 0) {
          c.pathCoordinates.forEach(([cx, cy], i) => {
            const isNorm = cx <= 1.05 && cy <= 1.05;
            const xRatio = isNorm ? cx : Math.max(0, Math.min(1, cx / refW));
            const yRatio = isNorm ? cy : Math.max(0, Math.min(1, cy / refH));
            points.push({
              xRatio,
              yRatio,
              weight: i === c.pathCoordinates!.length - 1 ? 1.5 : 0.8,
            });
          });
        }
      });
    }

    return points;
  }, [heatmapData, customers, refW, refH]);

  // Render smooth heat spots onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 260;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (realPoints.length === 0) return;

    // Draw radial blur for each real point
    const baseRadius = Math.max(Math.min(width, height) * 0.12, 24);

    realPoints.forEach((pt) => {
      const px = pt.xRatio * width;
      const py = pt.yRatio * height;
      const radius = baseRadius * Math.sqrt(pt.weight);

      const radGrad = ctx.createRadialGradient(px, py, 0, px, py, radius);
      radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.65)'); // Hot red
      radGrad.addColorStop(0.35, 'rgba(245, 158, 11, 0.45)'); // Warm amber
      radGrad.addColorStop(0.7, 'rgba(16, 185, 129, 0.22)'); // Emerald
      radGrad.addColorStop(1, 'rgba(16, 185, 129, 0)'); // Transparent

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [realPoints]);

  const peakShelfClean = useMemo(() => {
    if (mostAttendedShelf) {
      return mostAttendedShelf.replace('shelf_', 'Shelf ').replace('shelf', 'Shelf ');
    }
    const scores = Object.entries(attentionScores).sort((a, b) => Number(b[1]) - Number(a[1]));
    if (scores.length > 0 && Number(scores[0][1]) > 0) {
      return scores[0][0].replace('shelf_', 'Shelf ').replace('shelf', 'Shelf ');
    }
    return 'Shelf 1';
  }, [mostAttendedShelf, attentionScores]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Attention Heatmap</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Spatial eye-gaze and visitor density overlaid on store shelf layout
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Points:</span>
            <span className="font-extrabold text-slate-900">{realPoints.length}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/70 flex items-center gap-1.5 text-amber-900">
            <span className="text-amber-700 text-[11px]">Peak Zone:</span>
            <span className="font-extrabold">{peakShelfClean}</span>
          </div>
        </div>
      </div>

      {/* Heatmap Visual Area */}
      <div
        ref={containerRef}
        className="relative w-full h-56 sm:h-60 rounded-xl bg-slate-50/80 border border-slate-200/70 overflow-hidden"
      >
        {/* Floorplan Shelf Quadrants */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-2 pointer-events-none">
          {SHELF_ZONES.map((zone) => {
            const isPeak = zone.name.toLowerCase() === peakShelfClean.toLowerCase() || zone.id === mostAttendedShelf;
            const score = attentionScores[zone.id] ?? attentionScores[zone.name] ?? null;

            return (
              <div
                key={zone.id}
                className={`rounded-lg border p-2.5 flex flex-col justify-between transition-all ${
                  isPeak
                    ? 'bg-amber-50/30 border-amber-300/60 shadow-2xs'
                    : 'bg-white/60 border-slate-200/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-slate-400" />
                    <span>{zone.name}</span>
                  </span>
                  {isPeak && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      High Traffic
                    </span>
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                    {zone.category}
                  </span>
                  {score !== null && (
                    <span className="text-[11px] font-bold text-slate-600 font-mono">
                      {Math.round(score)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Central Aisle Label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/60 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs pointer-events-none">
          Central Aisle
        </div>

        {/* Heatmap Canvas Overlaid */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {realPoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/90 text-center p-4">
            <p className="text-xs text-slate-500 font-medium">
              Heatmap spatial coordinates unavailable for this session.
            </p>
          </div>
        )}
      </div>

      {/* Simple, Readable Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-1 border-t border-slate-100 text-xs">
        <span className="text-[11px] font-semibold text-slate-500">Attention Intensity:</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-slate-500">Low</span>
          <div className="w-28 sm:w-36 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500" />
          <span className="text-[10px] font-bold text-red-600">High</span>
        </div>
      </div>
    </div>
  );
};
