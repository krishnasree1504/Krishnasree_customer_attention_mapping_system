import React, { useMemo } from 'react';
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, HelpCircle } from 'lucide-react';
import { GazeDistribution } from '../../types/analytics';

interface GazeAnalysisPanelProps {
  gazeDistribution?: GazeDistribution | Record<string, number>;
  totalObservations?: number;
  successfulObservations?: number;
  averageConfidence?: string | number;
}

export const GazeAnalysisPanel: React.FC<GazeAnalysisPanelProps> = ({
  gazeDistribution,
  totalObservations,
  successfulObservations,
  averageConfidence,
}) => {
  const directions = ['FORWARD', 'LEFT', 'RIGHT', 'UP', 'DOWN', 'UNKNOWN'] as const;

  const dist = useMemo(() => {
    const raw: Record<string, number> = {
      FORWARD: 0,
      LEFT: 0,
      RIGHT: 0,
      UP: 0,
      DOWN: 0,
      UNKNOWN: 0,
    };
    if (gazeDistribution) {
      Object.entries(gazeDistribution).forEach(([k, v]) => {
        const upper = k.toUpperCase();
        if (upper in raw) {
          raw[upper] = Number(v) || 0;
        } else {
          raw.UNKNOWN = (raw.UNKNOWN || 0) + (Number(v) || 0);
        }
      });
    }
    return raw;
  }, [gazeDistribution]);

  const totalCount = useMemo((): number => {
    const sum = (Object.values(dist) as number[]).reduce((acc, val) => acc + (Number(val) || 0), 0);
    return sum > 0 ? sum : (successfulObservations ?? totalObservations ?? 0);
  }, [dist, successfulObservations, totalObservations]);

  const maxVal = useMemo(() => {
    const max = Math.max(...Object.values(dist).map((v) => Number(v) || 0));
    return max > 0 ? max : 1;
  }, [dist]);

  const dominant = useMemo(() => {
    let topDir = 'FORWARD';
    let topCount = -1;
    directions.forEach((d) => {
      if ((dist[d] || 0) > topCount) {
        topCount = dist[d] || 0;
        topDir = d;
      }
    });
    return topCount > 0 ? topDir : 'N/A';
  }, [dist, directions]);

  const getDirectionIcon = (dir: string) => {
    switch (dir) {
      case 'FORWARD':
        return <Crosshair className="w-3.5 h-3.5" />;
      case 'LEFT':
        return <ArrowLeft className="w-3.5 h-3.5" />;
      case 'RIGHT':
        return <ArrowRight className="w-3.5 h-3.5" />;
      case 'UP':
        return <ArrowUp className="w-3.5 h-3.5" />;
      case 'DOWN':
        return <ArrowDown className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#008A3E]" />
            <span>Gaze / Orientation Distribution</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Directional eye fixation telemetry across analyzed customer frames
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px]">Total Gazes:</span>
            <span className="font-extrabold text-slate-900">{totalCount}</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center gap-1.5 text-emerald-900">
            <span className="text-emerald-700 text-[11px]">Dominant:</span>
            <span className="font-extrabold">{dominant}</span>
          </div>
          {averageConfidence && (
            <div className="hidden sm:flex px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/70 items-center gap-1.5 text-slate-600">
              <span className="text-slate-500 text-[11px]">Confidence:</span>
              <span className="font-bold text-slate-800">{averageConfidence}</span>
            </div>
          )}
        </div>
      </div>

      {/* Clean Vertical Bar Chart */}
      <div className="w-full">
        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 pt-6 pb-2 px-1">
          {directions.map((dir) => {
            const count = dist[dir] || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
            const isDominant = dir === dominant && count > 0;
            // Height ratio bounded between 4% (if > 0) and 100%
            const heightPercent = count > 0 ? Math.max(Math.round((count / maxVal) * 100), 6) : 2;

            return (
              <div key={dir} className="flex flex-col items-center h-full justify-end group">
                {/* Value labels on top of bar */}
                <div className="text-center mb-1.5 select-none transition-transform group-hover:-translate-y-0.5">
                  <span className={`block text-xs font-black leading-tight ${isDominant ? 'text-[#008A3E]' : 'text-slate-800'}`}>
                    {count}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-400 leading-tight">
                    {pct}%
                  </span>
                </div>

                {/* Bar Track & Fill */}
                <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg relative flex items-end h-28 overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isDominant
                        ? 'bg-gradient-to-t from-[#008A3E] to-[#00E676] shadow-xs'
                        : 'bg-slate-400/80 hover:bg-slate-500'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                {/* X-Axis Category Label */}
                <div className="mt-2.5 text-center flex flex-col items-center gap-0.5">
                  <span className={`p-1 rounded-md ${isDominant ? 'bg-emerald-50 text-[#008A3E]' : 'text-slate-400'}`}>
                    {getDirectionIcon(dir)}
                  </span>
                  <span
                    className={`text-[10px] sm:text-[11px] font-bold tracking-tight select-none ${
                      isDominant ? 'text-emerald-900' : 'text-slate-600'
                    }`}
                  >
                    {dir}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
