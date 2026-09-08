import React, { useMemo } from 'react';
import { Users, ArrowDownRight, ArrowUpRight, Clock } from 'lucide-react';
import { VideoAnalytics } from '../../types/analytics';

interface CustomerTrafficTimelineProps {
  analytics: VideoAnalytics;
}

export const CustomerTrafficTimeline: React.FC<CustomerTrafficTimelineProps> = ({ analytics }) => {
  // Parse video duration in seconds
  const durationSec = useMemo(() => {
    if (analytics.videoDuration) {
      const parts = analytics.videoDuration.split(':');
      if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
      if (parts.length === 3)
        return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
    }
    if (analytics.totalFrames && analytics.fps && analytics.fps > 0) {
      return Math.round(analytics.totalFrames / analytics.fps);
    }
    if (analytics.customers && analytics.customers.length > 0) {
      return Math.max(...analytics.customers.map((c) => c.trackDurationSec || c.dwellTimeSec || 0), 30);
    }
    return 60;
  }, [analytics]);

  // Build timeline points from customer tracks
  const timelinePoints = useMemo(() => {
    const customers = analytics.customers || [];
    const numBuckets = Math.min(Math.max(Math.floor(durationSec / 4), 10), 20);
    const bucketDuration = durationSec / numBuckets;

    const points: Array<{ timeSec: number; label: string; occupancy: number }> = [];

    for (let b = 0; b < numBuckets; b++) {
      const bucketStart = b * bucketDuration;
      const bucketEnd = (b + 1) * bucketDuration;
      const bucketMid = (bucketStart + bucketEnd) / 2;

      let activeCount = 0;
      if (customers.length > 0) {
        customers.forEach((c, idx) => {
          const trackLen = c.trackDurationSec || c.dwellTimeSec || 15;
          const arrivalOffset =
            customers.length > 1
              ? (idx / (customers.length - 1)) * Math.max(durationSec - trackLen, 0)
              : 0;
          const leaveTime = arrivalOffset + trackLen;

          if (bucketEnd >= arrivalOffset && bucketStart <= leaveTime) {
            activeCount++;
          }
        });
      }

      if (analytics.maxCrowd && activeCount > analytics.maxCrowd) {
        activeCount = analytics.maxCrowd;
      }

      points.push({
        timeSec: Math.round(bucketMid),
        label: `${Math.floor(bucketMid / 60)}:${String(Math.floor(bucketMid % 60)).padStart(2, '0')}`,
        occupancy: activeCount,
      });
    }

    return points;
  }, [analytics, durationSec]);

  const maxVal = useMemo(() => {
    const calculatedMax = Math.max(...timelinePoints.map((p) => p.occupancy), 0);
    const knownMax = analytics.maxOccupancy ?? analytics.maxCrowd ?? 0;
    return Math.max(calculatedMax, knownMax, 2);
  }, [timelinePoints, analytics]);

  // SVG Chart Geometry
  const svgWidth = 800;
  const svgHeight = 170;
  const padLeft = 38;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Selected X ticks (at most 6 evenly spaced labels to prevent overlap)
  const xTickIndices = useMemo(() => {
    if (timelinePoints.length <= 6) {
      return timelinePoints.map((_, i) => i);
    }
    const count = 6;
    const step = (timelinePoints.length - 1) / (count - 1);
    const indices: number[] = [];
    for (let i = 0; i < count; i++) {
      indices.push(Math.round(i * step));
    }
    return Array.from(new Set(indices));
  }, [timelinePoints]);

  // Y ticks: 0, mid, max
  const yTicks = [
    { val: 0, ratio: 0 },
    { val: Math.round(maxVal / 2), ratio: 0.5 },
    { val: maxVal, ratio: 1 },
  ];

  const coords = useMemo(() => {
    if (timelinePoints.length === 0) return [];
    return timelinePoints.map((p, i) => {
      const x = padLeft + (i / (timelinePoints.length - 1)) * plotWidth;
      const y = padTop + (1 - p.occupancy / maxVal) * plotHeight;
      return { x, y, ...p };
    });
  }, [timelinePoints, maxVal, plotWidth, plotHeight, padLeft, padTop]);

  const pathPointsString = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPointsString = `${coords[0]?.x ?? padLeft},${padTop + plotHeight} ${pathPointsString} ${
    coords[coords.length - 1]?.x ?? padLeft + plotWidth
  },${padTop + plotHeight}`;

  const peakOcc = analytics.maxOccupancy ?? analytics.maxCrowd ?? Math.max(...timelinePoints.map((p) => p.occupancy), 0);
  const avgOcc =
    analytics.avgOccupancy !== undefined
      ? analytics.avgOccupancy.toFixed(1)
      : analytics.avgCrowd !== undefined
      ? analytics.avgCrowd.toFixed(1)
      : (timelinePoints.reduce((s, p) => s + p.occupancy, 0) / (timelinePoints.length || 1)).toFixed(1);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      {/* Header with KPI chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#008A3E]" />
            <span>Customer Traffic & In-Store Occupancy Over Time</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal customer density throughout processed video duration ({analytics.videoDuration || `${durationSec}s`})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Peak Occupancy:</span>
            <span className="font-extrabold text-slate-900">{peakOcc}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Avg Occupancy:</span>
            <span className="font-extrabold text-slate-900">{avgOcc}</span>
          </div>
          {analytics.entries !== undefined && (
            <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center gap-1 text-emerald-800 font-semibold text-[11px]">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
              <span>Entries: {analytics.entries}</span>
            </div>
          )}
          {analytics.exits !== undefined && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 flex items-center gap-1 text-slate-700 font-semibold text-[11px]">
              <ArrowDownRight className="w-3.5 h-3.5 text-slate-500" />
              <span>Exits: {analytics.exits}</span>
            </div>
          )}
        </div>
      </div>

      {coords.length > 0 ? (
        <div className="w-full relative">
          <svg
            className="w-full h-auto max-h-52 overflow-visible"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E676" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#00E676" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((yt, idx) => {
              const yPos = padTop + (1 - yt.ratio) * plotHeight;
              return (
                <g key={idx}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={padLeft + plotWidth}
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={yt.ratio > 0 && yt.ratio < 1 ? '4 3' : undefined}
                  />
                  <text
                    x={padLeft - 8}
                    y={yPos + 3.5}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono select-none"
                  >
                    {yt.val}
                  </text>
                </g>
              );
            })}

            {/* Area Fill */}
            <polygon points={areaPointsString} fill="url(#trafficGradient)" />

            {/* Stroke Line */}
            <polyline
              points={pathPointsString}
              fill="none"
              stroke="#008A3E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Points */}
            {coords.map((c, i) => (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r="3.5"
                fill="#ffffff"
                stroke="#008A3E"
                strokeWidth="2"
                className="hover:r-5 transition-all cursor-pointer"
              >
                <title>{`Time: ${c.label} | Occupancy: ${c.occupancy}`}</title>
              </circle>
            ))}

            {/* X-Axis Ticks & Labels */}
            {xTickIndices.map((idx) => {
              const pt = coords[idx];
              if (!pt) return null;
              return (
                <g key={idx}>
                  <line
                    x1={pt.x}
                    y1={padTop + plotHeight}
                    x2={pt.x}
                    y2={padTop + plotHeight + 4}
                    stroke="#cbd5e1"
                    strokeWidth="1"
                  />
                  <text
                    x={pt.x}
                    y={padTop + plotHeight + 17}
                    textAnchor="middle"
                    className="text-[11px] fill-slate-400 font-mono select-none"
                  >
                    {pt.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200/60">
          <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs text-slate-600 font-semibold">Video timeline occupancy recorded</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Total unique customers: {analytics.uniquePeople ?? analytics.totalPeople ?? 0} | Peak occupancy: {peakOcc}
          </p>
        </div>
      )}
    </div>
  );
};
