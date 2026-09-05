import React, { useState, useMemo } from 'react';
import { Route, MapPin, ArrowRight, Clock, Layers, Users, Navigation, AlertCircle, Compass } from 'lucide-react';
import { JourneyData, CustomerTrackingRecord, BehaviorCustomerProfile } from '../../types/analytics';

interface CustomerPathwayPanelProps {
  journey?: JourneyData;
  customers?: CustomerTrackingRecord[];
  customerProfiles?: BehaviorCustomerProfile[];
  heatmapData?: Array<{ x: number; y: number; intensity: number; shelfId?: string }>;
}

export const CustomerPathwayPanel: React.FC<CustomerPathwayPanelProps> = ({
  journey,
  customers = [],
  customerProfiles = [],
  heatmapData = [],
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(() => {
    if (customers.length > 0) return customers[0].customerId;
    if (customerProfiles.length > 0) return customerProfiles[0].customerId;
    return null;
  });

  // Keep selected customer in sync if list updates
  React.useEffect(() => {
    if (selectedCustomerId === null) {
      if (customers.length > 0) setSelectedCustomerId(customers[0].customerId);
      else if (customerProfiles.length > 0) setSelectedCustomerId(customerProfiles[0].customerId);
    }
  }, [customers, customerProfiles, selectedCustomerId]);

  // Merge customer tracking record with profile if available
  const customerList = useMemo(() => {
    const map = new Map<number, {
      customerId: number;
      label: string;
      trackDurationSec: number;
      associatedShelf: string;
      dwellTimeSec: number;
      shelfDwellBreakdown: Record<string, number>;
      visitedShelves: string[];
      pathCoordinates: Array<[number, number]>;
      behaviorSegment?: string;
      behaviorScore?: number;
    }>();

    customers.forEach((c) => {
      // Determine visited shelves
      let visited = c.visitedShelves || [];
      if (visited.length === 0 && c.shelfDwellBreakdown) {
        visited = Object.keys(c.shelfDwellBreakdown).filter((sid) => (c.shelfDwellBreakdown![sid] || 0) > 0);
      }
      if (visited.length === 0 && c.associatedShelfId) {
        visited = [c.associatedShelfId];
      }

      map.set(c.customerId, {
        customerId: c.customerId,
        label: c.customerLabel || `Customer #${c.customerId}`,
        trackDurationSec: c.trackDurationSec || c.dwellTimeSec || 0,
        associatedShelf: c.associatedShelf || 'Aisle Zone',
        dwellTimeSec: c.dwellTimeSec || 0,
        shelfDwellBreakdown: c.shelfDwellBreakdown || {},
        visitedShelves: visited,
        pathCoordinates: c.pathCoordinates || [],
        behaviorSegment: c.behaviorSegment,
        behaviorScore: c.behaviorScore,
      });
    });

    // Merge in any customerProfiles
    customerProfiles.forEach((p) => {
      const existing = map.get(p.customerId);
      let visited = existing?.visitedShelves || [];
      if (visited.length === 0 && p.shelfDwellBreakdown) {
        visited = Object.keys(p.shelfDwellBreakdown).filter((sid) => (p.shelfDwellBreakdown![sid] || 0) > 0);
      }
      if (visited.length === 0 && p.favoriteShelf) {
        visited = [p.favoriteShelf];
      }

      map.set(p.customerId, {
        customerId: p.customerId,
        label: p.customerLabel || `Customer #${p.customerId}`,
        trackDurationSec: p.journeyDurationSec || existing?.trackDurationSec || 0,
        associatedShelf: p.favoriteShelf ? p.favoriteShelf.replace('shelf_', 'Shelf ').replace('_', ' ') : existing?.associatedShelf || 'Aisle Zone',
        dwellTimeSec: p.totalDwellTimeSec || existing?.dwellTimeSec || 0,
        shelfDwellBreakdown: p.shelfDwellBreakdown || existing?.shelfDwellBreakdown || {},
        visitedShelves: visited,
        pathCoordinates: existing?.pathCoordinates || [],
        behaviorSegment: p.behaviorSegment || existing?.behaviorSegment,
        behaviorScore: p.behaviorScore || existing?.behaviorScore,
      });
    });

    return Array.from(map.values()).sort((a, b) => a.customerId - b.customerId);
  }, [customers, customerProfiles]);

  const selectedCustomer = useMemo(() => {
    return customerList.find((c) => c.customerId === selectedCustomerId) || customerList[0] || null;
  }, [customerList, selectedCustomerId]);

  const hasPathwayData = customerList.length > 0;
  const mostCommonPath = journey?.mostCommonPath;
  const avgShelves = journey?.averageShelvesVisited;
  const avgDuration = journey?.averageJourneyDurationSec;
  const totalVisits = journey?.totalVisits;

  // Format shelf name for cleaner visual display
  const formatShelfName = (shelfId: string) => {
    if (!shelfId) return 'Zone';
    return shelfId
      .replace(/^shelf_?/i, 'Shelf ')
      .replace(/_/g, ' ')
      .trim();
  };

  return (
    <div id="section-customer-pathway" className="space-y-6 w-full min-w-0">
      {/* 5. Customer Pathway Main Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 w-full min-w-0">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700 shrink-0">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex flex-wrap items-center gap-2">
                <span>5. Customer Pathway</span>
                {hasPathwayData && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                    {customerList.length} Trajectories Tracked
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Individual shopper journey sequences from entrance, intermediate shelf visits, and exit trajectories.
              </p>
            </div>
          </div>
        </div>

        {!hasPathwayData ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700">Data not available</p>
            <p className="text-xs text-slate-400">
              Insufficient customer movement duration to reconstruct individual trajectory pathways.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Customer Selector Ribbon */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Select Customer Track:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {customerList.map((c) => {
                  const isSelected = c.customerId === selectedCustomer?.customerId;
                  return (
                    <button
                      key={c.customerId}
                      type="button"
                      onClick={() => setSelectedCustomerId(c.customerId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900/20'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        isSelected ? 'bg-sky-400 text-slate-900' : 'bg-slate-300 text-slate-700'
                      }`}>
                        {c.customerId}
                      </span>
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Customer Pathway Details */}
            {selectedCustomer && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                {/* Stats Header for Selected Customer */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Customer ID</span>
                    <p className="text-sm font-extrabold text-slate-900">
                      {selectedCustomer.label}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Journey Duration</span>
                    <p className="text-sm font-extrabold text-slate-900 font-mono">
                      {selectedCustomer.trackDurationSec ? `${selectedCustomer.trackDurationSec.toFixed(1)}s` : 'Data not available'}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Shelves Visited</span>
                    <p className="text-sm font-extrabold text-slate-900">
                      {selectedCustomer.visitedShelves.length > 0 ? selectedCustomer.visitedShelves.length : 1} Zones
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Archetype</span>
                    <p className="text-sm font-extrabold text-purple-700 truncate">
                      {selectedCustomer.behaviorSegment || 'Standard Shopper'}
                    </p>
                  </div>
                </div>

                {/* Pathway Visual Flow Diagram */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-sky-500" />
                      Sequence of Visited Zones
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Chronological pathway
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center gap-2 sm:gap-3 overflow-x-auto">
                    {/* Entry Node */}
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-emerald-700">Starting Point</p>
                        <p className="font-extrabold text-emerald-950">Store Entrance</p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

                    {/* Intermediate Visited Shelves */}
                    {selectedCustomer.visitedShelves.length > 0 ? (
                      selectedCustomer.visitedShelves.map((shelfId, sIdx) => {
                        const dwell = selectedCustomer.shelfDwellBreakdown[shelfId];
                        return (
                          <React.Fragment key={shelfId + sIdx}>
                            <div className="bg-sky-50 border border-sky-200 px-3 py-2 rounded-xl text-xs shrink-0 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-sky-200 text-sky-800 font-black text-[9px] flex items-center justify-center">
                                  {sIdx + 1}
                                </span>
                                <p className="font-extrabold text-sky-950 capitalize">
                                  {formatShelfName(shelfId)}
                                </p>
                              </div>
                              {dwell !== undefined && (
                                <p className="text-[10px] text-sky-700 font-mono pl-5">
                                  Dwell: <span className="font-bold">{dwell.toFixed(1)}s</span>
                                </p>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <>
                        <div className="bg-sky-50 border border-sky-200 px-3 py-2 rounded-xl text-xs shrink-0">
                          <p className="text-[10px] font-bold uppercase text-sky-700">Primary Engagement</p>
                          <p className="font-extrabold text-sky-950 capitalize">
                            {selectedCustomer.associatedShelf}
                          </p>
                          {selectedCustomer.dwellTimeSec > 0 && (
                            <p className="text-[10px] text-sky-700 font-mono">
                              Dwell: {selectedCustomer.dwellTimeSec.toFixed(1)}s
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </>
                    )}

                    {/* Exit Node */}
                    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-500">Final Point</p>
                        <p className="font-extrabold text-slate-900">Aisle Exit</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2D Retail Layout Diagram for this customer */}
                <div className="space-y-2 pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-slate-400" />
                      Store Zone Interaction Map
                    </span>
                    <span className="text-[11px] text-slate-400">
                      4-Zone Retail Layout Matrix
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-white border border-slate-200">
                    {['shelf_1', 'shelf_2', 'shelf_3', 'shelf_4'].map((sid, idx) => {
                      const shelfName = `Shelf ${idx + 1}`;
                      const isVisited = selectedCustomer.visitedShelves.includes(sid) ||
                        selectedCustomer.associatedShelf.toLowerCase().includes(`shelf ${idx + 1}`);
                      const dwell = selectedCustomer.shelfDwellBreakdown[sid] || 0;

                      return (
                        <div
                          key={sid}
                          className={`p-3.5 rounded-xl border transition-all space-y-1 ${
                            isVisited
                              ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-500/20'
                              : 'bg-slate-50/50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-slate-900">{shelfName}</span>
                            {isVisited && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500 text-white uppercase">
                                Visited
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {dwell > 0 ? `Dwell: ${dwell.toFixed(1)}s` : isVisited ? 'Active Engagement' : 'No visit'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Most Common Customer Pathway Card */}
      <div id="section-common-pathway" className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                6. Most Common Customer Pathway
              </h3>
              <p className="text-xs text-slate-500">
                Aggregated primary traffic route taken by shoppers through the store zones.
              </p>
            </div>
          </div>
        </div>

        {mostCommonPath && !mostCommonPath.includes('Insufficient') && !mostCommonPath.includes('No customer') ? (
          <div className="space-y-4">
            {/* Visual Pathway Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                  Dominant Store Route
                </span>
              </div>

              {/* Breadcrumbs of most common path */}
              <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base font-extrabold text-white">
                <span className="px-3 py-1 rounded-xl bg-white/10 text-emerald-300 border border-white/10">
                  Entry
                </span>
                {mostCommonPath.split('→').map((step, idx) => (
                  <React.Fragment key={idx}>
                    <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="px-3 py-1 rounded-xl bg-white/15 text-white border border-white/20 capitalize">
                      {formatShelfName(step.trim())}
                    </span>
                  </React.Fragment>
                ))}
                <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="px-3 py-1 rounded-xl bg-white/10 text-slate-300 border border-white/10">
                  Exit
                </span>
              </div>
            </div>

            {/* Pathway Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  Avg Shelves Visited
                </span>
                <p className="text-lg font-black text-slate-900">
                  {avgShelves !== undefined ? avgShelves : 'Data not available'}
                </p>
                <p className="text-[10px] text-slate-400">Average zone transitions per journey</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Avg Pathway Duration
                </span>
                <p className="text-lg font-black text-slate-900 font-mono">
                  {avgDuration !== undefined && avgDuration > 0 ? `${avgDuration}s` : 'Data not available'}
                </p>
                <p className="text-[10px] text-slate-400">Mean time to traverse common pathway</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Total Zone Visits
                </span>
                <p className="text-lg font-black text-slate-900">
                  {totalVisits !== undefined ? totalVisits : 'Data not available'}
                </p>
                <p className="text-[10px] text-slate-400">Cumulative shelf check-ins recorded</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700">Data not available</p>
            <p className="text-xs text-slate-400">
              {mostCommonPath || 'Insufficient customer movement data for reliable journey analysis.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
