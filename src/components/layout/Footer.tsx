import Link from 'next/link'
import { Youtube, Instagram, Facebook } from 'lucide-react'

export const Footer = () => {
  return (
    <footer className="bg-slate-50 text-slate-600">
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 로고 및 소개 */}
          <div className="md:col-span-1">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-red-500">Auto</span>Shorts.ai
            </Link>
            <p className="text-slate-500 mt-4 text-sm leading-relaxed">
              AI 기술로 콘텐츠를 매력적인 쇼츠 영상으로 자동 변환합니다.
            </p>
          </div>

          {/* 사이트맵 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">사이트맵</h3>
            <ul className="space-y-3">
              <li><Link href="/create" className="text-slate-600 hover:text-slate-900 transition-colors">쇼츠 제작</Link></li>
              <li><Link href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">기능 소개</Link></li>
              <li><Link href="/pricing" className="text-slate-600 hover:text-slate-900 transition-colors">가격</Link></li>
              <li><Link href="#faq" className="text-slate-600 hover:text-slate-900 transition-colors">자주 묻는 질문</Link></li>
            </ul>
          </div>

          {/* 관련 링크 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">리소스</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">이용약관</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">개인정보 처리방침</a></li>
              <li><a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">고객센터</a></li>
            </ul>
          </div>

          {/* 소셜 미디어 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-slate-800">소셜</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-500 hover:text-slate-800 transition-colors"><Youtube className="h-6 w-6" /></a>
              <a href="#" className="text-slate-500 hover:text-slate-800 transition-colors"><Instagram className="h-6 w-6" /></a>
              <a href="#" className="text-slate-500 hover:text-slate-800 transition-colors"><Facebook className="h-6 w-6" /></a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} AutoShorts.ai. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  )
} 