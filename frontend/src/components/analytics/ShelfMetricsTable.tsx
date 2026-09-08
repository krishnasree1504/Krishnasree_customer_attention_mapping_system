// src/components/analytics/ShelfMetricsTable.tsx
import React from 'react';
import { ShelfMetric } from '../../types/analytics';

interface Props {
  shelfMetrics: ShelfMetric[] | Record<string, ShelfMetric>;
  attentionScores?: Record<string, number>;
}

export const ShelfMetricsTable: React.FC<Props> = ({ shelfMetrics, attentionScores }) => {
  let metricsList: Array<{
    id: string;
    name: string;
    uniqueVisitorsCount: number;
    visits: number;
    averageDwellSeconds: number;
    totalDwellSeconds: number;
    peakOccupancy: number;
    score: number | null;
  }> = [];

  if (Array.isArray(shelfMetrics)) {
    metricsList = shelfMetrics.map((m, idx) => ({
      id: m.shelfId || `shelf${idx + 1}`,
      name: m.name || `Shelf ${idx + 1}`,
      uniqueVisitorsCount: m.uniqueVisitorsCount || m.visits || 0,
      visits: m.visits || 0,
      averageDwellSeconds: m.averageDwellSeconds ?? m.avgDwell ?? 0,
      totalDwellSeconds: m.totalDwellSeconds ?? m.totalDwell ?? 0,
      peakOccupancy: m.peakOccupancy || 0,
      score: m.attentionScore ?? (attentionScores ? attentionScores[m.shelfId || `shelf${idx + 1}`] : null),
    }));
  } else if (shelfMetrics && typeof shelfMetrics === 'object') {
    metricsList = Object.entries(shelfMetrics).map(([key, rawVal]) => {
      const val = rawVal as any;
      return {
        id: key,
        name: val?.name || key.replace('shelf', 'Shelf ').replace('_', ' '),
        uniqueVisitorsCount: val?.uniqueVisitorsCount || val?.visits || 0,
        visits: val?.visits || 0,
        averageDwellSeconds: val?.averageDwellSeconds ?? val?.avgDwell ?? 0,
        totalDwellSeconds: val?.totalDwellSeconds ?? val?.totalDwell ?? 0,
        peakOccupancy: val?.peakOccupancy || 0,
        score: val?.attentionScore ?? (attentionScores ? attentionScores[key] : null),
      };
    });
  }

  if (metricsList.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
        Insufficient data to determine gaze-based shelf attention.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Shelf Zone</th>
            <th className="px-4 py-3 text-center">Unique Visitors</th>
            <th className="px-4 py-3 text-center">Total Visits</th>
            <th className="px-4 py-3 text-center">Avg Dwell</th>
            <th className="px-4 py-3 text-center">Total Dwell</th>
            <th className="px-4 py-3 text-center">Peak Occupancy</th>
            <th className="px-4 py-3 text-center">Attention Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {metricsList.map((m, idx) => (
            <tr key={m.id || idx} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-semibold text-slate-900">{m.name}</td>
              <td className="px-4 py-3 text-center font-medium">{m.uniqueVisitorsCount}</td>
              <td className="px-4 py-3 text-center font-medium">{m.visits}</td>
              <td className="px-4 py-3 text-center font-mono">{m.averageDwellSeconds.toFixed(1)}s</td>
              <td className="px-4 py-3 text-center font-mono">{m.totalDwellSeconds.toFixed(1)}s</td>
              <td className="px-4 py-3 text-center font-medium">{m.peakOccupancy}</td>
              <td className="px-4 py-3 text-center">
                {m.score !== null && m.score !== undefined ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {m.score}%
                  </span>
                ) : (
                  <span className="text-slate-400">N/A</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
