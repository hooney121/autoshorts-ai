"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, googleLogin } = useAuth();
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/'); // 로그인 성공 시 메인 페이지로 이동
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await googleLogin();
      router.push('/'); // 로그인 성공 시 메인 페이지로 이동
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '구글 로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-red-600 transition-colors duration-200 mb-6 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            메인으로 돌아가기
          </Link>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-red-600 text-transparent bg-clip-text mb-2">
            로그인
          </h1>
          <p className="text-gray-600">
            AutoShorts.ai에 오신 것을 환영합니다
          </p>
        </div>

        {/* Firebase Auth 알림 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            🔥 Firebase Auth로 안전한 로그인을 제공합니다.
          </p>
        </div>

        {/* 소셜 로그인 버튼들 */}
        <div className="space-y-4 mb-8">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:border-gray-400 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 로그인
          </button>
        </div>

        {/* 구분선 */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-slate-50 via-white to-red-50 text-gray-500">또는</span>
          </div>
        </div>

        {/* 이메일 로그인 폼 */}
        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="비밀번호를 입력하세요"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                로그인 중...
              </div>
            ) : (
              '로그인'
            )}
          </button>
        </form>

        {/* 추가 링크들 */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <Link 
              href="/forgot-password" 
              className="text-red-600 hover:text-red-700 font-medium"
            >
              비밀번호 찾기
            </Link>
            <span className="text-gray-400">|</span>
            <Link 
              href="/signup" 
              className="text-red-600 hover:text-red-700 font-medium"
            >
              회원가입
            </Link>
          </div>
          
          <p className="text-xs text-gray-500">
            로그인하면 AutoShorts.ai의{' '}
            <Link href="/terms" className="text-red-600 hover:text-red-700">
              이용약관
            </Link>
            과{' '}
            <Link href="/privacy" className="text-red-600 hover:text-red-700">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </main>
  );
} 