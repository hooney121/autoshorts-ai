"use client"

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Newspaper, FileText, Play, Sparkles, Zap, TrendingUp, Check, Star, User, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

export default function Home() {
  const { user, logout } = useAuth()
  const [showProfile, setShowProfile] = useState(false)

  const handleLogout = async () => {
    await logout()
    setShowProfile(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
      {/* 네비게이션 바 */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 text-transparent bg-clip-text">
            AutoShorts.ai
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-red-600 transition-colors duration-200">홈</Link>
            <Link href="/create" className="text-gray-600 hover:text-red-600 transition-colors duration-200">뉴스쇼츠 제작</Link>
            <Link href="#features" className="text-gray-600 hover:text-red-600 transition-colors duration-200">기능 소개</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-red-600 transition-colors duration-200">가격</Link>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                >
                  {user.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt={user.displayName || user.email || 'User'}
                      className="w-8 h-8 rounded-full"
                      width={32}
                      height={32}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="font-medium">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                </button>
                
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.displayName || '사용자'}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200">로그인</Link>
            )}
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-200 to-orange-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-red-100 to-orange-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              AI로 만드는 최신 뉴스 쇼츠
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-red-600 to-orange-600 text-transparent bg-clip-text leading-tight">
              뉴스를 쇼츠로
              <br />
              <span className="text-4xl md:text-6xl">자동 변환</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              뉴스 URL만 붙여넣으면 AI가 자동으로 매력적인 쇼츠 영상을 만들어드립니다
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/create"
                className="group inline-flex items-center bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                지금 시작하기
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="inline-flex items-center bg-white text-gray-700 px-8 py-4 rounded-xl text-lg font-medium hover:shadow-lg transition-all duration-200 border border-gray-200">
                <Play className="mr-2 h-5 w-5" />
                데모 보기
              </button>
            </div>
          </div>

          {/* 예시 쇼츠 썸네일 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="aspect-[9/16] bg-gradient-to-br from-red-100 to-orange-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-12 w-12 text-red-600 opacity-60" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">뉴스 쇼츠 예시</h3>
                <p className="text-sm text-gray-500">최신 뉴스를 쇼츠로 변환</p>
              </div>
            </div>
            <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="aspect-[9/16] bg-gradient-to-br from-blue-100 to-purple-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-12 w-12 text-blue-600 opacity-60" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">리뷰 쇼츠 예시</h3>
                <p className="text-sm text-gray-500">제품 리뷰를 쇼츠로 변환</p>
              </div>
            </div>
            <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="aspect-[9/16] bg-gradient-to-br from-green-100 to-teal-100 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-12 w-12 text-green-600 opacity-60" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">대본 쇼츠 예시</h3>
                <p className="text-sm text-gray-500">대본을 쇼츠로 변환</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section id="features" className="py-20 bg-white relative">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 text-transparent bg-clip-text">
              강력한 AI 기능
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              최신 AI 기술로 뉴스를 매력적인 쇼츠로 변환합니다
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-red-100 hover:border-red-200">
              <div className="bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-xl w-fit mb-6">
                <Newspaper className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">뉴스 URL → 쇼츠</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                뉴스 기사 URL만 입력하면 AI가 자동으로 내용을 분석하고 매력적인 쇼츠 영상을 만들어드립니다.
              </p>
              <Link 
                href="/create"
                className="inline-flex items-center text-red-600 font-semibold hover:text-red-700 group"
              >
                바로 만들기
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="group bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-200">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl w-fit mb-6">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">대본 → 쇼츠</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                대본을 입력하면 AI가 자동으로 스토리텔링을 구성하고 시각적으로 매력적인 쇼츠 영상을 만들어드립니다.
              </p>
              <Link 
                href="/create"
                className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 group"
              >
                바로 만들기
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 추가 기능들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="text-center p-6">
              <div className="bg-gradient-to-r from-green-600 to-teal-600 p-3 rounded-xl w-fit mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">빠른 처리</h3>
              <p className="text-gray-600 text-sm">몇 분 내에 완성되는 고품질 쇼츠</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-xl w-fit mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">트렌드 분석</h3>
              <p className="text-gray-600 text-sm">최신 트렌드를 반영한 콘텐츠</p>
            </div>
            <div className="text-center p-6">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-3 rounded-xl w-fit mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI 최적화</h3>
              <p className="text-gray-600 text-sm">알고리즘 친화적인 영상 제작</p>
            </div>
          </div>
        </div>
      </section>

      {/* 가격 섹션 */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-slate-100 relative">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 text-transparent bg-clip-text">
              합리적인 가격
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              사용량에 맞는 최적의 플랜을 선택하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 무료 플랜 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">무료</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">₩0</div>
                <p className="text-gray-600">월간</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">월 3개 쇼츠 제작</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">기본 AI 템플릿</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">720p 해상도</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">이메일 지원</span>
                </li>
              </ul>

              <Link 
                href="/create"
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200 text-center block"
              >
                무료로 시작하기
              </Link>
            </div>

            {/* 프로 플랜 */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-8 shadow-xl border-2 border-red-200 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  인기
                </div>
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">프로</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">₩29,900</div>
                <p className="text-gray-600">월간</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">월 50개 쇼츠 제작</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">고급 AI 템플릿</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">1080p 해상도</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">우선 지원</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">브랜드 워터마크 제거</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">고급 편집 도구</span>
                </li>
              </ul>

              <Link 
                href="/pricing/pro"
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 text-center block"
              >
                프로 플랜 시작하기
              </Link>
            </div>

            {/* 엔터프라이즈 플랜 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">엔터프라이즈</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">₩99,900</div>
                <p className="text-gray-600">월간</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">무제한 쇼츠 제작</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">커스텀 AI 템플릿</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">4K 해상도</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">전담 매니저</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">API 접근</span>
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">팀 협업 도구</span>
                </li>
              </ul>

              <Link 
                href="/pricing/enterprise"
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors duration-200 text-center block"
              >
                엔터프라이즈 문의
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">모든 플랜은 14일 무료 체험을 제공합니다</p>
            <Link 
              href="/pricing"
              className="inline-flex items-center text-red-600 font-semibold hover:text-red-700"
            >
              모든 플랜 보기
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
