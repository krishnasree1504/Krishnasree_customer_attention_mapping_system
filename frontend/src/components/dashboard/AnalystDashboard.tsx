import React, { useState, useMemo } from 'react';
import { Store, Shelf, Camera, User, SystemStats } from '../../types';
import { MetricCard } from './MetricCard';
import {
  Store as StoreIcon,
  Layers,
  Camera as CameraIcon,
  Search,
  Package,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Activity,
  BarChart3,
  Cpu,
  UserCheck,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface AnalystDashboardProps {
  stores: Store[];
  shelves: Shelf[];
  cameras: Camera[];
  usersList?: User[];
  stats?: SystemStats | null;
}

export const AnalystDashboard: React.FC<AnalystDashboardProps> = ({
  stores = [],
  shelves = [],
  cameras = [],
  usersList = [],
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');

  // Empty state if no source data exists
  if (!stores || stores.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-500">
          <StoreIcon className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">No data available</h2>
          <p className="text-xs text-slate-500 mt-1">
            No source store records are currently available in the system database.
          </p>
        </div>
      </div>
    );
  }

  // Selected store object
  const currentStore = useMemo(() => {
    if (selectedStoreId === 'all') return null;
    return stores.find((s) => s.id === selectedStoreId) || null;
  }, [stores, selectedStoreId]);

  // Filtered source records
  const filteredStores = useMemo(() => {
    if (selectedStoreId === 'all') return stores;
    return stores.filter((s) => s.id === selectedStoreId);
  }, [stores, selectedStoreId]);

  const filteredShelves = useMemo(() => {
    if (selectedStoreId === 'all') return shelves;
    return shelves.filter(
      (sh) => sh.storeId === selectedStoreId || (currentStore && sh.storeName === currentStore.name)
    );
  }, [shelves, selectedStoreId, currentStore]);

  const filteredCameras = useMemo(() => {
    if (selectedStoreId === 'all') return cameras;
    return cameras.filter(
      (c) => c.storeId === selectedStoreId || (currentStore && c.storeName === currentStore.name)
    );
  }, [cameras, selectedStoreId, currentStore]);

  // Real aggregations from common source data
  const totalStoresCount = filteredStores.length;
  const activeStoresCount = filteredStores.filter((s) => s.status === 'Active').length;
  const maintenanceStoresCount = filteredStores.filter((s) => s.status === 'Maintenance').length;

  const totalShelvesCount = filteredShelves.length;
  const totalProducts = useMemo(() => {
    return filteredShelves.reduce((acc, sh) => acc + (Number(sh.productCount) || 0), 0);
  }, [filteredShelves]);

  const avgProductsPerShelf = totalShelvesCount > 0 ? Math.round(totalProducts / totalShelvesCount) : 0;

  const totalCamerasCount = filteredCameras.length;
  const activeCamerasCount = filteredCameras.filter((c) => c.status === 'Active').length;
  const offlineCamerasCount = filteredCameras.filter((c) => c.status === 'Offline').length;
  const maintenanceCamerasCount = filteredCameras.filter((c) => c.status === 'Maintenance').length;

  // Camera-to-shelf optical pairing
  const opticalRatio =
    totalShelvesCount > 0 ? (totalCamerasCount / totalShelvesCount).toFixed(2) : '0.00';

  // Category breakdown from real shelves
  const categorySummary = useMemo(() => {
    const map: Record<string, { count: number; products: number }> = {};
    filteredShelves.forEach((sh) => {
      const cat = sh.category || 'General';
      if (!map[cat]) {
        map[cat] = { count: 0, products: 0 };
      }
      map[cat].count += 1;
      map[cat].products += Number(sh.productCount) || 0;
    });
    return Object.entries(map).map(([category, val]) => ({
      category,
      shelvesCount: val.count,
      productCount: val.products,
    })).sort((a, b) => b.productCount - a.productCount);
  }, [filteredShelves]);

  // Camera resolution breakdown
  const resolutionBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredCameras.forEach((cam) => {
      const res = cam.resolution ? cam.resolution.split(' ')[0] : '1080p';
      map[res] = (map[res] || 0) + 1;
    });
    return Object.entries(map).map(([res, count]) => ({ resolution: res, count }));
  }, [filteredCameras]);

  // Store comparison dataset (Real Common Source Data)
  const storeComparisonData = useMemo(() => {
    return stores.map((s) => {
      const storeShelves = shelves.filter((sh) => sh.storeId === s.id || sh.storeName === s.name);
      const storeCameras = cameras.filter((c) => c.storeId === s.id || c.storeName === s.name);
      const storeProducts = storeShelves.reduce((acc, sh) => acc + (Number(sh.productCount) || 0), 0);

      return {
        name: s.city || s.name.split(' ')[0],
        fullName: s.name,
        code: s.storeCode,
        shelves: storeShelves.length,
        cameras: storeCameras.length,
        products: storeProducts,
        status: s.status,
      };
    });
  }, [stores, shelves, cameras]);

  // Analyst-level factual insights derived strictly from common source data
  const sourceInsights = useMemo(() => {
    const insights: Array<{ title: string; desc: string; type: 'success' | 'info' | 'warning' }> = [];

    // 1. Camera coverage check
    if (totalShelvesCount > 0) {
      if (totalCamerasCount >= totalShelvesCount) {
        insights.push({
          title: 'Full Optical Deployment Ratio',
          desc: `System maintains ${opticalRatio} cameras per shelf across ${totalStoresCount} store branch${totalStoresCount > 1 ? 'es' : ''}, supporting multi-angle sensor observation.`,
          type: 'success',
        });
      } else {
        insights.push({
          title: 'Coverage Disparity Detected',
          desc: `${totalShelvesCount - totalCamerasCount} shelf location(s) do not have a 1:1 dedicated optical sensor paired.`,
          type: 'warning',
        });
      }
    }

    // 2. Hardware and Maintenance Audit
    if (offlineCamerasCount > 0 || maintenanceCamerasCount > 0 || maintenanceStoresCount > 0) {
      const issues: string[] = [];
      if (maintenanceStoresCount > 0) issues.push(`${maintenanceStoresCount} store(s) undergoing maintenance`);
      if (offlineCamerasCount > 0) issues.push(`${offlineCamerasCount} offline camera(s)`);
      if (maintenanceCamerasCount > 0) issues.push(`${maintenanceCamerasCount} camera(s) in servicing`);
      insights.push({
        title: 'Infrastructure Maintenance Status',
        desc: `Action required for operational continuity: ${issues.join(', ')}.`,
        type: 'warning',
      });
    } else {
      insights.push({
        title: 'Fleet Operational Readiness',
        desc: `100% of recorded store locations and optical camera sensors are currently reporting active operational status.`,
        type: 'success',
      });
    }

    // 3. Merchandising Density
    if (categorySummary.length > 0) {
      const topCategory = categorySummary[0];
      insights.push({
        title: 'Primary Merchandise Category',
        desc: `${topCategory.category} represents the largest product allocation with ${topCategory.productCount.toLocaleString()} units configured across ${topCategory.shelvesCount} shelf bay${topCategory.shelvesCount > 1 ? 's' : ''}.`,
        type: 'info',
      });
    }

    // 4. Governance and Manager Assignment
    const unassignedStores = stores.filter((s) => !s.managerName || s.managerName.toLowerCase() === 'unassigned');
    if (unassignedStores.length > 0) {
      insights.push({
        title: 'Store Manager Assignment Audit',
        desc: `${unassignedStores.length} store location(s) (${unassignedStores.map((s) => s.city || s.name).join(', ')}) currently have unassigned management personnel.`,
        type: 'info',
      });
    }

    return insights;
  }, [
    totalShelvesCount,
    totalCamerasCount,
    totalStoresCount,
    opticalRatio,
    offlineCamerasCount,
    maintenanceCamerasCount,
    maintenanceStoresCount,
    categorySummary,
    stores,
  ]);

  return (
    <div className="space-y-6">
      {/* 1. Header with Clean Title & Store Filter */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold tracking-wide">
              Analyst Console
            </span>
            <span className="text-xs text-slate-500 font-medium">Common Source Data Analysis</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Overall Retail Source Data Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comprehensive audit of physical retail locations, shelf fixtures, camera sensor infrastructure, and merchandise capacity across all stores
          </p>
        </div>

        {/* Store Selector */}
        <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
          <div className="flex items-center gap-1.5 pl-1.5 text-xs font-bold text-slate-600">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Scope:</span>
          </div>
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00E676] shadow-xs cursor-pointer"
          >
            <option value="all">All Stores (Aggregate Fleet)</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Top Metric Cards (5 Cards strictly derived from common source data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Stores"
          value={totalStoresCount}
          trend={{ value: `${activeStoresCount} Active Operational` }}
          icon={<StoreIcon className="w-5 h-5 text-emerald-600" />}
          subtitle={selectedStoreId === 'all' ? 'Registered Branches' : currentStore?.name}
        />
        <MetricCard
          title="Total Shelves"
          value={totalShelvesCount}
          trend={{ value: `${categorySummary.length} Categories` }}
          icon={<Layers className="w-5 h-5 text-blue-600" />}
          subtitle="Configured Bays"
        />
        <MetricCard
          title="Total Cameras"
          value={totalCamerasCount}
          trend={{ value: `${activeCamerasCount} Active, ${offlineCamerasCount} Offline` }}
          icon={<CameraIcon className="w-5 h-5 text-purple-600" />}
          subtitle="Optical Grid"
        />
        <MetricCard
          title="Product Capacity"
          value={totalProducts.toLocaleString()}
          trend={{ value: `Avg ${avgProductsPerShelf} items / shelf` }}
          icon={<Package className="w-5 h-5 text-amber-600" />}
          subtitle="Stocked Inventory"
        />
        <MetricCard
          title="Optical Coverage"
          value={`${opticalRatio}x`}
          trend={{ value: `${totalCamerasCount} Cams / ${totalShelvesCount || 1} Shelves` }}
          icon={<Activity className="w-5 h-5 text-[#008A3E]" />}
          subtitle="Camera-to-Shelf Ratio"
        />
      </div>

      {/* 3. Overall Source & Data Summary Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-[#008A3E]">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Overall Source & Data Summary</h2>
              <p className="text-xs text-slate-500">Fleet-level operational telemetry and resource allocation</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            Common Source Records
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Store Fleet Health
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {Math.round((activeStoresCount / (totalStoresCount || 1)) * 100)}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeStoresCount} of {totalStoresCount} stores active
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Camera Grid Health
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {totalCamerasCount > 0 ? Math.round((activeCamerasCount / totalCamerasCount) * 100) : 0}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeCamerasCount} online / {offlineCamerasCount + maintenanceCamerasCount} alert
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Merchandise Diversity
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {categorySummary.length} Sectors
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Distinct retail categories
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Geographic Spread
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">
              {new Set(filteredStores.map((s) => s.city)).size} Cities
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Across {new Set(filteredStores.map((s) => s.state)).size} state jurisdictions
            </p>
          </div>
        </div>
      </div>

      {/* 4. Store Comparison Based on Common Source Data (Simple & Clean Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Store Infrastructure Comparison (Span 7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Store Infrastructure Comparison</h2>
              <p className="text-xs text-slate-500">Shelves deployed vs optical cameras installed per store</p>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              Equipment Distribution
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={storeComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="shelves" name="Shelves Deployed" fill="#00E676" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="cameras" name="Cameras Installed" fill="#0F172A" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Product Allocation (Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Inventory Allocation by Category</h2>
              <p className="text-xs text-slate-500">Configured merchandise unit capacity</p>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              Product Capacity
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categorySummary}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="category" type="category" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="productCount" name="Total Product Units" fill="#3B82F6" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Store Overview Table (Common Source Data) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Store Overview</h2>
            <p className="text-xs text-slate-500">Comprehensive configuration inventory for registered store branches</p>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Showing {filteredStores.length} store record{filteredStores.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Store Code</th>
                <th className="py-2.5 px-3">Store Name</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Branch Manager</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Shelves</th>
                <th className="py-2.5 px-3 text-center">Cameras</th>
                <th className="py-2.5 px-3 text-right">Product Capacity</th>
                <th className="py-2.5 px-3 text-center">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStores.map((s) => {
                const storeShelves = shelves.filter((sh) => sh.storeId === s.id || sh.storeName === s.name);
                const storeCameras = cameras.filter((c) => c.storeId === s.id || c.storeName === s.name);
                const storeProducts = storeShelves.reduce((acc, sh) => acc + (Number(sh.productCount) || 0), 0);
                const ratio = storeShelves.length > 0 ? (storeCameras.length / storeShelves.length).toFixed(1) : '0.0';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{s.storeCode}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="py-3 px-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{s.city}, {s.state}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {s.managerName && s.managerName.toLowerCase() !== 'unassigned' ? (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>{s.managerName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{storeShelves.length}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-800">{storeCameras.length}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {storeProducts.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-[11px] font-semibold text-slate-600">
                        {ratio}x
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Basic Trends & Summary from Available Source Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Merchandise Category Distribution</h2>
              <p className="text-xs text-slate-500">Shelf allocation and capacity breakdown across active categories</p>
            </div>
            <span className="text-[11px] font-bold text-slate-500">
              {categorySummary.length} Categories
            </span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {categorySummary.map((cat, idx) => {
              const pct = totalProducts > 0 ? Math.round((cat.productCount / totalProducts) * 100) : 0;
              return (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{cat.category}</span>
                    <span className="font-mono text-slate-600 font-semibold">
                      {cat.productCount.toLocaleString()} units ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#00E676] h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>{cat.shelvesCount} Shelf Bay{cat.shelvesCount > 1 ? 's' : ''} assigned</span>
                    <span>Avg {Math.round(cat.productCount / (cat.shelvesCount || 1))} units/bay</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optical Sensor Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Optical Sensor Infrastructure Profile</h2>
              <p className="text-xs text-slate-500">Hardware resolution specifications and streaming health</p>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {activeCamerasCount} / {totalCamerasCount} Online
            </span>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {filteredCameras.map((cam) => (
              <div key={cam.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900">{cam.cameraCode || cam.cameraId}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[140px] sm:max-w-[180px]">
                      — {cam.name || cam.cameraName}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {cam.shelfName || 'Unassigned Bay'} • {cam.storeName}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {cam.resolution || '1080p'} • {cam.fps || 30} FPS
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      cam.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : cam.status === 'Offline'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {cam.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Simple Analyst-Level Insights from Common Source Data */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Analyst Source Data Insights</h2>
              <p className="text-xs text-slate-500">Calculated structural and operational observations derived strictly from source inventory records</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Empirical Source Audit
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {sourceInsights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                insight.type === 'success'
                  ? 'bg-emerald-50/40 border-emerald-200/70'
                  : insight.type === 'warning'
                  ? 'bg-amber-50/40 border-amber-200/70'
                  : 'bg-slate-50 border-slate-200/70'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                  insight.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800'
                    : insight.type === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {insight.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : insight.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-slate-900">{insight.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{insight.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
