import { useState, useEffect, useCallback } from 'react';
import { VideoAnalytics } from '../types/analytics';

export const STORAGE_KEY_PREFIX = 'cams_active_video_analysis_';
export const LEGACY_STORAGE_KEY = 'cams_active_video_analysis';
export const ANALYSIS_COMPLETED_EVENT = 'cams_video_analysis_completed';
export const ANALYSIS_CLEARED_EVENT = 'cams_video_analysis_cleared';

export interface ActiveVideoAnalysis {
  jobId: string;
  analytics: VideoAnalytics;
  videoUrl?: string | null;
  processedVideoUrl?: string | null;
  videoFileName?: string;
  videoFileSize?: number;
  selectedStoreId?: string;
  videoMode?: 'processed' | 'original';
  userId?: string;
  completedAt: number;
}

let inMemoryActiveAnalysis: ActiveVideoAnalysis | null = null;

export function isValidCompletedAnalysis(analytics: any): boolean {
  if (!analytics) return false;
  if (analytics.jobId === 'seed_demo') return false;
  const hasPeople =
    (typeof analytics.totalPeople === 'number' && analytics.totalPeople > 0) ||
    (typeof analytics.uniquePeople === 'number' && analytics.uniquePeople > 0);
  const hasCustomers = Array.isArray(analytics.customers) && analytics.customers.length > 0;
  const hasFrames =
    typeof analytics.framesProcessed === 'number' && analytics.framesProcessed > 0 && analytics.success;
  return Boolean(hasPeople || hasCustomers || hasFrames);
}

function getStorageKey(userId?: string): string {
  return userId ? `${STORAGE_KEY_PREFIX}${userId}` : LEGACY_STORAGE_KEY;
}

/**
 * Get active video analysis payload from in-memory cache or sessionStorage
 * NOTE: Never fallback to global / latest disk files!
 */
export function getActiveVideoAnalysis(userId?: string): ActiveVideoAnalysis | null {
  // 1. Check in-memory active analysis
  if (inMemoryActiveAnalysis && isValidCompletedAnalysis(inMemoryActiveAnalysis.analytics)) {
    if (!userId || !inMemoryActiveAnalysis.userId || inMemoryActiveAnalysis.userId === userId) {
      return inMemoryActiveAnalysis;
    }
  }

  // 2. Check sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const storageKey = getStorageKey(userId);
      let raw = sessionStorage.getItem(storageKey);

      // Fallback check if userId was provided but was saved under legacy or vice versa
      if (!raw && userId) {
        raw = sessionStorage.getItem(LEGACY_STORAGE_KEY);
      }

      if (raw) {
        const parsed: ActiveVideoAnalysis = JSON.parse(raw);
        if (parsed && isValidCompletedAnalysis(parsed.analytics)) {
          if (!userId || !parsed.userId || parsed.userId === userId) {
            inMemoryActiveAnalysis = parsed;
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('[VideoAnalysisSync] Failed to read sessionStorage cache', err);
    }
  }

  return null;
}

/**
 * Save active video analysis payload to memory & sessionStorage and notify components
 */
export function saveActiveVideoAnalysis(data: {
  analytics: VideoAnalytics;
  jobId: string;
  videoUrl?: string | null;
  processedVideoUrl?: string | null;
  videoFileName?: string;
  videoFileSize?: number;
  selectedStoreId?: string;
  videoMode?: 'processed' | 'original';
  userId?: string;
}): void {
  if (!isValidCompletedAnalysis(data.analytics)) {
    return;
  }

  const payload: ActiveVideoAnalysis = {
    jobId: data.jobId,
    analytics: data.analytics,
    videoUrl: data.videoUrl || data.analytics.videoUrl || null,
    processedVideoUrl: data.processedVideoUrl || data.analytics.processedVideoUrl || null,
    videoFileName: data.videoFileName || data.analytics.videoFile,
    videoFileSize: data.videoFileSize || data.analytics.videoSize,
    selectedStoreId: data.selectedStoreId,
    videoMode: data.videoMode || 'processed',
    userId: data.userId,
    completedAt: Date.now(),
  };

  inMemoryActiveAnalysis = payload;

  if (typeof window !== 'undefined') {
    try {
      const storageKey = getStorageKey(data.userId);
      sessionStorage.setItem(storageKey, JSON.stringify(payload));
      sessionStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(payload));
    } catch (storageErr) {
      console.warn('[VideoAnalysisSync] Failed to write sessionStorage cache', storageErr);
    }

    window.dispatchEvent(new CustomEvent(ANALYSIS_COMPLETED_EVENT, { detail: payload }));
  }
}

/**
 * Explicitly clear active video analysis from memory and all session storage
 * (called on explicit user deletion, and on logout / fresh login)
 */
export function clearActiveVideoAnalysis(userId?: string): void {
  inMemoryActiveAnalysis = null;

  if (typeof window !== 'undefined') {
    try {
      if (userId) {
        sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
      }
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);

      // Also cleanup any other leftover analysis keys in sessionStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith(STORAGE_KEY_PREFIX) || k === LEGACY_STORAGE_KEY)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (err) {
      console.warn('[VideoAnalysisSync] Failed to clear sessionStorage', err);
    }

    window.dispatchEvent(new CustomEvent(ANALYSIS_CLEARED_EVENT));
  }
}

/**
 * React hook to subscribe to the active video analysis
 */
export function useActiveVideoAnalysis(userId?: string) {
  const [activeAnalysis, setActiveAnalysis] = useState<ActiveVideoAnalysis | null>(() =>
    getActiveVideoAnalysis(userId)
  );

  useEffect(() => {
    // Synchronize whenever userId changes or on mount
    const current = getActiveVideoAnalysis(userId);
    setActiveAnalysis(current);

    const handleCompleted = (e: Event) => {
      const customEvt = e as CustomEvent<ActiveVideoAnalysis>;
      if (customEvt.detail) {
        if (!userId || !customEvt.detail.userId || customEvt.detail.userId === userId) {
          setActiveAnalysis(customEvt.detail);
        }
      }
    };

    const handleCleared = () => {
      setActiveAnalysis(null);
    };

    window.addEventListener(ANALYSIS_COMPLETED_EVENT, handleCompleted);
    window.addEventListener(ANALYSIS_CLEARED_EVENT, handleCleared);

    return () => {
      window.removeEventListener(ANALYSIS_COMPLETED_EVENT, handleCompleted);
      window.removeEventListener(ANALYSIS_CLEARED_EVENT, handleCleared);
    };
  }, [userId]);

  return {
    activeAnalysis,
    analytics: activeAnalysis?.analytics || null,
    jobId: activeAnalysis?.jobId || null,
    videoUrl: activeAnalysis?.videoUrl || null,
    processedVideoUrl: activeAnalysis?.processedVideoUrl || null,
    videoFileName: activeAnalysis?.videoFileName,
    videoFileSize: activeAnalysis?.videoFileSize,
    selectedStoreId: activeAnalysis?.selectedStoreId,
    videoMode: activeAnalysis?.videoMode || 'processed',
    isLoading: false,
    clearAnalysis: useCallback(() => clearActiveVideoAnalysis(userId), [userId]),
  };
}

