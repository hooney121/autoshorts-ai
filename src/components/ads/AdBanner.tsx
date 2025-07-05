import React from 'react';

interface AdBannerProps {
  type: 'banner' | 'sidebar' | 'inline' | 'popup';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  adUnit?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ 
  type, 
  size = 'medium', 
  className = '',
  adUnit = 'default'
}) => {
  const getAdSize = () => {
    switch (size) {
      case 'small':
        return 'w-full h-60';
      case 'large':
        return 'w-full h-96';
      default:
        return 'w-full h-80';
    }
  };

  const getAdStyle = () => {
    switch (type) {
      case 'sidebar':
        return 'w-64 h-96 mx-auto';
      case 'inline':
        return 'w-full h-32 my-4';
      case 'popup':
        return 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
      default:
        return getAdSize();
    }
  };

  // Google AdSense 광고 코드 (실제 사용시 AdSense에서 제공하는 코드로 교체)
  const renderAdSenseAd = () => (
    <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center ${getAdStyle()} ${className}`}>
      <div className="text-center p-4">
        <div className="text-gray-500 text-sm mb-2">광고 영역</div>
        <div className="text-gray-400 text-xs">AdSense Unit: {adUnit}</div>
        <div className="text-gray-400 text-xs">Size: {size} | Type: {type}</div>
      </div>
    </div>
  );

  // 직접 광고주 광고 (예시)
  const renderDirectAd = () => (
    <div className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white ${getAdStyle()} ${className}`}>
      <div className="text-center">
        <h3 className="font-bold text-lg mb-2">스폰서 광고</h3>
        <p className="text-sm mb-3">관련 서비스나 제품을 홍보합니다</p>
        <button className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors">
          자세히 보기
        </button>
      </div>
    </div>
  );

  // 제휴 마케팅 광고 (예시)
  const renderAffiliateAd = () => (
    <div className={`bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-4 text-white ${getAdStyle()} ${className}`}>
      <div className="text-center">
        <h3 className="font-bold text-lg mb-2">추천 제품</h3>
        <p className="text-sm mb-3">AI 도구 및 편집 소프트웨어</p>
        <button className="bg-white text-green-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors">
          구매하기
        </button>
      </div>
    </div>
  );

  // 광고 타입에 따라 다른 광고 렌더링
  const renderAd = () => {
    switch (adUnit) {
      case 'direct':
        return renderDirectAd();
      case 'affiliate':
        return renderAffiliateAd();
      default:
        return renderAdSenseAd();
    }
  };

  if (type === 'popup') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <h3 className="font-bold text-lg mb-4">스폰서 콘텐츠</h3>
            <p className="text-gray-600 mb-4">관심 있는 광고를 확인해보세요</p>
            <div className="space-y-2">
              <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors">
                확인하기
              </button>
              <button className="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition-colors">
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return renderAd();
}; 