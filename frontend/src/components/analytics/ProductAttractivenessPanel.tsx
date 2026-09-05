import React, { useMemo } from 'react';
import { Target, Award, Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProductAttractivenessItem, ProductEngagementItem } from '../../types/analytics';

interface ProductAttractivenessPanelProps {
  productAttractiveness?: ProductAttractivenessItem[];
  mostAttractiveProduct?: ProductAttractivenessItem | null;
  productEngagement?: ProductEngagementItem[];
  productsPerCategory?: Record<string, number>;
  totalProductsDetected?: number;
  mostFrequentProduct?: string | null;
  averageProductConfidence?: string;
}

export const ProductAttractivenessPanel: React.FC<ProductAttractivenessPanelProps> = ({
  productAttractiveness,
  mostAttractiveProduct,
  productEngagement,
  productsPerCategory,
  totalProductsDetected,
  mostFrequentProduct,
  averageProductConfidence,
}) => {
  // Determine real most attractive product/object without inventing data
  const mostAttractiveName = useMemo(() => {
    if (mostAttractiveProduct?.productName) {
      return mostAttractiveProduct.productName;
    }
    if (mostAttractiveProduct?.productId) {
      return mostAttractiveProduct.productId;
    }

    if (productAttractiveness && productAttractiveness.length > 0) {
      const top = [...productAttractiveness].sort(
        (a, b) => (b.attractivenessScore || 0) - (a.attractivenessScore || 0)
      )[0];
      if (top && (top.attractivenessScore || 0) > 0 && top.attractivenessLevel !== 'Data not available') {
        return top.productName || top.productId;
      }
    }

    if (productEngagement && productEngagement.length > 0) {
      const top = [...productEngagement].sort(
        (a, b) => (b.engagementScore || 0) - (a.engagementScore || 0)
      )[0];
      if (top && (top.engagementScore || 0) > 0) {
        return top.productName || top.productId;
      }
    }

    return null;
  }, [mostAttractiveProduct, productAttractiveness, productEngagement]);

  // Detected categories breakdown list
  const categoryPills = useMemo(() => {
    if (!productsPerCategory) return [];
    return Object.entries(productsPerCategory)
      .filter(([_, count]) => (Number(count) || 0) > 0)
      .sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
      .slice(0, 6);
  }, [productsPerCategory]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#008A3E]" />
            <span>Product & Object Detection Analysis</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive summary of computer vision object detection and shopper attraction
          </p>
        </div>

        {totalProductsDetected !== undefined && totalProductsDetected > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70 font-semibold self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Model Verification Complete</span>
          </div>
        )}
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Most Attractive Product/Object */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Most Attractive Object
            </span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900 truncate">
              {mostAttractiveName ? mostAttractiveName : 'Not available'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {mostAttractiveName ? 'Highest observed shopper focus' : 'No specific attraction recorded'}
            </p>
          </div>
        </div>

        {/* 2. Total Detected Objects */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Detected Objects
            </span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900">
              {totalProductsDetected !== undefined ? totalProductsDetected : 'Not available'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Identified across video frames</p>
          </div>
        </div>

        {/* 3. Most Frequent Object / Category */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Most Frequent Category
            </span>
            <Target className="w-4 h-4 text-sky-600" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900 truncate">
              {mostFrequentProduct || (categoryPills[0] ? categoryPills[0][0] : 'Not available')}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Dominant shelf classification</p>
          </div>
        </div>

        {/* 4. Overall Detection Confidence */}
        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Detection Confidence
            </span>
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-base font-black text-slate-900">
              {averageProductConfidence || 'Not available'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Model classification accuracy</p>
          </div>
        </div>
      </div>

      {/* Category Pills if present */}
      {categoryPills.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-400">Detected Categories:</span>
          {categoryPills.map(([cat, count]) => (
            <span
              key={cat}
              className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]"
            >
              {cat}: <strong className="text-slate-900">{count}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
