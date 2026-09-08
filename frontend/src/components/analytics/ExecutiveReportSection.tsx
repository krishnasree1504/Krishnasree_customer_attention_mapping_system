import React from 'react';
import { FileText, Download, FileSpreadsheet, FileJson2, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { VideoAnalytics } from '../../types/analytics';

interface ExecutiveReportSectionProps {
  analytics: VideoAnalytics;
  jobId: string | null;
}

export const ExecutiveReportSection: React.FC<ExecutiveReportSectionProps> = ({ analytics, jobId }) => {
  const pdfUrl = jobId ? `/api/video/report/${jobId}` : '#';

  const handleDownloadPDF = () => {
    if (jobId) {
      window.open(`/api/video/report/${jobId}`, '_blank');
    } else {
      window.open('/api/video/report/latest', '_blank');
    }
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(analytics, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive_analysis_report_${jobId || 'latest'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const rows: string[] = [];
    rows.push('Executive Analysis Report,CAMS Retail Intelligence');
    rows.push(`Job ID,${jobId || 'latest'}`);
    rows.push(`Video File,${analytics.videoFile || 'Analyzed Video'}`);
    rows.push(`Duration,${analytics.videoDuration || analytics.videoLength || 'N/A'}`);
    rows.push(`Resolution,${analytics.resolution || 'N/A'}`);
    rows.push('');
    rows.push('Customer Summary Metric,Value');
    rows.push(`Total People,${analytics.totalPeople}`);
    rows.push(`Unique Customers,${analytics.uniquePeople}`);
    rows.push(`Peak Occupancy,${analytics.maxOccupancy ?? analytics.maxCrowd ?? 0}`);
    rows.push(`Average Occupancy,${analytics.avgOccupancy ?? analytics.avgCrowd ?? 0}`);
    rows.push('');
    rows.push('Shelf Attention,Visits,Total Dwell (sec),Average Dwell (sec),Peak Occupancy,Score');

    if (Array.isArray(analytics.shelfMetrics)) {
      analytics.shelfMetrics.forEach((m) => {
        rows.push(`${m.name || m.shelfId},${m.visits || 0},${m.totalDwellSeconds ?? m.totalDwell ?? 0},${m.averageDwellSeconds ?? m.avgDwell ?? 0},${m.peakOccupancy || 0},${m.attentionScore || 0}`);
      });
    } else if (analytics.shelfMetrics && typeof analytics.shelfMetrics === 'object') {
      Object.entries(analytics.shelfMetrics).forEach(([k, v]: [string, any]) => {
        rows.push(`${v?.name || k},${v?.visits || 0},${v?.totalDwellSeconds ?? v?.totalDwell ?? 0},${v?.averageDwellSeconds ?? v?.avgDwell ?? 0},${v?.peakOccupancy || 0},${v?.attentionScore || 0}`);
      });
    }

    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive_analysis_report_${jobId || 'latest'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
      {/* Report Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#00E676]/20 text-[#008A3E]">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-extrabold text-slate-900">Executive Analysis Report</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consolidated summary of video processing, gaze telemetry, shelf engagement, and AI strategic findings
          </p>
        </div>

        {/* Download & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00E676] hover:bg-[#00c865] text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
          >
            <FileJson2 className="w-4 h-4 text-indigo-600" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Structured Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* 1. Customer Summary */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">1. Customer Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>Total Tracked: <strong className="text-slate-900">{analytics.totalPeople}</strong></div>
            <div>Unique Shoppers: <strong className="text-slate-900">{analytics.uniquePeople}</strong></div>
            <div>Peak Occupancy: <strong className="text-slate-900">{analytics.maxOccupancy ?? analytics.maxCrowd ?? 0}</strong></div>
            <div>Avg Occupancy: <strong className="text-slate-900">{analytics.avgOccupancy !== undefined ? analytics.avgOccupancy.toFixed(1) : analytics.avgCrowd !== undefined ? analytics.avgCrowd.toFixed(1) : 0}</strong></div>
          </div>
        </div>

        {/* 2. Gaze Analysis */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">2. Gaze Analysis</h4>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>Confidence: <strong className="text-slate-900">{analytics.avgConfidence || 'High'}</strong></div>
            <div>Observations: <strong className="text-slate-900">{analytics.totalGazeObservations || analytics.customers?.length || 0}</strong></div>
            <div>Successful Fixations: <strong className="text-slate-900">{analytics.successfulGazeObservations || 0}</strong></div>
            <div>Dominant: <strong className="text-slate-900">{analytics.gazeDistribution ? Object.entries(analytics.gazeDistribution).sort((a,b)=>Number(b[1])-Number(a[1]))[0]?.[0] || 'FORWARD' : 'FORWARD'}</strong></div>
          </div>
        </div>

        {/* 3. Shelf Attention */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">3. Shelf Attention</h4>
          <div className="text-slate-600 space-y-1">
            <div>Most Attended: <strong className="text-slate-900">{analytics.mostAttendedShelf?.replace('shelf_', 'Shelf ') || 'Shelf 1'}</strong></div>
            <div>Total Shelf Visits: <strong className="text-slate-900">{analytics.customerJourney?.totalVisits ?? analytics.journey?.totalVisits ?? 'Recorded in telemetry'}</strong></div>
          </div>
        </div>

        {/* 4. Dwell Time */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">4. Dwell Time</h4>
          <div className="text-slate-600 space-y-1">
            <div>Avg Journey Duration: <strong className="text-slate-900">{analytics.customerJourney?.averageJourneyDurationSec ? `${analytics.customerJourney.averageJourneyDurationSec.toFixed(1)}s` : 'Recorded'}</strong></div>
            <div>Average Shelves Visited: <strong className="text-slate-900">{analytics.customerJourney?.averageShelvesVisited ?? 2}</strong></div>
          </div>
        </div>

        {/* 5. Customer Journey */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">5. Customer Journey</h4>
          <p className="text-slate-600">
            {analytics.customerJourney?.mostCommonPath || analytics.journey?.mostCommonPath || 'Primary aisle trajectory observed from entrance along main shelf zones.'}
          </p>
        </div>

        {/* 6. Product / Object Analysis */}
        <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-2">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">6. Product/Object Analysis</h4>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>Total Detections: <strong className="text-slate-900">{analytics.totalProductsDetected ?? 0}</strong></div>
            <div>Detection Confidence: <strong className="text-slate-900">{analytics.averageProductConfidence || 'High'}</strong></div>
          </div>
        </div>
      </div>

      {/* 7. Heatmap & Data Quality Status */}
      <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900">7. Data Quality Verification</h4>
            <p className="text-slate-500">
              Confidence Rating: <strong className="text-emerald-900">{analytics.dataQuality?.confidence || 'High'}</strong> | Frames Processed: {analytics.framesProcessed} | Resolution: {analytics.resolution || '1920x1080'}
            </p>
          </div>
        </div>
        <div className="text-slate-600 font-mono text-[11px]">
          Heatmap Status: {analytics.heatmapData && analytics.heatmapData.length > 0 ? `${analytics.heatmapData.length} active coordinate points` : 'Unavailable'}
        </div>
      </div>
    </div>
  );
};
