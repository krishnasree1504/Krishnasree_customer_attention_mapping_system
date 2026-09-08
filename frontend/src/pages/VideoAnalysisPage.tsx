import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { Store } from '../types';
import {
  Upload,
  FileVideo,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  TrendingUp,
  ShieldCheck,
  Layers,
  Sparkles,
  Sliders,
  BarChart3,
  Maximize2,
  Trash2,
  Store as StoreIcon,
  Video,
  Clock,
} from 'lucide-react';

import { ShelfAttractionChart } from '../components/analytics/ShelfAttractionChart';
import { AttentionHeatMap } from '../components/analytics/AttentionHeatMap';
import { RetailOptimization } from '../components/analytics/RetailOptimization';
import { ShelfMetricsTable } from '../components/analytics/ShelfMetricsTable';
import { GazeAnalysisPanel } from '../components/analytics/GazeAnalysisPanel';
import { CustomerTrackingTable } from '../components/analytics/CustomerTrackingTable';
import { CvDiagnosticsPanel } from '../components/analytics/CvDiagnosticsPanel';
import { ProductAttractivenessPanel } from '../components/analytics/ProductAttractivenessPanel';
import { ConsumerBehaviorIntelligencePanel } from '../components/analytics/ConsumerBehaviorIntelligencePanel';
import { CustomerPathwayPanel } from '../components/analytics/CustomerPathwayPanel';
import { VideoAnalytics } from '../types/analytics';
import { useAuth } from '../context/AuthContext';
import {
  useActiveVideoAnalysis,
  saveActiveVideoAnalysis,
  isValidCompletedAnalysis,
} from '../lib/videoAnalysisSync';

const STAGES = [
  'Uploading Video to Server...',
  'Loading YOLOv8n & MediaPipe Models...',
  'Extracting Frames & Video Geometry...',
  'Running ByteTrack Customer Tracking...',
  'Computing Gaze Vectors & Angles...',
  'Calculating Shelf Dwell & SKU Detections...',
  'Generating PDF Report & Analytics...',
];

