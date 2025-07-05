"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, Variants, AnimatePresence, useInView, animate } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Check, ArrowRight, Menu, X, Sparkles, User, MessageSquare, Play, ClipboardPaste, Cpu, Download, LogIn, Gift, LogOut, Settings, Sticker, MicVocal, MessageCircleHeart, HelpCircle, Hash } from 'lucide-react'
import { Accordion } from '@/components/ui/Accordion'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { ShortsExampleVideo } from './ShortsExampleVideo'

const faqData = [
  {
    question: "영상 길이는 어떻게 되나요?",
    answer: "생성되는 영상의 길이는 뉴스 기사의 길이에 따라 다르지만, 일반적으로 1분 내외의 쇼츠 영상으로 최적화됩니다. 사용자가 직접 길이를 조절하는 기능은 현재 개발 중입니다."
  },
  {
    question: "상업적 이용이 가능한가요?",
    answer: "네, 프로 및 엔터프라이즈 플랜을 구독하시면 생성된 영상을 상업적 목적으로 자유롭게 사용하실 수 있습니다. 무료 플랜으로 생성된 영상은 비상업적 용도로만 사용 가능하며, 워터마크가 포함됩니다."
  },
  {
    question: "어떤 언론사 뉴스를 지원하나요?",
    answer: "현재 국내 주요 언론사를 포함한 대부분의 뉴스 웹사이트를 지원합니다. 만약 지원되지 않는 언론사가 있다면 고객센터로 문의해주세요. 지속적으로 지원 범위를 확대하고 있습니다."
  },
  {
    question: "영상에 사용되는 이미지나 배경음악은 저작권 문제가 없나요?",
    answer: "네, 저희 AutoShorts.ai는 저작권이 확보된 이미지, 비디오 클립, 배경음악 라이브러리를 사용하여 영상을 제작하므로 저작권 걱정 없이 안전하게 사용하실 수 있습니다."
  }
]

const testimonialsData = [
  {
    name: "김민준",
    title: "콘텐츠 마케터, 스타트업 A",
    quote: "AutoShorts.ai 덕분에 뉴스 기반 콘텐츠 제작 시간이 1/10로 줄었습니다. 반복적인 영상 편집 작업에서 벗어나 더 창의적인 기획에 집중할 수 있게 되었어요.",
    initial: "K"
  },
  {
    name: "이서연",
    title: "1인 미디어 운영자",
    quote: "최신 트렌드를 빠르게 따라가야 하는 입장에서, 뉴스 기사를 바로 영상으로 만들 수 있다는 점이 정말 매력적입니다. 구독자 반응도 훨씬 좋아졌어요!",
    initial: "L"
  },
  {
    name: "박지훈",
    title: "디지털 에이전시, 팀장",
    quote: "클라이언트에게 뉴스 모니터링 결과를 보고할 때, 텍스트 대신 쇼츠 영상으로 만들어 전달하니 훨씬 이해도가 높고 반응이 좋습니다. 업무 효율이 극대화되었어요.",
    initial: "P"
  }
]

const specialFeaturesData = [
  {
    icon: Sticker,
    premiumLabel: "FEATURE 1",
    title: "100여가지의 스티커를 선택하세요",
    description: "영상에 생동감을 더하는 100가지 이상의 스티커로 콘텐츠를 꾸며보세요. 감정 표현부터 정보 강조까지, 클릭 한 번으로 쉽게 적용할 수 있습니다."
  },
  {
    icon: MicVocal,
    premiumLabel: "FEATURE 2",
    title: "목소리를 선택하세요",
    description: "기본 목소리부터 프로, 프리미엄 목소리까지. 플랜에 따라 다양한 목소리 선택이 가능해요. 상품에 어울리는 목소리를 선택해서 영상의 퀄리티를 높이세요."
  },
  {
    icon: MessageCircleHeart,
    premiumLabel: "FEATURE 3",
    title: "나레이션 말투를 선택하세요",
    description: "내 채널은 어떤 캐릭터를 가지고 있나요? 내가 리뷰하는 상품에는 어떤 말투가 어울릴까요? 아나운서, 블로거, 세일즈맨 등의 말투를 자유롭게 선택해보세요!"
  }
];

