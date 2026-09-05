export interface GazeObservation {
  customerId: number;
  direction: string; // UP, DOWN, LEFT, RIGHT, FORWARD, UNKNOWN
  confidence: number; // 0-1
  yaw?: number;
  pitch?: number;
}

export interface GazeDistribution {
  UP: number;
  DOWN: number;
  LEFT: number;
  RIGHT: number;
  FORWARD: number;
  UNKNOWN: number;
}

export interface CustomerTrackingRecord {
  customerId: number;
  customerLabel: string;
  trackDurationSec: number;
  dominantGaze: string;
  gazeConfidence: number;
  yaw?: number | null;
  pitch?: number | null;
  associatedShelf: string;
  associatedShelfId?: string | null;
  dwellTimeSec: number;
  shelfDwellBreakdown?: Record<string, number>;
  visitedShelves?: string[];
  pathCoordinates?: Array<[number, number]>;
  behaviorSegment?: string;
  behaviorScore?: number;
}

export interface ShelfMetric {
  shelfId?: string;
  name?: string;
  uniqueVisitorsCount?: number;
  visits: number;
  totalDwell?: number; // seconds
  avgDwell?: number; // seconds
  totalDwellSeconds?: number;
  averageDwellSeconds?: number;
  maxDwellSeconds?: number;
  peakOccupancy: number;
  attentionScore?: number; // 0-100
}

export interface ProductEngagementItem {
  productId: string;
  productName: string;
  shelfId: string;
  uniqueCustomers: number;
  interactions: number;
  totalEngagementTime: number;
  averageEngagementTime: number;
  engagementScore: number;
  detectedItemsCount?: number;
}

export interface ProductAttractivenessItem {
  productId: string;
  productName?: string;
  category?: string;
  attractivenessScore: number;
  attractivenessLevel: 'Highly Attractive' | 'Attractive' | 'Moderately Attractive' | 'Low Attractiveness' | string;
  uniqueCustomers: number;
  totalEngagementTime: number; // in seconds
  interactions: number;
  detectedItemsCount?: number;
  detectionCount?: number;
  confidence?: number | string;
}

export interface BehaviorCustomerProfile {
  customerId: number;
  customerLabel: string;
  journeyDurationSec: number;
  totalDwellTimeSec: number;
  shelvesVisited: number;
  favoriteShelf: string | null;
  favoriteShelfDwellSec: number;
  movementDistance: number;
  attentionEvents: number;
  gazeConfidence: number;
  dominantGaze: string;
  behaviorSegment: string;
  behaviorScore: number;
  shelfDwellBreakdown?: Record<string, number>;
}

export interface BehaviorShoppingPatterns {
  averageJourneyDurationSec?: number;
  averageDwellTimeSec?: number;
  averageShelvesVisited?: number;
  averageMovementDistance?: number;
  averageAttentionEvents?: number;
}

export interface BehaviorIntelligenceData {
  customerProfiles?: BehaviorCustomerProfile[];
  segmentDistribution?: Record<string, number>;
  dominantCustomerSegment?: string | null;
  shoppingPatterns?: BehaviorShoppingPatterns;
  totalCustomersAnalyzed?: number;
}

export interface CustomerRetentionData {
  returningCustomers?: number;
  newCustomers?: number;
  returnRate?: number | string;
  repeatVisits?: number;
  retentionRate?: number | string;
  historicalSessionsCount?: number;
  isSingleSession?: boolean;
  notes?: string;
}

export interface DataQuality {
  confidence: 'High' | 'Medium' | 'Low' | string;
  customersDetected: number;
  validTracks: number;
  framesProcessed: number;
  totalProductsDetected: number;
  averageDetectionConfidence: string;
  notes: string;
}

export interface JourneyData {
  mostCommonPath: string;
  averageShelvesVisited: number;
  totalVisits: number;
  averageJourneyDurationSec?: number;
  customerPaths?: Record<string, string[]>;
}

export interface AnnotatedFrame {
  frameIdx: number;
  timeSec: number;
  filename: string;
  url: string;
}

export interface VideoAnalytics {
  success?: boolean;
  totalPeople: number;
  uniquePeople: number;
  maxCrowd: number;
  minCrowd?: number;
  avgCrowd: number;
  crowdPercentage: number;
  crowdLevel: string;
  entries?: number;
  exits?: number;
  totalFootfall?: number;
  maxOccupancy?: number;
  currentOccupancy?: number;
  avgOccupancy?: number;
  videoLength?: string;
  videoDuration?: string;
  fps?: number;
  totalFrames?: number;
  framesProcessed: number;
  resolution?: string;
  avgConfidence: string;
  minConfidence?: string;
  maxConfidence?: string;
  processingTime: number;
  detectionSummary?: {
    person: number;
    shoppingCart: number;
    otherObjects: number;
  };
  aiRecommendations?: string[];
  aiSummary?: string;
  // Customer & Gaze tracking
  customers?: CustomerTrackingRecord[];
  gazeDistribution?: GazeDistribution;
  gazeObservations?: GazeObservation[];
  totalGazeObservations?: number;
  successfulGazeObservations?: number;
  processedVideoUrl?: string;
  videoUrl?: string;
  videoFile?: string;
  videoSize?: number;
  jobId?: string;
  // Product analytics fields
  totalProductsDetected: number;
  productsPerCategory: { [category: string]: number };
  mostFrequentProduct: string | null;
  averageProductConfidence: string;
  productEngagement?: ProductEngagementItem[];
  productAttractiveness?: ProductAttractivenessItem[];
  mostAttractiveProduct?: ProductAttractivenessItem | null;
  behaviorIntelligence?: BehaviorIntelligenceData;
  retention?: CustomerRetentionData;
  // Shelf and journey analytics fields
  shelfMetrics: ShelfMetric[] | Record<string, ShelfMetric>;
  attentionScores: Record<string, number>;
  mostAttendedShelf?: string | null;
  journey?: JourneyData;
  customerJourney?: JourneyData;
  // Retail optimization fields
  productDensity: Record<string, number>;
  insights: string[];
  optimizations: string[];
  dataQuality?: DataQuality;
  heatmapData?: Array<{ x: number; y: number; intensity: number; shelfId?: string }>;
  diagnostics?: {
    annotatedFrames?: AnnotatedFrame[];
    [key: string]: any;
  };
}
