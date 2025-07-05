import Link from 'next/link'
import { Youtube, Instagram, Facebook } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-t from-slate-100 to-white border-t border-slate-200 py-16 mt-24">
      <div className="container mx-auto max-w-7xl px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* 브랜드/소개 */}
        <div>
          <div className="flex items-center mb-4">
            <span className="text-2xl font-extrabold text-red-500">Auto</span>
            <span className="text-2xl font-extrabold text-slate-900">Shorts.ai</span>
          </div>
          <p className="text-slate-600 mb-6">AI 기술로 콘텐츠를 매력적인 쇼츠 영상으로 자동 변환합니다.<br/>지금 바로 새로운 크리에이티브를 경험하세요!</p>
          <div className="flex space-x-3 mt-4">
            <a href="#" className="hover:text-red-500 transition"><Youtube className="h-6 w-6" /></a>
            <a href="#" className="hover:text-pink-500 transition"><Instagram className="h-6 w-6" /></a>
            <a href="#" className="hover:text-blue-600 transition"><Facebook className="h-6 w-6" /></a>
          </div>
        </div>
        {/* 사이트맵 */}
        <div>
          <h4 className="font-bold mb-4 text-slate-900">사이트맵</h4>
          <ul className="space-y-2 text-slate-600">
            <li><Link href="/create" className="hover:text-red-500 transition">쇼츠 제작</Link></li>
            <li><Link href="#features" className="hover:text-red-500 transition">기능 소개</Link></li>
            <li><Link href="/pricing" className="hover:text-red-500 transition">가격</Link></li>
            <li><Link href="#faq" className="hover:text-red-500 transition">FAQ</Link></li>
          </ul>
        </div>
        {/* 리소스 */}
        <div>
          <h4 className="font-bold mb-4 text-slate-900">리소스</h4>
          <ul className="space-y-2 text-slate-600">
            <li><a href="#" className="hover:text-red-500 transition">이용약관</a></li>
            <li><a href="#" className="hover:text-red-500 transition">개인정보 처리방침</a></li>
            <li><a href="#" className="hover:text-red-500 transition">고객센터</a></li>
          </ul>
        </div>
        {/* 뉴스레터/문의 */}
        <div>
          <h4 className="font-bold mb-4 text-slate-900">뉴스레터 구독</h4>
          <form className="flex mb-4">
            <input type="email" placeholder="이메일 입력" className="flex-1 px-3 py-2 rounded-l-lg border border-slate-300 focus:outline-none" />
            <button className="bg-red-500 text-white px-4 py-2 rounded-r-lg font-semibold hover:bg-red-600 transition">구독</button>
          </form>
          <a
            href="https://open.kakao.com/o/s9t8i9Eh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-red-500 font-semibold hover:underline"
          >
            빠른 문의하기 →
          </a>
        </div>
      </div>
      <div className="mt-12 border-t border-slate-200 pt-6 text-center text-slate-400 text-sm">
        © {new Date().getFullYear()} AutoShorts.ai. All rights reserved.
      </div>
    </footer>
  )
} 