export const VideoAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const {
    analytics: persistedAnalytics,
    jobId: persistedJobId,
    videoUrl: persistedVideoUrl,
    processedVideoUrl: persistedProcessedVideoUrl,
    videoFileName: persistedFileName,
    videoFileSize: persistedFileSize,
    selectedStoreId: persistedStoreId,
    videoMode: persistedVideoMode,
    clearAnalysis,
  } = useActiveVideoAnalysis(user?.id);

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(() => persistedStoreId || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(
    () =>
      persistedProcessedVideoUrl ||
      persistedVideoUrl ||
      persistedAnalytics?.processedVideoUrl ||
      persistedAnalytics?.videoUrl ||
      null
  );
  const [persistedInfo, setPersistedInfo] = useState<{ name: string; size: number } | null>(() => {
    if (persistedFileName && persistedFileSize) {
      return { name: persistedFileName, size: persistedFileSize };
    }
    if (persistedAnalytics?.videoFile) {
      return { name: persistedAnalytics.videoFile, size: persistedAnalytics.videoSize || 0 };
    }
    return null;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState<number>(10);
  const [jobId, setJobId] = useState<string | null>(() => persistedJobId || persistedAnalytics?.jobId || null);
  const [analytics, setAnalytics] = useState<VideoAnalytics | null>(() => persistedAnalytics);
  const [videoMode, setVideoMode] = useState<'processed' | 'original'>(() => persistedVideoMode || 'processed');
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize with persisted active analysis during frontend navigation or session restore
  useEffect(() => {
    if (persistedAnalytics && isValidCompletedAnalysis(persistedAnalytics)) {
      setAnalytics(persistedAnalytics);
      setJobId(persistedJobId || persistedAnalytics.jobId || null);
      const url =
        persistedProcessedVideoUrl ||
        persistedVideoUrl ||
        persistedAnalytics.processedVideoUrl ||
        persistedAnalytics.videoUrl;
      if (url && !selectedFile) {
        setVideoPreviewUrl(url);
      }
      if (persistedFileName && persistedFileSize) {
        setPersistedInfo({ name: persistedFileName, size: persistedFileSize });
      } else if (persistedAnalytics.videoFile) {
        setPersistedInfo({ name: persistedAnalytics.videoFile, size: persistedAnalytics.videoSize || 0 });
      }
      if (persistedStoreId) {
        setSelectedStoreId(persistedStoreId);
      }
      if (persistedVideoMode) {
        setVideoMode(persistedVideoMode);
      }
    } else if (!persistedAnalytics && !selectedFile) {
      setAnalytics(null);
      setJobId(null);
      setVideoPreviewUrl(null);
      setPersistedInfo(null);
    }
  }, [
    persistedAnalytics,
    persistedJobId,
    persistedVideoUrl,
    persistedProcessedVideoUrl,
    persistedFileName,
    persistedFileSize,
    persistedStoreId,
    persistedVideoMode,
    selectedFile,
  ]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get('/stores');
        if (Array.isArray(res.data) && res.data.length > 0) {
          setStores(res.data);
          setSelectedStoreId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch stores in VideoAnalysisPage', err);
      }
    };
    fetchStores();
  }, []);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    const validExts = ['.mp4', '.avi', '.mov', '.mkv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExts.includes(ext)) {
      setErrorMessage(`Unsupported format "${ext}". Please upload MP4, AVI, MOV, or MKV.`);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    setAnalytics(null);
    setJobId(null);
    setPersistedInfo({ name: file.name, size: file.size });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDeleteAnalysis = async () => {
    const currentJobId = jobId || persistedJobId || analytics?.jobId;
    if (currentJobId) {
      try {
        await fetch(`/api/video/jobs/${currentJobId}`, { method: 'DELETE' });
      } catch (delErr) {
        console.warn('Failed to notify backend of job deletion:', delErr);
      }
    }

    clearAnalysis();

    if (videoPreviewUrl && videoPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setSelectedFile(null);
    setVideoPreviewUrl(null);
    setAnalytics(null);
    setJobId(null);
    setPersistedInfo(null);
    setIsAnalyzing(false);
    setIsUploading(false);
    setProgressPercent(0);
    setCurrentStageIndex(0);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    handleDeleteAnalysis();
  };

  const runAnalysisPipeline = async (activeJobId?: string, uploadedVideoUrl?: string) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setProgressPercent(5);
    setCurrentStageIndex(1);
    setEstimatedTime(10);

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 92) {
          return 92;
        }
        const next = prev + Math.floor(Math.random() * 8) + 4;
        const stageIdx = Math.min(STAGES.length - 1, Math.floor((next / 100) * STAGES.length));
        setCurrentStageIndex(stageIdx);
        setEstimatedTime((t) => Math.max(1, t - 1));
        return next;
      });
    }, 400);

    try {
      const targetJobId = activeJobId || jobId || persistedJobId || `job_${Date.now()}`;
      const response = await fetch('/api/video/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: targetJobId }),
      });

      const resText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch {
        console.warn('Non-JSON response received from analyze endpoint:', resText);
      }

      clearInterval(interval);
      setProgressPercent(100);
      setCurrentStageIndex(STAGES.length - 1);

      setTimeout(() => {
        if (response.ok && data && data.analytics) {
          setAnalytics(data.analytics);
          const finalJobId = data.jobId || targetJobId;
          setJobId(finalJobId);
          setErrorMessage(null);

          const finalVideoUrl =
            uploadedVideoUrl ||
            data.analytics.videoUrl ||
            persistedVideoUrl ||
            videoPreviewUrl;
          const finalProcessedUrl = data.analytics.processedVideoUrl || finalVideoUrl;
          if (finalProcessedUrl) {
            setVideoPreviewUrl(finalProcessedUrl);
          }

          const fileName =
            selectedFile?.name ||
            persistedInfo?.name ||
            persistedFileName ||
            data.analytics.videoFile ||
            'surveillance_video.mp4';
          const fileSize =
            selectedFile?.size ||
            persistedInfo?.size ||
            persistedFileSize ||
            data.analytics.videoSize ||
            0;

          setPersistedInfo({ name: fileName, size: fileSize });

          saveActiveVideoAnalysis({
            analytics: data.analytics,
            jobId: finalJobId,
            videoUrl: finalVideoUrl,
            processedVideoUrl: finalProcessedUrl,
            videoFileName: fileName,
            videoFileSize: fileSize,
            selectedStoreId,
            videoMode,
            userId: user?.id,
          });
        } else {
          const detailMsg =
            data?.error ||
            data?.message ||
            'Computer vision video analysis failed to generate analytics.';
          setErrorMessage(detailMsg);
        }
        setIsAnalyzing(false);
      }, 500);
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      console.error('Analysis error:', err);
      setErrorMessage(`Failed to complete video analysis: ${err.message || 'Server error'}`);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      if (jobId || persistedJobId) {
        await runAnalysisPipeline(jobId || persistedJobId || undefined);
      }
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setProgressPercent(2);
    setCurrentStageIndex(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);

      const uploadRes = await fetch('/api/video/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadText = await uploadRes.text();
      let uploadData: any = {};
      try {
        uploadData = JSON.parse(uploadText);
      } catch {
        console.warn('Non-JSON upload response received:', uploadText);
      }

      setIsUploading(false);

      if (uploadRes.ok && uploadData && uploadData.jobId) {
        setJobId(uploadData.jobId);
        const serverVideoUrl = uploadData.videoUrl;
        await runAnalysisPipeline(uploadData.jobId, serverVideoUrl);
      } else {
        const errorMsg = uploadData?.message || uploadData?.error || 'Failed to upload video to server.';
        setErrorMessage(errorMsg);
      }
    } catch (err: any) {
      setIsUploading(false);
      console.error('Upload Error:', err);
      setErrorMessage(`Upload failed: ${err.message || 'Network error'}`);
    }
  };

  const handleDownloadReport = () => {
    const idToUse = jobId || persistedJobId || 'default';
    window.open(`/api/video/report/${idToUse}`, '_blank');
  };

  // Helper for Crowd Status styling
  const getCrowdBadgeStyle = (level?: string, percentage: number = 0) => {
    if (percentage <= 20 || level === 'Very Low') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (percentage <= 40 || level === 'Low') {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    if (percentage <= 60 || level === 'Medium') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (percentage <= 80 || level === 'High') {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
  };

  const hasActiveVideoOrAnalysis = Boolean(
    selectedFile || videoPreviewUrl || analytics || persistedAnalytics
  );

  const activeFileName =
    selectedFile?.name ||
    persistedInfo?.name ||
    persistedFileName ||
    analytics?.videoFile ||
    'Surveillance Video';

  const activeFileSizeFormatted = selectedFile
    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
    : persistedInfo?.size || persistedFileSize
    ? `${((persistedInfo?.size || persistedFileSize!) / (1024 * 1024)).toFixed(2)} MB`
    : 'Recorded Footage';

  const activeFileFormat = activeFileName.split('.').pop()?.toUpperCase() || 'MP4';

  const activeVideoUrl =
    videoMode === 'processed' && (analytics?.processedVideoUrl || persistedProcessedVideoUrl)
      ? analytics?.processedVideoUrl || persistedProcessedVideoUrl
      : videoPreviewUrl || persistedVideoUrl || analytics?.videoUrl;

  return (
    <div className="space-y-8 pb-16 w-full max-w-full min-w-0">
      {/* Top Banner Header with Clean Title & Workflow Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#00E676]/15 text-[#008A3E] border border-[#00E676]/40">
                YOLOv8 + ByteTrack + MediaPipe
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                Real Computer Vision Pipeline
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Store Video Analysis & Attention Mapping
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Surveillance video processing with persistent customer tracking, 3D gaze estimation, shelf dwell times, and attention scoring.
            </p>
          </div>

          {analytics && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDeleteAnalysis}
                className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all flex items-center gap-2 cursor-pointer"
                title="Delete completed analysis"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Analysis</span>
              </button>
              <button
                onClick={handleDownloadReport}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#00E676] hover:bg-[#00c865] text-slate-950 shadow-md shadow-[#00E676]/25 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Executive PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* ATTENTION WORKFLOW BANNER */}
        <div className="pt-2 border-t border-slate-100 w-full min-w-0">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[11px] font-semibold text-slate-600 max-w-full">
            <span className="text-slate-400 font-bold uppercase text-[10px] mr-1 shrink-0">Attention Workflow:</span>
            {[
              'Video Footage',
              'YOLOv8 Detection',
              'ByteTrack Tracking',
              'MediaPipe Gaze',
              'Shelf Association',
              'Dwell Calculation',
              'Attention Scoring',
              'Executive Report',
            ].map((step, idx, arr) => (
              <React.Fragment key={step}>
                <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 whitespace-nowrap shrink-0">
                  {step}
                </span>
                {idx < arr.length - 1 && (
                  <span className="text-slate-300 font-bold px-0.5 shrink-0">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 text-sm font-semibold w-full min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span className="break-words">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-600 underline font-bold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* SECTION 1: VIDEO UPLOAD & CONFIGURATION CONTROL BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#00E676]/15 text-[#008A3E] shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">1. Video Upload & Selection</h2>
              <p className="text-xs text-slate-500">Supports MP4, AVI, MOV, MKV files up to 500 MB</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Store Location Selection */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <StoreIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            {hasActiveVideoOrAnalysis && (
              <button
                onClick={handleDeleteAnalysis}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 border border-slate-200 cursor-pointer"
                title="Delete analysis and reset upload"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{analytics ? 'Delete Analysis' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        {!hasActiveVideoOrAnalysis ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 w-full ${
              dragOver
                ? 'border-[#00E676] bg-[#00E676]/5 scale-[1.01]'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".mp4,.avi,.mov,.mkv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#008A3E]">
              <FileVideo className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                Drag and drop your surveillance store footage here
              </p>
              <p className="text-xs text-slate-500">
                or click <span className="text-[#008A3E] font-bold underline">Browse Files</span> from your computer
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                MP4
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                AVI
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                MOV
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                MKV
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50 p-4 rounded-xl border border-slate-200 w-full min-w-0">
            {/* Video Player Preview / Thumbnail */}
            <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video border border-slate-300 flex items-center justify-center group shadow-sm w-full">
              {activeVideoUrl ? (
                <video
                  src={activeVideoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                  <FileVideo className="w-10 h-10" />
                  <span className="text-xs font-bold">Video Selected</span>
                </div>
              )}
            </div>

            {/* Video Metadata Info */}
            <div className="space-y-2 md:col-span-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                  {analytics ? 'Analysis Complete' : 'Ready for Pipeline'}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 truncate" title={activeFileName}>
                {activeFileName}
              </h3>
              <div className="text-xs text-slate-500 space-y-1 font-medium">
                <p>File Size: <span className="font-bold text-slate-700">{activeFileSizeFormatted}</span></p>
                <p>Format: <span className="font-bold text-slate-700 uppercase">{activeFileFormat}</span></p>
                <p>Pipeline: <span className="font-bold text-emerald-600">YOLOv8 + MediaPipe</span></p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center md:col-span-1">
              <button
                disabled={isUploading || isAnalyzing}
                onClick={selectedFile ? handleUploadAndAnalyze : () => runAnalysisPipeline()}
                className={`w-full py-3 px-5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAnalyzing || isUploading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#00E676] hover:bg-[#00c865] text-slate-950 shadow-md shadow-[#00E676]/25'
                }`}
              >
                {isAnalyzing || isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950" />
                    <span>{analytics ? 'Re-run Analysis Pipeline' : 'Run Attention Analysis Pipeline'}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDeleteAnalysis}
                disabled={isAnalyzing || isUploading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>{analytics ? 'Delete Analysis & Video' : 'Choose Different Video'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ANALYSIS PROGRESS INDICATOR */}
      {(isAnalyzing || isUploading) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5 animate-fadeIn w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00E676] animate-ping" />
              <h3 className="text-sm font-bold text-slate-900">
                {STAGES[currentStageIndex]}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">
                Est. Remaining: <span className="text-slate-900 font-extrabold">{estimatedTime}s</span>
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-[#00E676]/15 text-[#008A3E] border border-[#00E676]/30">
                Models: YOLOv8 + MediaPipe
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="bg-gradient-to-r from-[#00E676] to-[#00B0FF] h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>Stage {currentStageIndex + 1} of {STAGES.length}</span>
              <span className="font-extrabold text-slate-900">{progressPercent}%</span>
            </div>
          </div>

          {/* Stepper Stage Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
            {STAGES.map((stg, idx) => {
              const isDone = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={stg}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : isCurrent
                      ? 'bg-[#00E676]/10 border-[#00E676] text-slate-900 font-bold ring-2 ring-[#00E676]/20'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <p className="text-[10px] leading-tight font-medium truncate">{stg}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: PROCESSED VIDEO VIEWER & ATTENTION DASHBOARD */}
      {analytics && (
        <div className="space-y-8 animate-fadeIn w-full min-w-0">
          {/* Executive Summary Bar */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full min-w-0">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#00E676] shrink-0" />
                <span className="text-xs font-bold text-[#00E676] uppercase tracking-wider">
                  Computer Vision Processing Complete
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Attention & Gaze Intelligence Results
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                {analytics.aiSummary || `Tracked ${analytics.uniquePeople} shoppers with ${analytics.avgConfidence} detection accuracy.`}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDownloadReport}
                className="px-5 py-3 rounded-xl font-extrabold text-xs bg-[#00E676] text-slate-950 hover:bg-[#00c865] shadow-lg shadow-[#00E676]/25 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Executive PDF Report</span>
              </button>
            </div>
          </div>

          {/* LIVE PROCESSED VIDEO PLAYER WITH CV ANNOTATIONS */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#008A3E] shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
                    <span>Annotated Computer Vision Video Stream</span>
                    {analytics.processedVideoUrl && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00E676]/20 text-[#008A3E] border border-[#00E676]/40">
                        Live Annotations Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Displays persistent ByteTrack customer IDs, gaze direction vectors, and shelf interaction polygons.
                  </p>
                </div>
              </div>

              {/* Toggle Video Feed View */}
              {analytics.processedVideoUrl && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    onClick={() => setVideoMode('processed')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      videoMode === 'processed'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    CV Annotated Video
                  </button>
                  <button
                    onClick={() => setVideoMode('original')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      videoMode === 'original'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Original Video
                  </button>
                </div>
              )}
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video border border-slate-800 shadow-inner flex items-center justify-center w-full">
              <video
                key={activeVideoUrl}
                src={activeVideoUrl || undefined}
                controls
                autoPlay={false}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-[10px] font-mono flex items-center gap-2 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
                <span>{analytics.resolution || '1920x1080'} @ {analytics.fps || 30} FPS</span>
              </div>
            </div>
          </div>

          {/* 8 DASHBOARD KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
            {/* 1. Total People */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Footfall</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{analytics.totalFootfall ?? analytics.totalPeople}</p>
              <p className="text-[11px] font-semibold text-emerald-600 truncate">
                Unique: <span className="font-extrabold text-slate-800">{analytics.uniquePeople}</span>
              </p>
            </div>

            {/* 2. Crowd Percentage */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Crowd Density</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{analytics.crowdPercentage}%</p>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${getCrowdBadgeStyle(analytics.crowdLevel, analytics.crowdPercentage)}`}>
                  {analytics.crowdLevel} Level
                </span>
              </div>
            </div>

            {/* 3. Peak Occupancy */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Peak Occupancy</span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600 shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{analytics.maxCrowd}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                Simultaneous Shoppers
              </p>
            </div>

            {/* 4. Average Occupancy */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Occupancy</span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{analytics.avgCrowd}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                Shoppers / frame
              </p>
            </div>

            {/* 5. In / Out Crossings */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Line Crossings</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                {analytics.entries ?? 0} In / {analytics.exits ?? 0} Out
              </p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                Virtual Aisle Perimeter
              </p>
            </div>

            {/* 6. AI Detection Accuracy */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">YOLOv8 Accuracy</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{analytics.avgConfidence}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                Range: {analytics.minConfidence || '70%'} - {analytics.maxConfidence || '98%'}
              </p>
            </div>

            {/* 7. Total Products Detected */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">SKU Products</span>
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{analytics.totalProductsDetected || 0}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                SKU-110K Detections
              </p>
            </div>

            {/* 8. Frames Processed */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Frames Analyzed</span>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{analytics.framesProcessed}</p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                Duration: {analytics.videoLength || analytics.videoDuration || '0:00'}
              </p>
            </div>
          </div>

          {/* SECTION 2: ANALYSIS OVERVIEW & CV PIPELINE AUDIT */}
          <CvDiagnosticsPanel analytics={analytics} />

          {/* SECTION 3: PRODUCT ATTRACTIVENESS */}
          <ProductAttractivenessPanel
            productAttractiveness={analytics.productAttractiveness}
            productEngagement={analytics.productEngagement}
            productsPerCategory={analytics.productsPerCategory}
            totalProductsDetected={analytics.totalProductsDetected}
            mostFrequentProduct={analytics.mostFrequentProduct}
            averageProductConfidence={analytics.averageProductConfidence}
          />

          {/* SECTION 4: CONSUMER BEHAVIOR INTELLIGENCE */}
          <ConsumerBehaviorIntelligencePanel
            behaviorIntelligence={analytics.behaviorIntelligence}
            customers={analytics.customers}
          />

          {/* SECTIONS 5: CUSTOMER PATHWAY & STORE TRAJECTORY */}
          <CustomerPathwayPanel
            journey={analytics.customerJourney || analytics.journey}
            customers={analytics.customers}
            customerProfiles={analytics.behaviorIntelligence?.customerProfiles}
            heatmapData={analytics.heatmapData}
          />

          {/* SECTION 6: EXISTING SHELF & ATTENTION ANALYSIS */}
          <div className="space-y-6 w-full min-w-0">
            {/* MediaPipe 3D Gaze Estimation & Direction Analysis */}
            <GazeAnalysisPanel
              gazeDistribution={analytics.gazeDistribution}
              totalObservations={analytics.totalGazeObservations}
              successfulObservations={analytics.successfulGazeObservations}
              averageConfidence={analytics.avgConfidence}
            />

            {/* Shopper tracking and individual gaze records */}
            <CustomerTrackingTable customers={analytics.customers} />

            {/* Shelf Zone Attention Analysis */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 w-full min-w-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                    6. Shelf Zone Attention Analysis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Evaluation of shelf attraction score, visitor dwell times, and customer traffic volume.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
              </div>

              {/* Most Attractive Shelf Highlight Banner */}
              {analytics.mostAttendedShelf && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl border border-slate-700 shadow-md space-y-3 w-full min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#00E676]">
                        Top Attention Zone
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-[#00E676] text-slate-950 shadow-sm">
                      {analytics.attentionScores?.[analytics.mostAttendedShelf] ?? 0}% Attention Score
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-lg sm:text-xl font-black capitalize text-white truncate">
                        {analytics.mostAttendedShelf.replace('shelf', 'Shelf ').replace('_', ' ')}
                      </h4>
                      <p className="text-xs text-slate-300">
                        Highest customer attraction score across all analyzed zones in this recording.
                      </p>
                    </div>

                    {analytics.shelfMetrics && (
                      <div className="grid grid-cols-3 gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-center shrink-0">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Visitors</p>
                          <p className="text-sm font-extrabold text-[#00E676]">
                            {Array.isArray(analytics.shelfMetrics)
                              ? analytics.shelfMetrics.find((m) => m.shelfId === analytics.mostAttendedShelf)?.visits || 0
                              : (analytics.shelfMetrics as any)[analytics.mostAttendedShelf]?.visits || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Avg Dwell</p>
                          <p className="text-sm font-extrabold text-white">
                            {Array.isArray(analytics.shelfMetrics)
                              ? `${analytics.shelfMetrics.find((m) => m.shelfId === analytics.mostAttendedShelf)?.averageDwellSeconds || 0}s`
                              : `${(analytics.shelfMetrics as any)[analytics.mostAttendedShelf]?.averageDwellSeconds || 0}s`}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Total Dwell</p>
                          <p className="text-sm font-extrabold text-sky-400">
                            {Array.isArray(analytics.shelfMetrics)
                              ? `${analytics.shelfMetrics.find((m) => m.shelfId === analytics.mostAttendedShelf)?.totalDwellSeconds || 0}s`
                              : `${(analytics.shelfMetrics as any)[analytics.mostAttendedShelf]?.totalDwellSeconds || 0}s`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shelf Attraction Ranking Chart */}
              {analytics.attentionScores && Object.keys(analytics.attentionScores).length > 0 && (
                <div className="space-y-3 w-full min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Shelf Attention Scores Ranking
                  </h4>
                  <div className="w-full min-w-0 overflow-hidden">
                    <ShelfAttractionChart attentionScores={analytics.attentionScores} />
                  </div>
                </div>
              )}

              {/* SHELF METRICS DETAILED TABLE */}
              <div className="space-y-3 pt-2 w-full min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Shelf Dwell & Visitor Metrics Breakdown
                </h4>
                <div className="w-full min-w-0 overflow-hidden">
                  <ShelfMetricsTable
                    shelfMetrics={analytics.shelfMetrics}
                    attentionScores={analytics.attentionScores}
                  />
                </div>
              </div>
            </div>

            {/* ATTENTION HEAT MAP */}
            <AttentionHeatMap
              heatmapData={analytics.heatmapData}
              attentionScores={analytics.attentionScores}
              shelfMetrics={analytics.shelfMetrics}
              customers={analytics.customers}
              mostAttendedShelf={analytics.mostAttendedShelf}
              resolution={analytics.resolution}
            />
          </div>

          {/* SECTION 7: MERCHANDISING INSIGHTS & OPTIMIZATION RECOMMENDATIONS */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 w-full min-w-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                  7. Merchandising Insights & Optimization Recommendations
                </h3>
                <p className="text-xs text-slate-500">
                  Actionable retail decisions derived from customer gaze attention, product attractiveness, and dwell times.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="w-full min-w-0">
              <RetailOptimization
                insights={analytics.insights || [analytics.aiSummary || 'Store video processed successfully.']}
                optimizations={analytics.optimizations || analytics.aiRecommendations || []}
              />
            </div>
          </div>

          {/* READY TO SHARE ANALYSIS REPORT */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 w-full min-w-0">
            <div className="space-y-1 min-w-0 text-center sm:text-left">
              <h4 className="text-base font-extrabold text-slate-900">
                Ready to Share Analysis Report
              </h4>
              <p className="text-xs text-slate-500">
                Download the complete PDF report with KPI charts, customer records, and shelf attention metrics.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleDownloadReport}
                className="px-6 py-3 rounded-xl font-extrabold text-xs bg-[#00E676] hover:bg-[#00c865] text-slate-950 shadow-md shadow-[#00E676]/25 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
