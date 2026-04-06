'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Wallet, 
  LogOut,
  User as UserIcon,
  Activity,
  Plus,
  Trash2,
  Edit2,
  BarChart3,
  Filter
} from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [records, setRecords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('EXPENSE');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser && savedUser !== 'undefined') {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.role === 'VIEWER') {
          router.push('/');
          return;
        }
        setToken(savedToken);
        setUser(parsedUser);
      } catch (e) {
        router.push('/');
      }
    } else {
      router.push('/');
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const delayDebounceFn = setTimeout(() => {
      fetchRecords();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [token, page, searchTerm, limit, filterType, filterCategory, filterStartDate, filterEndDate]);

  const fetchCategories = async () => {
    try {
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
    if (token) {
      fetchCategories();
    }
  }, [token]);

  const fetchRecords = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { type: filterType }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterStartDate && { startDate: filterStartDate }),
        ...(filterEndDate && { endDate: filterEndDate })
      });

      const res = await fetch(`/api/records?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data.records);
        setTotalPages(data.data.pagination.totalPages || 1);
        setTotalRecords(data.data.pagination.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch records', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { }
    localStorage.clear();
    router.push('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/records/${editingId}` : '/api/records';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          type, 
          category, 
          date: date || undefined, 
          description 
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchRecords();
        // Reset form
        setEditingId(null);
        setAmount('');
        setType('EXPENSE');
        setCategory('');
        setDate('');
        setDescription('');
      } else {
        alert(data.error || 'Failed to process transaction');
      }
    } catch (error) {
      console.error(error);
      alert('Server error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      const res = await fetch(`/api/records/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchRecords();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (record: any) => {
    setEditingId(record._id);
    setAmount(record.amount.toString());
    setType(record.type);
    setCategory(record.category);
    setDate(record.date ? new Date(record.date).toISOString().split('T')[0] : '');
    setDescription(record.description || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setAmount('');
    setType('EXPENSE');
    setCategory('');
    setDate('');
    setDescription('');
  };

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Activity size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight">Finova</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link href="/analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <BarChart3 size={20} />
            Analytics
          </Link>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium">
            <Wallet size={20} />
            Transactions
          </div>
          {user?.role === 'ADMIN' && (
            <Link href="/users" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <UserIcon size={20} />
              Users Setup
            </Link>
          )}
        </nav>

        <div className="p-4 m-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="flex flex-col mb-6 gap-4">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your financial records and entries.</p>
            </div>
            {user?.role === 'ADMIN' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full hover:scale-105 transition-transform"
              >
                <Plus size={18} />
                New Record
              </button>
            )}
          </header>

          <div className="flex flex-col gap-4 mt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors"
                >
                  <Filter size={16} />
                  Filters
                  {(filterType || filterCategory || filterStartDate || filterEndDate) && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </button>
                {(filterType || filterCategory || filterStartDate || filterEndDate) && (
                  <button
                    onClick={() => {
                      setFilterType('');
                      setFilterCategory('');
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setPage(1);
                    }}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
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
                      onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
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
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => { setFilterStartDate(e.target.value); setPage(1); }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => { setFilterEndDate(e.target.value); setPage(1); }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              <input 
                type="text" 
                placeholder="Search by description or notes..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-500 dark:text-slate-400">Rows per page</label>
              <select
                value={limit}
                onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
                className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-700 font-medium">
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  {user?.role === 'ADMIN' && <th className="p-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'ADMIN' ? 5 : 4} className="p-8 text-center text-slate-500">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  records.map((record: any) => (
                    <tr 
                      key={record._id} 
                      onClick={() => setSelectedRecord(record)}
                      className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    >
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-200">
                        {record.description || 'N/A'}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                          {record.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">
                        {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className={`p-4 text-right font-bold ${record.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {record.type === 'INCOME' ? '+' : '-'}${record.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      {user?.role === 'ADMIN' && (
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(record); }}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(record._id); }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/30">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing {Math.min(records.length, totalRecords)} of {totalRecords} transactions — page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const startPage = Math.max(1, Math.min(totalPages - 4, page - 2));
                    const pageNum = startPage + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${
                          pageNum === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select 
                    value={type} onChange={e => setType(e.target.value)} required
                    className="w-full px-3 py-2 border rounded-xl dark:border-slate-700 bg-transparent"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ($) *</label>
                  <input 
                    type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required
                    className="w-full px-3 py-2 border rounded-xl dark:border-slate-700 bg-transparent" placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <input 
                  type="text" value={category} onChange={e => setCategory(e.target.value)} required
                  className="w-full px-3 py-2 border rounded-xl dark:border-slate-700 bg-transparent" placeholder="e.g. Software, Office Supplies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input 
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:border-slate-700 bg-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input 
                  type="text" value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl dark:border-slate-700 bg-transparent" placeholder="Brief note about this transaction"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" onClick={handleCloseModal}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Transaction Summary Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative transition-all">
            <h3 className="text-xl font-bold mb-4">Transaction Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">Type</p>
                <p className={`font-semibold ${selectedRecord.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {selectedRecord.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Amount</p>
                <p className="text-xl font-bold">${selectedRecord.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Category</p>
                <p className="font-medium text-slate-700 dark:text-slate-300">{selectedRecord.category}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Date</p>
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  {new Date(selectedRecord.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Description / Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{selectedRecord.description || 'No description provided'}</p>
              </div>
              {selectedRecord.createdBy && (
                <div>
                  <p className="text-xs text-slate-500 font-medium">Recorded By</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{selectedRecord.createdBy.name || 'Admin'} ({selectedRecord.createdBy.email || 'N/A'})</p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
