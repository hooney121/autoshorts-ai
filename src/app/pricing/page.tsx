"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Check, Star, Zap, Crown, Users, ArrowRight } from 'lucide-react'

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: "무료",
      description: "개인 사용자를 위한 기본 플랜",
      price: { monthly: 0, annual: 0 },
      features: [
        "월 3개 쇼츠 제작",
        "기본 AI 템플릿",
        "720p 해상도",
        "워터마크 포함",
        "이메일 지원"
      ],
      buttonText: "무료로 시작하기",
      buttonStyle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
      popular: false,
      icon: Zap
    },
    {
      name: "프로",
      description: "콘텐츠 크리에이터를 위한 최적 플랜",
      price: { monthly: 29900, annual: 239200 }, // 연간 20% 할인
      features: [
        "월 50개 쇼츠 제작",
        "고급 AI 템플릿",
        "1080p 해상도",
        "워터마크 제거",
        "우선 지원",
        "고급 편집 도구",
        "다양한 목소리 선택",
        "커스텀 스티커"
      ],
      buttonText: "프로 플랜 시작하기",
      buttonStyle: "bg-gradient-to-r from-red-600 to-orange-600 text-white hover:shadow-lg hover:scale-105",
      popular: true,
      icon: Star
    },
    {
      name: "엔터프라이즈",
      description: "대규모 팀과 기업을 위한 플랜",
      price: { monthly: 99900, annual: 799200 }, // 연간 33% 할인
      features: [
        "무제한 쇼츠 제작",
        "커스텀 AI 템플릿",
        "4K 해상도",
        "전담 매니저",
        "API 접근",
        "팀 협업 도구",
        "브랜드 커스터마이징",
        "우선 기술 지원",
        "고급 분석 도구",
        "화이트라벨 솔루션"
      ],
      buttonText: "영업팀 문의",
      buttonStyle: "bg-slate-900 text-white hover:bg-slate-800",
      popular: false,
      icon: Crown
    }
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const getSavings = (monthly: number, annual: number) => {
    const monthlyCost = monthly * 12
    const savings = monthlyCost - annual
    const percentage = Math.round((savings / monthlyCost) * 100)
    return percentage
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
      {/* 헤더 */}
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-16">
          <Link 
            href="/"
            className="inline-flex items-center text-slate-600 hover:text-red-600 transition-colors duration-200 mb-6 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            메인으로 돌아가기
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-red-600 to-orange-600 text-transparent bg-clip-text">
              가격 플랜
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              사용량에 맞는 최적의 플랜을 선택하고 더 많은 쇼츠를 만들어보세요
            </p>
          </motion.div>

          {/* 월간/연간 토글 */}
          <motion.div 
            className="flex items-center justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className={`mr-3 ${!isAnnual ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
              월간 결제
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                isAnnual ? 'bg-red-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${isAnnual ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
              연간 결제
            </span>
            {isAnnual && (
              <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                최대 33% 할인
              </span>
            )}
          </motion.div>
        </div>

        {/* 가격 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl p-8 shadow-lg border hover:shadow-xl transition-all duration-300 ${
                plan.popular 
                  ? 'border-red-200 ring-2 ring-red-100' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    인기
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${
                  plan.name === '무료' ? 'bg-slate-100' :
                  plan.name === '프로' ? 'bg-gradient-to-r from-red-100 to-orange-100' :
                  'bg-slate-900'
                }`}>
                  <plan.icon className={`h-8 w-8 ${
                    plan.name === '무료' ? 'text-slate-600' :
                    plan.name === '프로' ? 'text-red-600' :
                    'text-white'
                  }`} />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-600 mb-4">{plan.description}</p>
                
                <div className="mb-2">
                  <span className="text-4xl font-bold text-slate-900">
                    ₩{formatPrice(isAnnual ? Math.round(plan.price.annual / 12) : plan.price.monthly)}
                  </span>
                  <span className="text-slate-500 ml-1">
                    /월
                  </span>
                </div>
                
                {isAnnual && plan.price.annual > 0 && (
                  <div className="text-sm text-green-600 font-semibold">
                    연간 {getSavings(plan.price.monthly, plan.price.annual)}% 할인
                  </div>
                )}
                
                {plan.price.monthly === 0 && (
                  <div className="text-sm text-slate-500">영구 무료</div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.name === '엔터프라이즈' ? '/contact' : '/create'}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 text-center block ${plan.buttonStyle}`}
              >
                {plan.buttonText}
              </Link>

              {plan.name === '프로' && (
                <div className="mt-4 text-center">
                  <span className="text-sm text-slate-500">14일 무료 체험</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* FAQ 섹션 */}
        <motion.div 
          className="mt-20 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
            자주 묻는 질문
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">플랜 변경이 가능한가요?</h3>
              <p className="text-slate-600 text-sm">네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">환불 정책은 어떻게 되나요?</h3>
              <p className="text-slate-600 text-sm">14일 내에 100% 환불이 가능합니다. 별도 수수료는 없습니다.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">팀 할인이 있나요?</h3>
              <p className="text-slate-600 text-sm">5명 이상의 팀에게는 특별 할인을 제공합니다. 영업팀에 문의해주세요.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">사용하지 않은 크레딧은 어떻게 되나요?</h3>
              <p className="text-slate-600 text-sm">사용하지 않은 크레딧은 다음 달로 이월되지 않습니다.</p>
            </div>
          </div>
        </motion.div>

        {/* CTA 섹션 */}
        <motion.div 
          className="mt-20 text-center bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            지금 시작해보세요
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            몇 분 안에 첫 번째 쇼츠를 만들어보세요. 신용카드 등록 없이 무료로 시작할 수 있습니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/create"
              className="inline-flex items-center bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              무료로 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link 
              href="/contact"
              className="inline-flex items-center bg-white text-slate-700 px-8 py-4 rounded-xl text-lg font-medium hover:bg-slate-50 transition-all duration-200 border border-slate-300"
            >
              <Users className="mr-2 h-5 w-5" />
              영업팀 문의
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
} 