import React from 'react';
import { Users, TrendingUp, Clock, Eye, ShoppingBag, Award, Activity, BarChart2 } from 'lucide-react';
import { VideoAnalytics } from '../../types/analytics';

interface ExecutiveKpiRowProps {
  analytics: VideoAnalytics;
}

export const ExecutiveKpiRow: React.FC<ExecutiveKpiRowProps> = ({ analytics }) => {
  // 1. Unique Customers
  const uniqueCustomers =
    analytics.uniquePeople !== undefined
      ? analytics.uniquePeople
      : analytics.totalPeople !== undefined
      ? analytics.totalPeople
      : 'N/A';

  // 2. Peak Occupancy
  const peakOccupancy =
    analytics.maxOccupancy !== undefined
      ? analytics.maxOccupancy
      : analytics.maxCrowd !== undefined
      ? analytics.maxCrowd
      : 'N/A';

  // 3. Average Dwell Time & 4. Total Dwell Time
  let totalDwellNum: number | null = null;
  let avgDwellNum: number | null = null;

  if (analytics.customerJourney?.averageJourneyDurationSec !== undefined) {
    avgDwellNum = analytics.customerJourney.averageJourneyDurationSec;
  }

  // Derive from shelfMetrics if available
  if (analytics.shelfMetrics) {
    let dwellList: number[] = [];
    let sumDwell = 0;

    if (Array.isArray(analytics.shelfMetrics)) {
      analytics.shelfMetrics.forEach((m) => {
        const d = m.totalDwellSeconds ?? m.totalDwell ?? 0;
        sumDwell += d;
        if (m.averageDwellSeconds ?? m.avgDwell) {
          dwellList.push(m.averageDwellSeconds ?? m.avgDwell ?? 0);
        }
      });
    } else if (typeof analytics.shelfMetrics === 'object') {
      Object.values(analytics.shelfMetrics).forEach((val: any) => {
        const d = val?.totalDwellSeconds ?? val?.totalDwell ?? 0;
        sumDwell += d;
        if (val?.averageDwellSeconds ?? val?.avgDwell) {
          dwellList.push(val.averageDwellSeconds ?? val.avgDwell);
        }
      });
    }

    if (sumDwell > 0) totalDwellNum = sumDwell;
    if (avgDwellNum === null && dwellList.length > 0) {
      avgDwellNum = dwellList.reduce((a, b) => a + b, 0) / dwellList.length;
    }
  }

  // Fallback to customers list
  if (totalDwellNum === null && analytics.customers && analytics.customers.length > 0) {
    const sum = analytics.customers.reduce((acc, c) => acc + (c.dwellTimeSec || 0), 0);
    totalDwellNum = sum;
    if (avgDwellNum === null) {
      avgDwellNum = sum / analytics.customers.length;
    }
  }

  const avgDwellText = avgDwellNum !== null ? `${avgDwellNum.toFixed(1)}s` : 'N/A';
  const totalDwellText = totalDwellNum !== null ? `${totalDwellNum.toFixed(1)}s` : 'N/A';

  // 5. Shelf Visits
  let totalVisits: number | 'N/A' = 'N/A';
  if (analytics.customerJourney?.totalVisits !== undefined) {
    totalVisits = analytics.customerJourney.totalVisits;
  } else if (analytics.journey?.totalVisits !== undefined) {
    totalVisits = analytics.journey.totalVisits;
  } else if (analytics.shelfMetrics) {
    let sum = 0;
    if (Array.isArray(analytics.shelfMetrics)) {
      analytics.shelfMetrics.forEach((m) => {
        sum += m.visits || 0;
      });
      totalVisits = sum;
    } else if (typeof analytics.shelfMetrics === 'object') {
      Object.values(analytics.shelfMetrics).forEach((v: any) => {
        sum += v?.visits || 0;
      });
      totalVisits = sum;
    }
  }

  // 6. Most Attended Shelf
  let mostAttended = 'N/A';
  if (analytics.mostAttendedShelf) {
    mostAttended = analytics.mostAttendedShelf.replace('shelf_', 'Shelf ').replace('shelf', 'Shelf ');
  } else if (analytics.attentionScores) {
    const sorted = Object.entries(analytics.attentionScores).sort((a, b) => Number(b[1]) - Number(a[1]));
    if (sorted.length > 0) {
      mostAttended = sorted[0][0].replace('shelf_', 'Shelf ').replace('shelf', 'Shelf ');
    }
  }

  // 7. Gaze Confidence / Gaze Success
  let gazeConfidenceText = 'N/A';
  if (analytics.avgConfidence) {
    gazeConfidenceText = String(analytics.avgConfidence);
  } else if (analytics.successfulGazeObservations && analytics.totalGazeObservations) {
    gazeConfidenceText = `${Math.round((analytics.successfulGazeObservations / analytics.totalGazeObservations) * 100)}%`;
  }

  // 8. Product / Object Detections
  let productDetectionsText = 'N/A';
  if (analytics.totalProductsDetected !== undefined && analytics.totalProductsDetected !== null) {
    productDetectionsText = String(analytics.totalProductsDetected);
  } else if (analytics.detectionSummary) {
    const sum =
      (analytics.detectionSummary.person || 0) +
      (analytics.detectionSummary.shoppingCart || 0) +
      (analytics.detectionSummary.otherObjects || 0);
    productDetectionsText = String(sum);
  }

  const kpis = [
    {
      label: 'Unique Customers',
      value: uniqueCustomers,
      subtitle: 'Tracked individuals',
      icon: Users,
      iconColor: 'text-[#008A3E]',
      badgeColor: 'bg-emerald-50',
    },
    {
      label: 'Peak Occupancy',
      value: peakOccupancy,
      subtitle: 'Max concurrent in aisle',
      icon: TrendingUp,
      iconColor: 'text-indigo-600',
      badgeColor: 'bg-indigo-50',
    },
    {
      label: 'Average Dwell Time',
      value: avgDwellText,
      subtitle: 'Avg attention duration',
      icon: Clock,
      iconColor: 'text-amber-600',
      badgeColor: 'bg-amber-50',
    },
    {
      label: 'Total Dwell Time',
      value: totalDwellText,
      subtitle: 'Cumulative aisle engagement',
      icon: Activity,
      iconColor: 'text-sky-600',
      badgeColor: 'bg-sky-50',
    },
    {
      label: 'Shelf Visits',
      value: totalVisits,
      subtitle: 'Shelf zone interactions',
      icon: BarChart2,
      iconColor: 'text-teal-600',
      badgeColor: 'bg-teal-50',
    },
    {
      label: 'Most Attended Shelf',
      value: mostAttended,
      subtitle: 'Highest engagement zone',
      icon: Award,
      iconColor: 'text-rose-600',
      badgeColor: 'bg-rose-50',
    },
    {
      label: 'Gaze Confidence',
      value: gazeConfidenceText,
      subtitle: 'MediaPipe gaze accuracy',
      icon: Eye,
      iconColor: 'text-emerald-700',
      badgeColor: 'bg-emerald-50',
    },
    {
      label: 'Product/Object Detections',
      value: productDetectionsText,
      subtitle: 'Detected aisle items',
      icon: ShoppingBag,
      iconColor: 'text-purple-600',
      badgeColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                {kpi.label}
              </span>
              <div className={`p-1.5 rounded-lg ${kpi.badgeColor} shrink-0`}>
                <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-auto">
              <span className="text-2xl font-black text-slate-900 tracking-tight truncate">
                {kpi.value}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">{kpi.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};
