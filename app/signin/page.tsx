'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/toast-context';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(username, password);
      
      if (success) {
        showToast('Sign in successful!', 'success');
        router.push('/dashboard');
      } else {
        showToast('Invalid username or password. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-cover bg-center bg-no-repeat p-4 sm:p-6 lg:p-10"
      style={{ backgroundImage: "url('/images/background.png')" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/10" />
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl items-center justify-end">
        <section className="w-full max-w-[440px] rounded-3xl border border-white bg-white p-7 shadow-2xl sm:p-8">
          <div className="w-full">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md">
                <img
                  src="/images/logos/logo.png"
                  alt="St Joseph Catholic Church"
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">St Joseph Catholic Church</p>
                <p className="text-xs text-slate-500">Church Administration System</p>
              </div>
            </div>

            <div className="mb-7">
              <h1 className="text-3xl font-bold text-slate-900">Login</h1>
              <p className="mt-1.5 text-sm text-slate-600">
                Sign in to continue to the dashboard.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Username</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white pl-10 text-[15px]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-slate-200 bg-white pl-10 pr-12 text-[15px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#0f4a8a] text-base font-semibold shadow-lg shadow-[#0f4a8a]/25 hover:bg-[#0c3d72]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  'Login'
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              St. Joseph Catholic Church © 2026
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
