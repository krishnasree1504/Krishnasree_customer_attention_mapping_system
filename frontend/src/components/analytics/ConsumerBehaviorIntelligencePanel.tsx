import React from 'react';
import { UserCheck, Activity, Clock, Layers, Award, AlertCircle } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { BehaviorIntelligenceData, CustomerTrackingRecord } from '../../types/analytics';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ConsumerBehaviorIntelligencePanelProps {
  behaviorIntelligence?: BehaviorIntelligenceData;
  customers?: CustomerTrackingRecord[];
}

export const ConsumerBehaviorIntelligencePanel: React.FC<ConsumerBehaviorIntelligencePanelProps> = ({
  behaviorIntelligence,
  customers = [],
}) => {
  const hasProfiles = Boolean(
    behaviorIntelligence?.customerProfiles && behaviorIntelligence.customerProfiles.length > 0
  );
  const hasDistribution = Boolean(
    behaviorIntelligence?.segmentDistribution &&
      Object.keys(behaviorIntelligence.segmentDistribution).length > 0
  );

  const totalAnalyzed =
    behaviorIntelligence?.totalCustomersAnalyzed ??
    behaviorIntelligence?.customerProfiles?.length ??
    customers.length;

  const dominantSegment = behaviorIntelligence?.dominantCustomerSegment;
  const patterns = behaviorIntelligence?.shoppingPatterns;
  const profiles = behaviorIntelligence?.customerProfiles || [];

  // Segment colors mapping
  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Quick Buyer':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', hex: '#00E676' };
      case 'Comparison Shopper':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', hex: '#6366F1' };
      case 'Explorer':
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200', hex: '#0EA5E9' };
      case 'Impulse-Like Shopper':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', hex: '#F59E0B' };
      case 'General Shopper':
      default:
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', hex: '#8B5CF6' };
    }
  };

  // Prepare Chart.js data for segment distribution
  const chartData = React.useMemo(() => {
    if (!behaviorIntelligence?.segmentDistribution) return null;
    const labels = Object.keys(behaviorIntelligence.segmentDistribution);
    const data = Object.values(behaviorIntelligence.segmentDistribution);

    if (labels.length === 0 || data.every((v) => v === 0)) return null;

    const backgroundColors = labels.map((l) => getSegmentColor(l).hex);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: '#FFFFFF',
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  }, [behaviorIntelligence?.segmentDistribution]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 11,
            weight: 600 as const,
          },
          padding: 12,
        },
      },
    },
    cutout: '68%',
  };

  const hasData = Boolean(totalAnalyzed > 0 && (hasProfiles || hasDistribution));

  return (
    <div id="section-consumer-behavior" className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-700 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
              <span>4. Consumer Behavior Intelligence</span>
              {hasData && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  {totalAnalyzed} Shoppers Profiled
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Heuristic shopper archetypes, dwell patterns, movement velocity, and multi-zone attention scoring.
            </p>
          </div>
        </div>

        {dominantSegment && (
          <div className="flex items-center gap-2 shrink-0 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl">
            <span className="text-xs text-purple-700 font-bold">Dominant Archetype:</span>
            <span className="text-xs font-black text-purple-900">{dominantSegment}</span>
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-bold text-slate-700">Data not available</p>
          <p className="text-xs text-slate-400">
            Insufficient customer movement duration to generate behavioral segment archetypes.
          </p>
        </div>
      ) : (
        <>
          {/* Top Overview Cards & Segment Distribution Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Shopping Pattern Stats (2 cols on lg) - 4 Balanced Cards in 2x2 Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Avg Journey Time
                </span>
                <p className="text-lg font-black text-slate-900">
                  {patterns?.averageJourneyDurationSec !== undefined
                    ? `${patterns.averageJourneyDurationSec.toFixed(1)}s`
                    : 'Data not available'}
                </p>
                <p className="text-[10px] text-slate-400">Total duration in camera view</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" />
                  Avg Shelf Dwell
                </span>
                <p className="text-lg font-black text-slate-900">
                  {patterns?.averageDwellTimeSec !== undefined
                    ? `${patterns.averageDwellTimeSec.toFixed(1)}s`
                    : 'Data not available'}
                </p>
                <p className="text-[10px] text-slate-400">Time spent in active shelf zones</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Avg Shelves Visited
                </span>
                <p className="text-lg font-black text-slate-900">
                  {patterns?.averageShelvesVisited !== undefined
                    ? patterns.averageShelvesVisited.toFixed(1)
                    : 'Data not available'}
                </p>
                <p className="text-[10px] text-slate-400">Distinct zones per shopper</p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
                <span className="text-[10px] font-bold text-purple-700 uppercase flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-purple-500" />
                  Dominant Archetype
                </span>
                <p className="text-base font-black text-purple-900 truncate">
                  {dominantSegment || 'Data not available'}
                </p>
                <p className="text-[10px] text-purple-600">Most common shopper pattern</p>
              </div>
            </div>

            {/* Right: Segment Distribution Donut */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center space-y-3">
              <div className="w-full text-left">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Archetype Distribution
                </h4>
                <p className="text-[10px] text-slate-500">Customer classification breakdown</p>
              </div>

              {chartData ? (
                <div className="h-44 w-full flex items-center justify-center relative">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">
                  Distribution data not available
                </div>
              )}
            </div>
          </div>

          {/* Customer Profiles Breakdown Table */}
          {profiles.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-900">
                  Individual Shopper Behavioral Profiles
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  {profiles.length} Profiles Generated
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 w-full max-w-full">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Behavior Segment</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">Journey Time</th>
                      <th className="px-4 py-3 text-center">Zone Dwell</th>
                      <th className="px-4 py-3">Favorite Shelf</th>
                      <th className="px-4 py-3 text-center">Dominant Gaze</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {profiles.map((p, idx) => {
                      const segStyle = getSegmentColor(p.behaviorSegment);
                      return (
                        <tr key={p.customerId || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-black text-[10px]">
                                {p.customerId}
                              </span>
                              <span className="font-bold text-slate-900">
                                {p.customerLabel || `Customer #${p.customerId}`}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border ${segStyle.bg}`}
                            >
                              {p.behaviorSegment || 'Unclassified'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-extrabold text-slate-900 font-mono">
                            {p.behaviorScore !== undefined ? p.behaviorScore : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium">
                            {p.journeyDurationSec !== undefined
                              ? `${p.journeyDurationSec.toFixed(1)}s`
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium">
                            {p.totalDwellTimeSec !== undefined
                              ? `${p.totalDwellTimeSec.toFixed(1)}s`
                              : 'N/A'}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {p.favoriteShelf ? (
                              <span className="capitalize">
                                {p.favoriteShelf.replace('shelf_', 'Shelf ').replace('_', ' ')}
                                {p.favoriteShelfDwellSec ? ` (${p.favoriteShelfDwellSec.toFixed(1)}s)` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-400">In Aisle</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.dominantGaze || 'UNKNOWN'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
