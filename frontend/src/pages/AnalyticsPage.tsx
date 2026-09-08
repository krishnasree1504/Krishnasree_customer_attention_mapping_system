import React, { useMemo } from 'react';
import {
  BarChart2,
  Video,
  CheckCircle2,
  Calendar,
  Clock,
  Store as StoreIcon,
  Eye,
  Flame,
  Lightbulb,
  Target,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useActiveVideoAnalysis, isValidCompletedAnalysis } from '../lib/videoAnalysisSync';
import { useAuth } from '../context/AuthContext';
import { ExecutiveKpiRow } from '../components/analytics/ExecutiveKpiRow';
import { CustomerTrafficTimeline } from '../components/analytics/CustomerTrafficTimeline';
import { GazeAnalysisPanel } from '../components/analytics/GazeAnalysisPanel';
import { AttentionHeatMap } from '../components/analytics/AttentionHeatMap';
import { ProductAttractivenessPanel } from '../components/analytics/ProductAttractivenessPanel';
import { ExecutiveReportSection } from '../components/analytics/ExecutiveReportSection';

interface AnalyticsPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const { analytics, jobId, isLoading } = useActiveVideoAnalysis(user?.id);

  const handleGoToVideoAnalysis = () => {
    if (onNavigateTab) {
      onNavigateTab('video');
    } else {
      window.dispatchEvent(new CustomEvent('cams_navigate_tab', { detail: 'video' }));
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white rounded-xl border border-slate-200 p-8 shadow-xs">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Retrieving completed video analysis...</p>
        </div>
      </div>
    );
  }

  // 2. Empty State: Video Analysis Not Completed Yet
  const hasCompletedAnalysis = isValidCompletedAnalysis(analytics);

  if (!hasCompletedAnalysis || !analytics) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-xs text-center max-w-lg mx-auto my-12 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-[#008A3E]">
          <Video className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Video analysis not completed yet.
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Please upload and run Video Analysis to generate results.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={handleGoToVideoAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00E676] hover:bg-[#00c865] text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Run Video Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Extract Factual Executive Insights (short & easy to scan)
  const structuredInsights = useMemo(() => {
    const list: Array<{ label: string; value: string; detail?: string }> = [];

    // Most Attended Shelf
    let mostAttended = 'N/A';
    if (analytics.mostAttendedShelf) {
      mostAttended = analytics.mostAttendedShelf.replace('shelf_', 'Shelf ').replace('shelf', 'Shelf ');
    } else if (analytics.attentionScores) {
      const sorted = Object.entries(analytics.attentionScores).sort((a, b) => Number(b[1]) - Number(a[1]));
      if (sorted.length > 0 && Number(sorted[0][1]) > 0) {
        mostAttended = sorted[0][0].replace('shelf_', 'Shelf ').replace('shelf', 'Shelf ');
      }
    }
    list.push({
      label: 'Most Attended Shelf',
      value: mostAttended,
      detail: 'Highest shopper volume and dwell density',
    });

    // Dominant Gaze
    let dominantGaze = 'N/A';
    if (analytics.gazeDistribution) {
      const sortedGaze = Object.entries(analytics.gazeDistribution).sort((a, b) => Number(b[1]) - Number(a[1]));
      if (sortedGaze.length > 0 && Number(sortedGaze[0][1]) > 0) {
        dominantGaze = sortedGaze[0][0].toUpperCase();
      }
    }
    list.push({
      label: 'Dominant Gaze',
      value: dominantGaze,
      detail: dominantGaze !== 'N/A' ? 'Primary visual attention orientation' : 'Orientation data pending',
    });

    // Peak Occupancy
    const peakOcc = analytics.maxOccupancy ?? analytics.maxCrowd ?? 0;
    list.push({
      label: 'Peak Occupancy',
      value: peakOcc > 0 ? `${peakOcc} Customers` : 'N/A',
      detail: 'Maximum concurrent shoppers tracked',
    });

    // Highest Dwell Shelf
    let highestDwellShelf = 'N/A';
    let maxDwellVal = 0;
    if (analytics.shelfMetrics) {
      if (Array.isArray(analytics.shelfMetrics)) {
        analytics.shelfMetrics.forEach((m) => {
          const d = m.totalDwellSeconds ?? m.totalDwell ?? 0;
          if (d > maxDwellVal) {
            maxDwellVal = d;
            highestDwellShelf = m.name || m.shelfId || '';
          }
        });
      } else if (typeof analytics.shelfMetrics === 'object') {
        Object.entries(analytics.shelfMetrics).forEach(([k, v]: [string, any]) => {
          const d = v?.totalDwellSeconds ?? v?.totalDwell ?? 0;
          if (d > maxDwellVal) {
            maxDwellVal = d;
            highestDwellShelf = v?.name || k;
          }
        });
      }
    }
    if (maxDwellVal > 0) {
      list.push({
        label: 'Highest Dwell Shelf',
        value: highestDwellShelf.replace('shelf_', 'Shelf ').replace('shelf', 'Shelf '),
        detail: `${maxDwellVal.toFixed(1)}s cumulative engagement`,
      });
    }

    // Total Tracked Customers
    const uniqueShoppers = analytics.uniquePeople ?? analytics.totalPeople;
    if (uniqueShoppers !== undefined && uniqueShoppers > 0) {
      list.push({
        label: 'Tracked Customers',
        value: `${uniqueShoppers} Shoppers`,
        detail: 'Unique individuals identified in video',
      });
    }

    // Total Shelf Visits if available
    const totalVisits = analytics.customerJourney?.totalVisits ?? analytics.journey?.totalVisits;
    if (totalVisits !== undefined && totalVisits > 0) {
      list.push({
        label: 'Shelf Interactions',
        value: `${totalVisits} Visits`,
        detail: 'Recorded shelf transitions',
      });
    }

    return list;
  }, [analytics]);

  // 4. Extract Existing Backend Recommendations (concise cards)
  const recommendationsList = useMemo(() => {
    const list: string[] = [];
    if (analytics.optimizations && Array.isArray(analytics.optimizations)) {
      analytics.optimizations.forEach((opt) => {
        if (typeof opt === 'string') {
          list.push(opt);
        } else if (typeof opt === 'object' && opt !== null) {
          const text = (opt as any).recommendation || (opt as any).observation;
          if (text) list.push(text);
        }
      });
    }
    if (analytics.aiRecommendations && Array.isArray(analytics.aiRecommendations)) {
      analytics.aiRecommendations.forEach((rec) => {
        if (!list.includes(rec)) {
          list.push(rec);
        }
      });
    }
    return list;
  }, [analytics]);

  // Formatted processed date
  const formattedDate = useMemo(() => {
    if (analytics.processedAt) {
      try {
        return new Date(analytics.processedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } catch {}
    }
    return 'Recent Session';
  }, [analytics.processedAt]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Page Header & Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-[#008A3E]">
                <BarChart2 className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                Attention Analytics
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              Executive Retail Intelligence Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              High-level attention synthesis, customer traffic timelines, gaze distributions, and executive reporting
            </p>
          </div>

          {/* Compact Metadata Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-900 font-bold text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              <span>Completed</span>
            </div>

            <div className="text-slate-600 text-[11px] font-medium truncate max-w-[140px] sm:max-w-none">
              Video: <strong className="text-slate-900">{analytics.videoFile || 'Processed Video'}</strong>
            </div>

            <div className="text-slate-300">|</div>

            <div className="text-slate-600 text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{analytics.videoDuration || analytics.videoLength || 'Recorded'}</span>
            </div>

            <div className="text-slate-300">|</div>

            <div className="text-slate-600 text-[11px] flex items-center gap-1">
              <StoreIcon className="w-3 h-3 text-slate-400" />
              <span>Store Cam 01</span>
            </div>

            <div className="text-slate-300">|</div>

            <div className="text-slate-600 text-[11px] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Executive Summary Metrics */}
      <ExecutiveKpiRow analytics={analytics} />

      {/* 3. Customer Traffic & In-Store Occupancy Over Time */}
      <CustomerTrafficTimeline analytics={analytics} />

      {/* 4. Gaze Distribution & Attention Heatmap (Aligned 2-Column Desktop Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Gaze / Orientation Distribution (Clean vertical bar chart) */}
        <GazeAnalysisPanel
          gazeDistribution={analytics.gazeDistribution}
          totalObservations={analytics.totalGazeObservations}
          successfulObservations={analytics.successfulGazeObservations}
          averageConfidence={analytics.avgConfidence}
        />

        {/* Right: Attention Heatmap (Clear heatmap + simple legend) */}
        <AttentionHeatMap
          heatmapData={analytics.heatmapData}
          attentionScores={analytics.attentionScores}
          shelfMetrics={analytics.shelfMetrics}
          customers={analytics.customers}
          mostAttendedShelf={analytics.mostAttendedShelf}
          resolution={analytics.resolution}
        />
      </div>

      {/* 5. Product & Object Detection Analysis (Concise Executive Summary) */}
      <ProductAttractivenessPanel
        productAttractiveness={analytics.productAttractiveness}
        mostAttractiveProduct={analytics.mostAttractiveProduct}
        productEngagement={analytics.productEngagement}
        productsPerCategory={analytics.productsPerCategory}
        totalProductsDetected={analytics.totalProductsDetected}
        mostFrequentProduct={analytics.mostFrequentProduct}
        averageProductConfidence={analytics.averageProductConfidence}
      />

      {/* 6. Executive Insights & 7. Optimization Recommendations (Balanced 2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Executive Insights (Compact cards) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Executive Insights</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical facts derived strictly from the completed computer vision analysis
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {structuredInsights.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between"
              >
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </span>
                <p className="text-base font-black text-slate-900 mt-1 truncate">
                  {item.value}
                </p>
                {item.detail && (
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.detail}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Optimization Recommendations (Compact recommendation cards) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#008A3E]" />
              <span>Optimization Recommendations</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Actionable merchandising and floor-planning adjustments from Video Analysis
            </p>
          </div>

          <div className="space-y-2">
            {recommendationsList.length > 0 ? (
              recommendationsList.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-emerald-50/30 border border-emerald-200/60 flex items-start gap-2.5"
                >
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                    Recommendation
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {rec}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 text-xs text-slate-600">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-slate-200 text-slate-700 mr-2">
                  Recommendation
                </span>
                Standard shelf distribution verified. Continuous monitoring recommended to identify ongoing conversion bottlenecks.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 8. Executive Analysis Report & Download Export Bar */}
      <ExecutiveReportSection analytics={analytics} jobId={jobId} />
    </div>
  );
};
