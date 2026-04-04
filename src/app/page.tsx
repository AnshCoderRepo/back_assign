'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  LogOut,
  User as UserIcon,
  Activity,
  Plus
} from 'lucide-react';

export default function FinanceApp() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [recentRecords, setRecentRecords] = useState([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Registration state
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      const sumRes = await fetch('/api/dashboard/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sumData = await sumRes.json();
      if (sumData.summary) setSummary(sumData.summary);

      const recRes = await fetch('/api/dashboard/recent', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const recData = await recRes.json();
      if (recData.recentRecords) setRecentRecords(recData.recentRecords);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Server error');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: registerName, 
          email: registerEmail, 
          password: registerPassword 
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setRegisterSuccess('Account created successfully! You can now login.');
        setIsRegistering(false);
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPassword('');
      } else {
        setRegisterError(data.error || 'Registration failed');
      }
    } catch (error) {
      setRegisterError('Server error');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) return null;

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 font-sans">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-900"></div>
        <div className="z-10 w-full max-w-md p-8 space-y-8 bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-600 mb-4">
              <Activity size={32} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Finance Portal</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Secure access to your data</p>
          </div>

          {/* Tab buttons */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-700 p-1">
            <button
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                !isRegistering 
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isRegistering 
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Sign Up
            </button>
          </div>

          {!isRegistering ? (
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              {loginError && (
                <div className="p-3 text-sm text-red-500 bg-red-100/50 rounded-xl text-center">
                  {loginError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 mt-1 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-slate-900/50 outline-none transition-all"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 mt-1 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-slate-900/50 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-600/30 active:scale-[0.98]"
              >
                Sign In
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleRegister}>
              {registerError && (
                <div className="p-3 text-sm text-red-500 bg-red-100/50 rounded-xl text-center">
                  {registerError}
                </div>
              )}
              {registerSuccess && (
                <div className="p-3 text-sm text-green-600 bg-green-100/50 rounded-xl text-center">
                  {registerSuccess}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={e => setRegisterName(e.target.value)}
                    className="w-full px-4 py-3 mt-1 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-slate-900/50 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={e => setRegisterEmail(e.target.value)}
                    className="w-full px-4 py-3 mt-1 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-slate-900/50 outline-none transition-all"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerPassword}
                    onChange={e => setRegisterPassword(e.target.value)}
                    className="w-full px-4 py-3 mt-1 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-slate-900/50 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3.5 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-600/30 active:scale-[0.98]"
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

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
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium">
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Wallet size={20} />
            Transactions
          </a>
          {user?.role === 'ADMIN' && (
            <a href="/users" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <UserIcon size={20} />
              Users Setup
            </a>
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
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your financial summary today.</p>
          </div>
          {user?.role === 'ADMIN' && (
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-full hover:scale-105 transition-transform">
              <Plus size={18} />
              New Record
            </button>
          )}
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
              <Wallet size={80} />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Balance</p>
            <h3 className="text-4xl font-bold tracking-tight">${summary.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          </div>
          
          <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight size={18} className="text-emerald-500" />
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Income</p>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
              ${summary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>

          <div className="p-6 bg-rose-50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight size={18} className="text-rose-500" />
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Total Expense</p>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-rose-700 dark:text-rose-300">
              ${summary.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-bold">Recent Transactions</h2>
            <button className="text-blue-600 font-medium text-sm hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-100 dark:border-slate-700 font-medium">
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No recent transactions available.
                    </td>
                  </tr>
                ) : (
                  recentRecords.map((record: any) => (
                    <tr key={record._id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