export default function Home() {
  const { user, logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const statsRef = useRef<HTMLSpanElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, amount: 0.5 });
  const [generatedVideos, setGeneratedVideos] = useState(353758);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  useEffect(() => {
    // On each client-side load, add a small random increment to simulate live data
    setGeneratedVideos(353758 + Math.floor(Math.random() * 200));
  }, []);

  useEffect(() => {
    if (isStatsInView && statsRef.current) {
      const node = statsRef.current;
      const controls = animate(generatedVideos - 500, generatedVideos, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate(value) {
          node.textContent = Math.round(value).toLocaleString('en-US');
        }
      });
      return () => controls.stop();
    }
  }, [isStatsInView, generatedVideos]);

  const handleLogout = async () => {
    try {
      await logout()
      setShowProfileDropdown(false)
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6, 
        ease: "easeOut"
      } 
    }
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  }
  
  return (
    <>
      {/* 통계 숫자 무지개 애니메이션 스타일 */}
      <style jsx global>{`
        @keyframes rainbow-text {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .rainbow-text {
          background: linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0000);
          background-size: 400% 400%;
          animation: rainbow-text 3s ease-in-out infinite;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <header className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}>
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex justify-between items-center h-20 text-slate-800">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-red-500">Auto</span>Shorts.ai
            </Link>
            
            <nav className="hidden md:flex items-center space-x-6 text-lg">
              <Link href="#how-it-works" className="text-slate-600 hover:text-red-500 transition-colors">작동 방식</Link>
              <Link href="#faq" className="text-slate-600 hover:text-red-500 transition-colors">FAQ</Link>
              <Link href="/pricing" className="text-slate-600 hover:text-red-500 transition-colors">가격</Link>
              <Link href="/advertising" className="text-slate-600 hover:text-blue-500 transition-colors">광고 문의</Link>
              <Link href="/create-story" className="text-slate-600 hover:text-green-500 transition-colors font-bold">썰튜브 쇼츠 제작</Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/create-story" className="hidden md:inline-flex items-center bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all mr-2">
                <MessageCircleHeart className="mr-2 h-4 w-4" />
                썰튜브 쇼츠
              </Link>
              <Link href="/create" className="hidden md:inline-flex items-center bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all">
                쇼츠 제작
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-2 text-slate-600 hover:text-red-500 transition-colors duration-200"
                  >
                    {user.photoURL ? (
                      <Image 
                        src={user.photoURL} 
                        alt={user.displayName || user.email || 'User'}
                        className="w-8 h-8 rounded-full border-2 border-slate-300 hover:border-red-500 transition-colors"
                        width={32}
                        height={32}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center border-2 border-slate-300 hover:border-red-500 transition-colors">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="font-medium hidden sm:block">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                  </button>
                  
                  <AnimatePresence>
                    {showProfileDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-slate-200">
                          <p className="text-sm font-medium text-slate-900">{user.displayName || '사용자'}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          대시보드
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          로그아웃
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hidden md:inline-flex items-center bg-white text-slate-700 px-4 py-2 rounded-lg font-semibold hover:bg-slate-100 transition-all border border-slate-300"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </button>
              )}

              <button
                className="md:hidden text-slate-600 hover:text-red-500"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm md:hidden"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col space-y-4 text-slate-800">
              <Link href="#how-it-works" className="hover:text-red-500 transition-colors text-lg" onClick={() => setIsMenuOpen(false)}>작동 방식</Link>
              <Link href="#faq" className="hover:text-red-500 transition-colors text-lg" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
              <Link href="/pricing" className="hover:text-red-500 transition-colors text-lg" onClick={() => setIsMenuOpen(false)}>가격</Link>
              <Link href="/create-story" className="inline-flex items-center justify-center bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                <MessageCircleHeart className="mr-2 h-4 w-4" />
                썰튜브 쇼츠
              </Link>
              <Link href="/create" className="inline-flex items-center justify-center bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                쇼츠 제작
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              {!user && (
                <button 
                  onClick={() => {
                    setIsLoginModalOpen(true)
                    setIsMenuOpen(false)
                  }}
                  className="inline-flex items-center justify-center bg-slate-100 text-slate-800 px-6 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-all border border-slate-300"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  로그인
                </button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 로그인 모달 */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsLoginModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-3 rounded-xl w-fit mx-auto mb-4">
                  <Gift className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">무료 체험 시작하기</h2>
                <p className="text-slate-400">로그인하고 무료 혜택을 받아보세요!</p>
              </div>

              <div className="bg-gradient-to-r from-green-600/20 to-teal-600/20 border border-green-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center mb-2">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-400 font-semibold">무료 혜택</span>
                </div>
                <p className="text-slate-300 text-sm">
                  <strong>월 6개</strong>까지 쇼츠를 무료로 제작할 수 있습니다!
                </p>
              </div>

              <div className="space-y-4">
                <Link 
                  href="/login"
                  className="block w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all text-center"
                  onClick={() => setIsLoginModalOpen(false)}
                >
                  <LogIn className="inline mr-2 h-4 w-4" />
                  로그인하기
                </Link>
                <Link 
                  href="/signup"
                  className="block w-full bg-slate-700 text-slate-200 py-3 px-4 rounded-lg font-semibold hover:bg-slate-600 transition-all text-center"
                  onClick={() => setIsLoginModalOpen(false)}
                >
                  회원가입
                </Link>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500">
                  로그인하면 무료 체험을 시작할 수 있습니다
                </p>
              </div>

              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-20 bg-white text-slate-800">
        <motion.section 
          className="pt-32 pb-20 px-4 relative overflow-hidden bg-slate-50"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          <div className="absolute inset-0 overflow-hidden opacity-50">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-200 to-orange-200 rounded-full opacity-50 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full opacity-50 blur-3xl"></div>
          </div>
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }} className="text-center mb-16">
              <div className="inline-flex items-center bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-medium mb-6 ring-1 ring-red-200">
                <Sparkles className="h-4 w-4 mr-2" />
                AI로 만드는 최신 뉴스 쇼츠
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-red-600 to-orange-500 text-transparent bg-clip-text leading-tight">
                원클릭으로<br />
                <span className="text-4xl md:text-6xl">간단한 쇼츠 생성</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                URL을 붙여넣거나 대본을 입력하면 AI가 자동으로 매력적인 쇼츠 영상을 만들어드립니다
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                  href="/create"
                  className="group inline-flex items-center bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  뉴스 쇼츠 제작
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/create-story"
                  className="group inline-flex items-center bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  썰튜브 쇼츠 제작
                  <MessageCircleHeart className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
              {/* 예시 영상 섹션 */}
              <ShortsExampleVideo />
            </motion.div>
          </div>
        </motion.section>

        <motion.section
          id="stats"
          className="py-16 bg-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              이미 <span ref={statsRef} className="rainbow-text">{generatedVideos.toLocaleString()}</span>개의 영상이 제작되었습니다
            </h2>
            <p className="text-slate-600 mb-8">매일 수백 개의 새로운 쇼츠가 탄생하고 있습니다</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-3xl font-bold text-slate-900 mb-2">10K+</div>
                <div className="text-slate-600">활성 사용자</div>
              </motion.div>
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-3xl font-bold text-slate-900 mb-2">99.9%</div>
                <div className="text-slate-600">가동 시간</div>
              </motion.div>
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-3xl font-bold text-slate-900 mb-2">50+</div>
                <div className="text-slate-600">지원 언론사</div>
              </motion.div>
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <div className="text-3xl font-bold text-slate-900 mb-2">4.9★</div>
                <div className="text-slate-600">사용자 평점</div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* 작동 방식 섹션 */}
        <motion.section 
          id="how-it-works" 
          className="py-20 bg-slate-50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-slate-900">
                간단한 3단계
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                누구나 쉽게 따라할 수 있는 간단한 과정으로 쇼츠를 만들어보세요
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div 
                className="text-center"
                variants={cardVariants}
                custom={0}
              >
                <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <ClipboardPaste className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900">1. URL 붙여넣기</h3>
                <p className="text-slate-600">뉴스 기사의 URL을 입력창에 붙여넣으세요. 어떤 언론사든 상관없습니다.</p>
              </motion.div>
              
              <motion.div 
                className="text-center"
                variants={cardVariants}
                custom={1}
              >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Cpu className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900">2. AI 자동 처리</h3>
                <p className="text-slate-600">AI가 기사를 분석하고 스크립트, 음성, 자막, 이미지를 자동으로 생성합니다.</p>
              </motion.div>
              
              <motion.div 
                className="text-center"
                variants={cardVariants}
                custom={2}
              >
                <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                  <Download className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-slate-900">3. 영상 다운로드</h3>
                <p className="text-slate-600">완성된 쇼츠 영상을 다운로드하여 플랫폼에 업로드하세요.</p>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* 썰튜브 쇼츠 제작 섹션 */}
        <motion.section 
          className="py-20 bg-gradient-to-br from-green-50 via-white to-teal-50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
                <MessageCircleHeart className="h-4 w-4 mr-2" />
                STORY SHORTS
              </div>
              <h2 className="text-4xl font-bold mb-4 text-slate-900">
                재미있는 이야기를 쇼츠로 만들어보세요
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                일상의 재미있는 이야기부터 판타지 스토리까지, AI가 자동으로 쇼츠용 스크립트와 음성을 생성합니다
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                variants={cardVariants}
                custom={0}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white p-4 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">충격적인 학교 뒷이야기</h3>
                      <p className="text-green-100 text-sm">믿을 수 없는 결말</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">📖 이야기 내용</h4>
                        <p className="text-sm text-slate-600">어느 날 밤, 친구와 함께 놀러간 민수는 학교 뒤편에서 이상한 소리를 들었습니다...</p>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">🎬 생성된 스크립트</h4>
                        <p className="text-sm text-slate-600">"충격적인 결말! 어느 날 밤, 친구와 함께 놀러간 민수는..."</p>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2">🎵 AI 음성 + 자막</h4>
                        <p className="text-sm text-slate-600">자연스러운 한국어 음성과 정확한 자막이 자동으로 생성됩니다</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -top-4 -right-4">
                  <Link 
                    href="/create-story"
                    className="inline-flex items-center bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <MessageCircleHeart className="mr-2 h-4 w-4" />
                    썰튜브 쇼츠 시작
                  </Link>
                </div>
              </motion.div>

              <motion.div 
                variants={cardVariants}
                custom={1}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-r from-green-600 to-teal-600 p-2 rounded-lg mr-4">
                      <MessageCircleHeart className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">이야기 작성</h3>
                  </div>
                  <p className="text-slate-600">재미있고 흥미로운 이야기를 자세히 작성하세요. AI가 이를 바탕으로 쇼츠용 스크립트를 생성합니다.</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-4">
                      <MicVocal className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">AI 음성 생성</h3>
                  </div>
                  <p className="text-slate-600">ElevenLabs AI가 자연스러운 한국어 음성과 정확한 자막을 자동으로 생성합니다.</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2 rounded-lg mr-4">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">쇼츠 비디오 제작</h3>
                  </div>
                  <p className="text-slate-600">업로드한 이미지나 AI가 찾은 관련 이미지와 함께 완성된 쇼츠 비디오를 다운로드하세요.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* 특별 기능 섹션 */}
        <motion.section 
          className="py-20 bg-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-slate-900">
                프리미엄 기능
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                더욱 전문적인 쇼츠 제작을 위한 고급 기능들
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {specialFeaturesData.map((feature, index) => (
                <motion.div 
                  key={index} 
                  className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-slate-300"
                  variants={cardVariants}
                  custom={index}
                >
                  <div className="inline-flex items-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold mb-4">
                    {feature.premiumLabel}
                  </div>
                  <div className="bg-gradient-to-r from-slate-600 to-slate-800 p-3 rounded-xl w-fit mb-6">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* 고객 후기 섹션 */}
        <motion.section 
          className="py-20 bg-slate-50"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <div className="container mx-auto max-w-7xl px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-slate-900">
                고객 후기
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                실제 사용자들의 생생한 경험담
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonialsData.map((testimonial, index) => (
                <motion.div 
                  key={index} 
                  className="bg-white rounded-2xl p-8 hover:shadow-lg transition-all duration-300 border border-slate-200"
                  variants={cardVariants}
                  custom={index}
                >
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {testimonial.initial}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                      <p className="text-sm text-slate-600">{testimonial.title}</p>
                    </div>
                  </div>
                  <blockquote className="text-slate-700 italic leading-relaxed">
                    {testimonial.quote}
                  </blockquote>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* FAQ 섹션 */}
        <motion.section 
          id="faq" 
          className="py-20 bg-gradient-to-b from-slate-50 to-white"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
        >
          <div className="container mx-auto max-w-4xl px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center bg-blue-100 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <HelpCircle className="h-4 w-4 mr-2" />
                자주 묻는 질문
              </div>
              <h2 className="text-4xl font-bold mb-4 text-slate-900">
                궁금한 점이 있으신가요?
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                자주 묻는 질문들을 모아봤습니다. 더 궁금한 점이 있으시면 언제든 문의해주세요!
              </p>
            </div>
            
            <div className="space-y-4">
              {faqData.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Accordion question={faq.question} answer={faq.answer} />
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 border border-slate-200">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">더 궁금한 점이 있으신가요?</h3>
                <p className="text-slate-600 mb-4">문의사항이 있으시면 언제든 연락주세요. 빠르게 답변드리겠습니다.</p>
                <button className="inline-flex items-center bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  문의하기
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </>
  )
}
