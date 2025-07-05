import React, { useState, useEffect } from 'react';
import { AdBanner } from './AdBanner';

interface AdManagerProps {
  pageType: 'home' | 'create' | 'pricing' | 'login';
  userType?: 'free' | 'premium' | 'enterprise';
}

export const AdManager: React.FC<AdManagerProps> = ({ pageType, userType = 'free' }) => {
  const [showAds, setShowAds] = useState(true);
  const [adFrequency, setAdFrequency] = useState(0);

  // 프리미엄 사용자는 광고 표시 안함
  useEffect(() => {
    if (userType === 'premium' || userType === 'enterprise') {
      setShowAds(false);
    }
  }, [userType]);

  // 광고 표시 빈도 조절
  useEffect(() => {
    const interval = setInterval(() => {
      setAdFrequency(prev => prev + 1);
    }, 30000); // 30초마다 증가

    return () => clearInterval(interval);
  }, []);

  // 페이지별 광고 전략
  const getPageAdStrategy = () => {
    switch (pageType) {
      case 'home':
        return {
          header: { type: 'banner' as const, size: 'medium' as const, adUnit: 'home-header' },
          sidebar: { type: 'sidebar' as const, size: 'large' as const, adUnit: 'home-sidebar' },
          inline: { type: 'inline' as const, size: 'small' as const, adUnit: 'home-inline' },
          footer: { type: 'banner' as const, size: 'medium' as const, adUnit: 'home-footer' }
        };
      case 'create':
        return {
          header: { type: 'banner' as const, size: 'small' as const, adUnit: 'create-header' },
          sidebar: { type: 'sidebar' as const, size: 'medium' as const, adUnit: 'create-sidebar' },
          inline: { type: 'inline' as const, size: 'small' as const, adUnit: 'create-inline' }
        };
      case 'pricing':
        return {
          header: { type: 'banner' as const, size: 'medium' as const, adUnit: 'pricing-header' },
          sidebar: { type: 'sidebar' as const, size: 'large' as const, adUnit: 'pricing-sidebar' },
          inline: { type: 'inline' as const, size: 'small' as const, adUnit: 'pricing-inline' }
        };
      default:
        return {
          header: { type: 'banner' as const, size: 'medium' as const, adUnit: 'default-header' },
          sidebar: { type: 'sidebar' as const, size: 'medium' as const, adUnit: 'default-sidebar' }
        };
    }
  };

  // 광고 표시 조건 확인
  const shouldShowAd = (adType: string) => {
    if (!showAds) return false;
    
    // 광고 빈도 제한
    if (adFrequency < 2 && adType === 'inline') return false;
    
    return true;
  };

  const strategy = getPageAdStrategy();

  return (
    <>
      {/* 헤더 광고 */}
      {shouldShowAd('header') && (
        <div className="w-full bg-gray-50 py-2">
          <AdBanner {...strategy.header} />
        </div>
      )}

      {/* 사이드바 광고 */}
      {shouldShowAd('sidebar') && (
        <div className="hidden lg:block fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
          <AdBanner {...strategy.sidebar} />
        </div>
      )}

      {/* 인라인 광고 */}
      {shouldShowAd('inline') && adFrequency > 1 && strategy.inline && (
        <div className="my-8">
          <AdBanner {...strategy.inline} />
        </div>
      )}

      {/* 푸터 광고 */}
      {shouldShowAd('footer') && strategy.footer && (
        <div className="w-full bg-gray-50 py-2 mt-8">
          <AdBanner {...strategy.footer} />
        </div>
      )}
    </>
  );
}; 