"use client"

import Link from 'next/link'
import { ArrowRight, Newspaper, Star, FileText } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      {/* 네비게이션 바 */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-red-600">
            AutoShorts.ai
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-red-600 transition-colors">홈</Link>
            <Link href="/create" className="text-gray-600 hover:text-red-600 transition-colors">뉴스쇼츠 제작</Link>
            <Link href="#features" className="text-gray-600 hover:text-red-600 transition-colors">기능 소개</Link>
            <Link href="#pricing" className="text-gray-600 hover:text-red-600 transition-colors">가격</Link>
            <Link href="/login" className="text-gray-600 hover:text-red-600 transition-colors">로그인</Link>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-600 to-red-500 text-transparent bg-clip-text">
              유튜브 쇼츠 자동으로 만들기
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              뉴스 URL만 붙여넣으면 AI가 영상으로 만들어 드립니다
            </p>
            <Link 
              href="/create"
              className="inline-flex items-center bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
            >
              지금 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>

          {/* 예시 쇼츠 썸네일 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-[9/16] bg-gray-100"></div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">뉴스 쇼츠 예시</h3>
                <p className="text-sm text-gray-500">최신 뉴스를 쇼츠로 변환</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-[9/16] bg-gray-100"></div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">리뷰 쇼츠 예시</h3>
                <p className="text-sm text-gray-500">제품 리뷰를 쇼츠로 변환</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-[9/16] bg-gray-100"></div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900">대본 쇼츠 예시</h3>
                <p className="text-sm text-gray-500">대본을 쇼츠로 변환</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-12">주요 기능</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#FAFAFA] rounded-xl p-8 hover:border-2 hover:border-red-500 hover:shadow-lg transition-all">
              <Newspaper className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">뉴스 URL → 쇼츠</h3>
              <p className="text-gray-600 mb-4">뉴스 기사 URL만 입력하면 AI가 자동으로 쇼츠 영상을 만들어드립니다.</p>
              <Link 
                href="/create"
                className="inline-flex items-center text-red-600 font-medium hover:text-red-700"
              >
                바로 만들기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="bg-[#FAFAFA] rounded-xl p-8 hover:border-2 hover:border-red-500 hover:shadow-lg transition-all">
              <FileText className="h-12 w-12 text-red-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">대본 → 쇼츠</h3>
              <p className="text-gray-600 mb-4">대본을 입력하면 AI가 자동으로 쇼츠 영상을 만들어드립니다.</p>
              <Link 
                href="/create"
                className="inline-flex items-center text-red-600 font-medium hover:text-red-700"
              >
                바로 만들기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
