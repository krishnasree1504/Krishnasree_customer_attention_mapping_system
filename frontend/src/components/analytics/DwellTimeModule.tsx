import React from 'react';
import { Clock, Layers, Users, BarChart } from 'lucide-react';
import { VideoAnalytics } from '../../types/analytics';

interface DwellTimeModuleProps {
  analytics: VideoAnalytics;
}

export const DwellTimeModule: React.FC<DwellTimeModuleProps> = ({ analytics }) => {
  // Extract shelf dwell metrics
  const shelfDwellData: Array<{ shelfId: string; name: string; dwellSec: number; avgDwellSec: number }> = [];

  if (Array.isArray(analytics.shelfMetrics)) {
    analytics.shelfMetrics.forEach((m, idx) => {
      shelfDwellData.push({
        shelfId: m.shelfId || `shelf_${idx + 1}`,
        name: m.name || `Shelf ${idx + 1}`,
        dwellSec: m.totalDwellSeconds ?? m.totalDwell ?? 0,
        avgDwellSec: m.averageDwellSeconds ?? m.avgDwell ?? 0,
      });
    });
  } else if (analytics.shelfMetrics && typeof analytics.shelfMetrics === 'object') {
    Object.entries(analytics.shelfMetrics).forEach(([key, raw]: [string, any]) => {
      shelfDwellData.push({
        shelfId: key,
        name: raw?.name || key.replace('shelf_', 'Shelf ').replace('shelf', 'Shelf '),
        dwellSec: raw?.totalDwellSeconds ?? raw?.totalDwell ?? 0,
        avgDwellSec: raw?.averageDwellSeconds ?? raw?.avgDwell ?? 0,
      });
    });
  }

  // Calculate totals
  const totalShelfDwell = shelfDwellData.reduce((acc, s) => acc + s.dwellSec, 0);
  const maxShelfDwell = Math.max(...shelfDwellData.map((s) => s.dwellSec), 1);

  // Customer dwell data
  const customers = analytics.customers || [];
  const totalCustomerDwell = customers.reduce((acc, c) => acc + (c.dwellTimeSec || 0), 0);
  const avgCustomerDwell = customers.length > 0 ? totalCustomerDwell / customers.length : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#008A3E]" />
            <span>Shopper Dwell Time Analysis</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Breakdown of attention duration by physical shelf zones and tracked customers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs">
            <span className="text-amber-800 font-semibold">Total Dwell: </span>
            <span className="font-extrabold text-amber-950">
              {totalShelfDwell > 0 ? `${totalShelfDwell.toFixed(1)}s` : totalCustomerDwell > 0 ? `${totalCustomerDwell.toFixed(1)}s` : 'N/A'}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60 text-xs">
            <span className="text-emerald-800 font-semibold">Avg Customer Dwell: </span>
            <span className="font-extrabold text-emerald-950">
              {avgCustomerDwell > 0 ? `${avgCustomerDwell.toFixed(1)}s` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Dwell by Shelf Visual */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Dwell Duration by Shelf Zone</span>
        </h4>

        {shelfDwellData.length > 0 ? (
          <div className="space-y-3">
            {shelfDwellData.map((shelf) => {
              const pct = maxShelfDwell > 0 ? Math.round((shelf.dwellSec / maxShelfDwell) * 100) : 0;
              return (
                <div key={shelf.shelfId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{shelf.name}</span>
                    <div className="flex items-center gap-3 text-slate-500 font-mono">
                      <span>Total: <strong className="text-slate-900">{shelf.dwellSec.toFixed(1)}s</strong></span>
                      {shelf.avgDwellSec > 0 && (
                        <span>Avg: <strong className="text-slate-700">{shelf.avgDwellSec.toFixed(1)}s</strong></span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#00E676] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No shelf dwell data recorded for this video.</p>
        )}
      </div>

      {/* Customer Dwell Breakdown where available */}
      {customers.length > 0 && (
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Individual Tracked Customer Dwell</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {customers.slice(0, 12).map((c) => (
              <div
                key={c.customerId}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center"
              >
                <span className="text-[11px] font-bold text-slate-700 block truncate">
                  {c.customerLabel || `Customer #${c.customerId}`}
                </span>
                <span className="text-sm font-extrabold text-[#008A3E] block mt-0.5">
                  {(c.dwellTimeSec || c.trackDurationSec || 0).toFixed(1)}s
                </span>
                <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                  {c.associatedShelf ? c.associatedShelf.replace('shelf_', 'Shelf ') : 'Aisle'}
                </span>
              </div>
            ))}
          </div>
          {customers.length > 12 && (
            <p className="text-[11px] text-slate-400 mt-2 text-right">
              Showing top 12 of {customers.length} tracked customers
            </p>
          )}
        </div>
      )}
    </div>
  );
};
