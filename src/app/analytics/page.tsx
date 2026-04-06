'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Activity,
  Calendar,
  DollarSign,
  PieChart,
  Plus,
  TrendingUp,
  TrendingDown,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  period: string;
  dateRange: { start: string; end: string };
  summary: {
    totalTransactions: number;
    totalAmount: number;
    categoriesCount: number;
    avgTransactionAmount: number;
  };
  charts: {
    topCategories: Array<{ type: string; category: string; amount: number; count: number }>;
    categoryDistribution: Array<{ type: string; category: string; amount: number; percentage: number }>;
    periodComparison: {
      current: Record<string, { amount: number; count: number }>;
      previous: Record<string, { amount: number; count: number }>;
    };
  };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  
  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    void fetchAnalytics();
  }, [period, filterType, filterCategory]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to view analytics.');
        return;
      }

      const queryParams = new URLSearchParams({
        period,
        ...(filterType && { type: filterType }),
        ...(filterCategory && { category: filterCategory })
      });

      const response = await fetch(`/api/dashboard/analytics?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Failed to load analytics (${response.status})`);
      }

      const data = await response.json();
      if (!data.success || !data.data?.analytics) {
        throw new Error(data.error || 'Invalid analytics response');
      }

      setAnalytics(data.data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const getComparisonData = (type: 'INCOME' | 'EXPENSE') => {
    const current = analytics?.charts.periodComparison.current[type]?.amount || 0;
    const previous = analytics?.charts.periodComparison.previous[type]?.amount || 0;
    const change = previous ? ((current - previous) / previous) * 100 : 0;
    return { current, previous, change };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-xl bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.summary.totalTransactions === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <BarChart3 className="w-20 h-20 mx-auto mb-6 text-slate-400" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">No analytics data yet</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            Add transactions in the Transactions section to generate live analytics powered by the database.
          </p>
          <div className="flex justify-center">
            <Link href="/" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
              <ArrowLeft size={18} /> Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const incomeComparison = getComparisonData('INCOME');
  const expenseComparison = getComparisonData('EXPENSE');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft size={18} /> Home
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <BarChart3 size={32} /> Analytics Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">{analytics.dateRange.start} to {analytics.dateRange.end}</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors"
              >
                <Filter size={16} />
                Filters
                {(filterType || filterCategory) && (
                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                )}
              </button>
              {(filterType || filterCategory) && (
                <button
                  onClick={() => {
                    setFilterType('');
                    setFilterCategory('');
                  }}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Transactions</p>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{analytics.summary.totalTransactions}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(analytics.summary.totalAmount)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Categories</p>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{analytics.summary.categoriesCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400">Avg Transaction</p>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(analytics.summary.avgTransactionAmount)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[
            { title: 'Income Comparison', data: incomeComparison, icon: <TrendingUp size={18} className="text-emerald-600" /> },
            { title: 'Expense Comparison', data: expenseComparison, icon: <TrendingDown size={18} className="text-rose-600" /> }
          ].map((item) => (
            <div key={item.title} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                {item.icon}
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Current period</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(item.data.current)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Previous period</span>
                  <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(item.data.previous)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                  <span>Change</span>
                  <span className={item.data.change >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                    {item.data.change >= 0 ? '+' : ''}{item.data.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Top Categories</h2>
            <div className="space-y-4">
              {analytics.charts.topCategories.map((category, index) => (
                <div key={`${category.type}-${category.category}`} className="rounded-3xl p-4 bg-slate-50 dark:bg-slate-900/60">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{category.category}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{category.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(category.amount)}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{category.count} txns</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Category Distribution</h2>
            <div className="space-y-4">
              {analytics.charts.categoryDistribution.map((item) => (
                <div key={`${item.type}-${item.category}`}>
                  <div className="flex justify-between text-sm text-slate-700 dark:text-slate-300 mb-2">
                    <span>{item.category}</span>
                    <span>{formatCurrency(item.amount)} ({item.percentage}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className={`h-full ${item.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
