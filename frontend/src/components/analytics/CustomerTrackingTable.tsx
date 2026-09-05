import React from 'react';
import { Users, Clock, Eye, MapPin, Activity, CheckCircle } from 'lucide-react';
import { CustomerTrackingRecord } from '../../types/analytics';

interface CustomerTrackingTableProps {
  customers?: CustomerTrackingRecord[];
}

export const CustomerTrackingTable: React.FC<CustomerTrackingTableProps> = ({ customers = [] }) => {
  if (!customers || customers.length === 0) {
    return (
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full min-w-0">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                ByteTrack Customer Tracking & Attention Records
              </h3>
              <p className="text-xs text-slate-500">Persistent customer IDs, trajectories, and gaze observations</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
          <p className="font-semibold text-slate-700">No persistent customer tracks detected in this recording.</p>
          <p className="text-xs text-slate-400 mt-1">Ensure video contains visible shoppers with sufficient lighting and duration (&gt; 1.0s).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
              <span>ByteTrack Customer Tracking & Attention Records</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                {customers.length} Tracked Shoppers
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Individual customer identities, dwell times, and dominant gaze vectors tracked across frames.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 w-full max-w-full">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Customer ID</th>
              <th className="px-4 py-3 text-center">Track Duration</th>
              <th className="px-4 py-3 text-center">Dominant Gaze</th>
              <th className="px-4 py-3 text-center">Gaze Confidence</th>
              <th className="px-4 py-3 text-center">Yaw / Pitch</th>
              <th className="px-4 py-3">Associated Shelf</th>
              <th className="px-4 py-3 text-right">Zone Dwell Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {customers.map((c, idx) => (
              <tr key={c.customerId || idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-black text-[10px]">
                      {c.customerId}
                    </span>
                    <span className="font-bold text-slate-900">{c.customerLabel || `Customer #${c.customerId}`}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono font-medium">
                  {c.trackDurationSec ? `${c.trackDurationSec.toFixed(1)}s` : 'N/A'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                      c.dominantGaze === 'FORWARD'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.dominantGaze === 'LEFT' || c.dominantGaze === 'RIGHT'
                        ? 'bg-sky-100 text-sky-800'
                        : c.dominantGaze === 'UP' || c.dominantGaze === 'DOWN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.dominantGaze || 'UNKNOWN'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-medium">
                  {c.gazeConfidence ? `${c.gazeConfidence.toFixed(1)}%` : 'N/A'}
                </td>
                <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500">
                  {c.yaw !== null && c.yaw !== undefined && c.pitch !== null && c.pitch !== undefined
                    ? `${c.yaw.toFixed(0)}° / ${c.pitch.toFixed(0)}°`
                    : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <MapPin className="w-3.5 h-3.5 text-[#008A3E] shrink-0" />
                    <span>{c.associatedShelf || 'In Aisle'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                  {c.dwellTimeSec ? `${c.dwellTimeSec.toFixed(1)}s` : '0.0s'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
