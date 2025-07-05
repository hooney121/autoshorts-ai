"use client"

import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Volume2, Loader2, Square } from 'lucide-react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'

// 모달용 컴포넌트 추가
interface FontSettingModalProps {
  open: boolean;
  onClose: () => void;
  font: string;
  setFont: (v: string) => void;
  fontOptions: { value: string; label: string; preview: string; recommended?: boolean }[];
  label: string;
  color: string;
  setColor: (v: string) => void;
  outline: string;
  setOutline: (v: string) => void;
  outlineWidth: number;
  setOutlineWidth: (v: number) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  title: string;
  subtitle: string;
  channelName: string;
  mainText: string;
  titleFont: string;
  titleFontSize: number;
  titleColor: string;
  titleOutline: string;
  titleOutlineWidth: number;
  subtitleFont: string;
  subtitleFontSize: number;
  subtitleColor: string;
  subtitleOutline: string;
  subtitleOutlineWidth: number;
  channelFont: string;
  channelFontSize: number;
  channelColor: string;
  channelOutline: string;
  channelOutlineWidth: number;
  scriptFont: string;
  scriptFontSize: number;
  scriptColor: string;
  scriptOutline: string;
  scriptOutlineWidth: number;
}

// 색상 프리셋 배열을 두 그룹으로 분리
const colorPresetsNoOutline = [
  { color: '#fff', outline: '#000000', outlineWidth: 0, label: '흰(획X)' },
  { color: '#ffe600', outline: '#000000', outlineWidth: 0, label: '노(획X)' },
  { color: '#ff3b3b', outline: '#000000', outlineWidth: 0, label: '빨(획X)' },
  { color: '#00e0ff', outline: '#000000', outlineWidth: 0, label: '하늘(획X)' },
  { color: '#222', outline: '#000000', outlineWidth: 0, label: '검(획X)' },
  { color: '#b366ff', outline: '#000000', outlineWidth: 0, label: '보라(획X)' },
  { color: '#ff3bff', outline: '#000000', outlineWidth: 0, label: '핑크(획X)' },
  { color: '#00ff00', outline: '#000000', outlineWidth: 0, label: '초록(획X)' },
  { color: '#ff8000', outline: '#000000', outlineWidth: 0, label: '주황(획X)' },
  { color: '#0080ff', outline: '#000000', outlineWidth: 0, label: '파랑(획X)' },
  { color: '#ff0080', outline: '#000000', outlineWidth: 0, label: '마젠타(획X)' },
  { color: '#00ff80', outline: '#000000', outlineWidth: 0, label: '연두(획X)' },
  { color: '#808080', outline: '#000000', outlineWidth: 0, label: '회색(획X)' },
  { color: '#ffd700', outline: '#000000', outlineWidth: 0, label: '골드(획X)' },
  { color: '#8b4513', outline: '#000000', outlineWidth: 0, label: '브라운(획X)' },
];
const colorPresetsWithOutline = [
  { color: '#fff', outline: '#222', outlineWidth: 2.5, label: '흰+검' },
  { color: '#222', outline: '#fff', outlineWidth: 2.5, label: '검+흰' },
  { color: '#ffe600', outline: '#222', outlineWidth: 2.5, label: '노+검' },
  { color: '#ff3b3b', outline: '#fff', outlineWidth: 2.5, label: '빨+흰' },
  { color: '#00e0ff', outline: '#222', outlineWidth: 2.5, label: '하늘+검' },
  { color: '#ffb800', outline: '#222', outlineWidth: 2.5, label: '주+검' },
  { color: '#fff', outline: '#ff3b3b', outlineWidth: 2.5, label: '흰+빨' },
  { color: '#fff', outline: '#ffe600', outlineWidth: 2.5, label: '흰+노' },
  { color: '#fff', outline: '#00e0ff', outlineWidth: 2.5, label: '흰+하늘' },
  { color: '#ff3b3b', outline: '#ffe600', outlineWidth: 2.5, label: '빨+노' },
  { color: '#ff3b3b', outline: '#222', outlineWidth: 2.5, label: '빨+검' },
  { color: '#ffe600', outline: '#ff3b3b', outlineWidth: 2.5, label: '노+빨' },
  { color: '#00e0ff', outline: '#fff', outlineWidth: 2.5, label: '하늘+흰' },
  { color: '#b366ff', outline: '#222', outlineWidth: 2.5, label: '보라+검' },
  { color: '#ff3bff', outline: '#fff', outlineWidth: 2.5, label: '핑크+흰' },
];

function FontSettingModal({ open, onClose, font, setFont, fontOptions, label, color, setColor, outline, setOutline, outlineWidth, setOutlineWidth, fontSize, setFontSize, title, subtitle, channelName, mainText, titleFont, titleFontSize, titleColor, titleOutline, titleOutlineWidth, subtitleFont, subtitleFontSize, subtitleColor, subtitleOutline, subtitleOutlineWidth, channelFont, channelFontSize, channelColor, channelOutline, channelOutlineWidth, scriptFont, scriptFontSize, scriptColor, scriptOutline, scriptOutlineWidth }: FontSettingModalProps) {
  const [tempFont, setTempFont] = useState(font);
  const [tempFontSize, setTempFontSize] = useState(fontSize);
  const [tempColor, setTempColor] = useState(color);
  const [tempOutline, setTempOutline] = useState(outline);
  const [tempOutlineWidth, setTempOutlineWidth] = useState(outlineWidth);

  // 휠로만 이동
  const [modalHeight, setModalHeight] = useState(600);
  const [modalY, setModalY] = useState(() => {
    const minY = 32;
    const maxY = window.innerHeight - 600 - 32;
    return Math.max(minY, Math.min(maxY, window.innerHeight / 2 - 300));
  });
  const modalRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (modalRef.current) {
      const h = modalRef.current.offsetHeight || 600;
      setModalHeight(h);
      // 모달이 열릴 때마다 중앙에 위치(단, 한도 내에서)
      const minY = 32;
      const maxY = window.innerHeight - h - 32;
      setModalY(Math.max(minY, Math.min(maxY, window.innerHeight / 2 - h / 2)));
    }
  }, [open]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const minY = 32;
    const maxY = window.innerHeight - modalHeight - 32;
    setModalY((prev) => {
      const next = prev - e.deltaY;
      return Math.max(minY, Math.min(maxY, next));
    });
  };

  useEffect(() => {
    setTempFont(font);
    setTempFontSize(fontSize);
    setTempColor(color);
    setTempOutline(outline);
    setTempOutlineWidth(outlineWidth);
  }, [open, font, fontSize, color, outline, outlineWidth]);

  const handleSave = () => {
    setFont(tempFont);
    setFontSize(tempFontSize);
    setColor(tempColor);
    setOutline(tempOutline);
    setOutlineWidth(tempOutlineWidth);
    onClose();
  };

  const previewProps = {
    title,
    subtitle,
    channelName,
    mainText,
    titleFont: label === '제목' ? tempFont : titleFont,
    titleFontSize: label === '제목' ? tempFontSize : titleFontSize,
    titleColor: label === '제목' ? tempColor : titleColor,
    titleOutline: label === '제목' ? tempOutline : titleOutline,
    titleOutlineWidth: label === '제목' ? tempOutlineWidth : titleOutlineWidth,
    subtitleFont: label === '소제목' ? tempFont : subtitleFont,
    subtitleFontSize: label === '소제목' ? tempFontSize : subtitleFontSize,
    subtitleColor: label === '소제목' ? tempColor : subtitleColor,
    subtitleOutline: label === '소제목' ? tempOutline : subtitleOutline,
    subtitleOutlineWidth: label === '소제목' ? tempOutlineWidth : subtitleOutlineWidth,
    channelFont: label === '채널명' ? tempFont : channelFont,
    channelFontSize: label === '채널명' ? tempFontSize : channelFontSize,
    channelColor: label === '채널명' ? tempColor : channelColor,
    channelOutline: label === '채널명' ? tempOutline : channelOutline,
    channelOutlineWidth: label === '채널명' ? tempOutlineWidth : channelOutlineWidth,
    scriptFont: label === '대본' ? tempFont : scriptFont,
    scriptFontSize: label === '대본' ? tempFontSize : scriptFontSize,
    scriptColor: label === '대본' ? tempColor : scriptColor,
    scriptOutline: label === '대본' ? tempOutline : scriptOutline,
    scriptOutlineWidth: label === '대본' ? tempOutlineWidth : scriptOutlineWidth,
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-40"
      style={{ overflow: 'hidden' }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-xl p-8"
        style={{
          position: 'fixed',
          left: '50%',
          top: modalY,
          transform: 'translateX(-50%)',
          width: 1100,
          maxWidth: '99vw',
          zIndex: 100,
          overflow: 'hidden',
          display: 'flex',
          gap: 48,
          alignItems: 'flex-start',
        }}
        onWheel={handleWheel}
      >
        {/* 왼쪽: 설정 UI */}
        <div style={{ flex: 1.2, minWidth: 480, maxHeight: 800, overflowY: 'auto' }}>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              border: 'none',
              fontSize: 32,
              color: '#222',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'background 0.2s, color 0.2s',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = '#ff3b3b';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.7)';
              e.currentTarget.style.color = '#222';
            }}
          >
            ×
          </button>
          <h2
            className="text-2xl font-extrabold mb-6 text-gray-800 select-none cursor-move"
            style={{ userSelect: 'none' }}
          >
            {label} 디자인 설정
          </h2>
          <div className="mb-6">
            <div className="mb-2 text-lg font-bold text-[#111]">폰트</div>
            <select value={tempFont} onChange={e => setTempFont(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              {fontOptions.map(font => <option key={font.value} value={font.value}>{font.label}{font.recommended ? ' (추천)' : ''}</option>)}
            </select>
          </div>
          <div className="mb-6">
            <div className="mb-2 text-lg font-bold text-[#111] flex items-center">폰트 크기
              <span className="ml-2 text-base text-blue-600 font-semibold">{tempFontSize}px</span>
            </div>
            <input type="range" min={16} max={72} value={tempFontSize} onChange={e => setTempFontSize(Number(e.target.value))} className="w-full" />
          </div>
          <div className="mb-6">
            <div className="mb-2 text-lg font-bold text-[#111]">자막 색상</div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {colorPresetsNoOutline.map((preset, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-2 py-2 text-center cursor-pointer border-4 ${tempColor === preset.color && tempOutline === preset.outline && tempOutlineWidth === 0 ? 'border-blue-500 shadow-lg' : 'border-[#222]'}`}
                  style={{ background: '#111', minWidth: 80, minHeight: 54, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => { setTempColor(preset.color); setTempOutline(preset.outline); setTempOutlineWidth(0); }}
                >
                  <span style={{
                    color: preset.color,
                    WebkitTextStroke: `0px ${preset.outline}`,
                    fontWeight: 900,
                    fontSize: 28,
                    textShadow: `0 2px 8px #000`,
                    letterSpacing: 1,
                    lineHeight: 1.1,
                    fontFamily: tempFont,
                  }}>
                    자막 색상
                  </span>
                </div>
              ))}
            </div>
            {/* 자막 색상 직접 선택(RGB) */}
            <div className="flex items-center gap-4 mt-2">
              <div>
                <div className="text-sm font-semibold mb-1">직접 선택</div>
                <input type="color" value={tempColor} onChange={e => setTempColor(e.target.value)} style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }} />
              </div>
              <div className="text-xs text-gray-500">RGB로 자유롭게 선택</div>
            </div>
            {/* 획 설정 UI */}
            <div className="mb-4 mt-6">
              <div className="mb-2 text-lg font-bold text-[#111]">획(테두리) 설정</div>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-sm font-semibold mb-1">획 색상</div>
                  <input type="color" value={tempOutline} onChange={e => setTempOutline(e.target.value)} style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }} />
                </div>
                <div>
                  <div className="text-sm font-semibold mb-1">획 두께</div>
                  <input type="range" min={0} max={8} step={0.5} value={tempOutlineWidth} onChange={e => setTempOutlineWidth(Number(e.target.value))} />
                  <span className="ml-2">{tempOutlineWidth}px</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleSave} className="mt-8 w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition">저장</button>
        </div>
        {/* 오른쪽: 미리보기 */}
        <div style={{ width: 520, minWidth: 520, maxWidth: '100%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 700 }}>
          <PreviewCard
            {...previewProps}
          />
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  title, subtitle, channelName, mainText,
  titleFont, titleFontSize, titleColor, titleOutline, titleOutlineWidth,
  subtitleFont, subtitleFontSize, subtitleColor, subtitleOutline, subtitleOutlineWidth,
  channelFont, channelFontSize, channelColor, channelOutline, channelOutlineWidth,
  scriptFont, scriptFontSize, scriptColor, scriptOutline, scriptOutlineWidth
}: {
  title: string;
  subtitle: string;
  channelName: string;
  mainText: string;
  titleFont: string;
  titleFontSize: number;
  titleColor: string;
  titleOutline: string;
  titleOutlineWidth: number;
  subtitleFont: string;
  subtitleFontSize: number;
  subtitleColor: string;
  subtitleOutline: string;
  subtitleOutlineWidth: number;
  channelFont: string;
  channelFontSize: number;
  channelColor: string;
  channelOutline: string;
  channelOutlineWidth: number;
  scriptFont: string;
  scriptFontSize: number;
  scriptColor: string;
  scriptOutline: string;
  scriptOutlineWidth: number;
}) {
  return (
    <div className="bg-black rounded-xl p-4 w-full" style={{ minHeight: 600, maxWidth: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        fontFamily: channelFont,
        fontSize: channelFontSize,
        color: channelColor,
        fontWeight: 900,
        textAlign: 'right',
        marginBottom: 8,
        textShadow: `0 2px 8px #000`,
        WebkitTextStroke: `${channelOutlineWidth || 0}px ${channelOutline}`,
        width: '100%',
        background: 'transparent',
      }}>{channelName || '채널명 예시'}</div>
      <div style={{
        fontFamily: titleFont,
        fontSize: titleFontSize,
        color: titleColor,
        fontWeight: 900,
        textAlign: 'center',
        marginBottom: 8,
        textShadow: `0 2px 8px #000`,
        WebkitTextStroke: `${titleOutlineWidth || 0}px ${titleOutline}`,
        width: '100%',
        background: 'transparent',
      }}>{title || '오늘의 1분 요약'}</div>
      <div style={{
        fontFamily: subtitleFont,
        fontSize: subtitleFontSize,
        color: subtitleColor,
        fontWeight: 900,
        textAlign: 'center',
        marginBottom: 8,
        textShadow: `0 2px 8px #000`,
        WebkitTextStroke: `${subtitleOutlineWidth || 0}px ${subtitleOutline}`,
        width: '100%',
        background: 'transparent',
      }}>{subtitle || '속보!'}</div>
      <div style={{
        width: '100%',
        height: 180,
        background: '#eee',
        borderRadius: 12,
        margin: '16px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#aaa',
        fontSize: 20,
        fontWeight: 700,
      }}>
        이미지 예시
      </div>
      <div style={{
        fontFamily: scriptFont,
        fontSize: scriptFontSize,
        color: scriptColor,
        fontWeight: 400,
        textAlign: 'center',
        marginTop: 16,
        textShadow: `0 2px 8px #000`,
        WebkitTextStroke: `${scriptOutlineWidth || 0}px ${scriptOutline}`,
        lineHeight: 1.4,
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
        width: '100%',
        background: 'transparent',
      }}>{mainText || '정부 첫 달 이재명 대통령의 취임 후 한 달 경과 소식을 전해드립니다.'}</div>
    </div>
  );
}

export default function Create() {
  const { user } = useAuth()
  const [newsUrl, setNewsUrl] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [channelName, setChannelName] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [voice, setVoice] = useState('21m00Tcm4TlvDq8ikWAM')
  const [titleFont, setTitleFont] = useState('Arial Black')
  const [subtitleFont, setSubtitleFont] = useState('Malgun Gothic')
  const [channelFont, setChannelFont] = useState('Courier New')
  const [scriptFont, setScriptFont] = useState('Malgun Gothic')
  const [titleFontModal, setTitleFontModal] = useState(false);
  const [subtitleFontModal, setSubtitleFontModal] = useState(false);
  const [channelFontModal, setChannelFontModal] = useState(false);
  const [scriptFontModal, setScriptFontModal] = useState(false);
  const [titleColor, setTitleColor] = useState('#fff');
  const [titleOutline, setTitleOutline] = useState('#222');
  const [subtitleColor, setSubtitleColor] = useState('#fff');
  const [subtitleOutline, setSubtitleOutline] = useState('#222');
  const [channelColor, setChannelColor] = useState('#fff');
  const [channelOutline, setChannelOutline] = useState('#222');
  const [scriptColor, setScriptColor] = useState('#fff');
  const [scriptOutline, setScriptOutline] = useState('#222');
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const previewAudio = useRef<HTMLAudioElement | null>(null);
  const [titleOutlineWidth, setTitleOutlineWidth] = useState(2.5);
  const [subtitleOutlineWidth, setSubtitleOutlineWidth] = useState(2.5);
  const [channelOutlineWidth, setChannelOutlineWidth] = useState(2.5);
  const [scriptOutlineWidth, setScriptOutlineWidth] = useState(2.5);
  const [titleFontSize, setTitleFontSize] = useState(44);
  const [subtitleFontSize, setSubtitleFontSize] = useState(28);
  const [channelFontSize, setChannelFontSize] = useState(28);
  const [scriptFontSize, setScriptFontSize] = useState(28);

  const MAX_IMAGES = 6

  const voiceOptions = [
    { id: '21m00Tcm4TlvDq8ikWAM', label: '민주 (여성, 온화한 목소리)', sample: '/voices/minju.mp3' },
    { id: 'pNInz6obpgDQGcFmaJgB', label: '현우 (남성, 또렷한 표준 발음)', sample: '/voices/hyunwoo.mp3' },
    { id: 'AZnzlk1XvdvUeBnXmlld', label: '수진 (여성, 밝고 경쾌함)', sample: '/voices/sujin.mp3' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', label: '지훈 (남성, 차분하고 신뢰감)', sample: '/voices/jihun.mp3' },
    { id: 'MF3mGyEYCl7XYWbV9V6O', label: '예린 (여성, 또렷하고 힘있음)', sample: '/voices/yerin.mp3' },
    { id: 'VR6AewLTigWG4xSOukaG', label: '준호 (남성, 부드럽고 저음)', sample: '/voices/junho.mp3' },
    { id: 'EXAVITQu4vr4xnSDxMaL', label: '소연 (여성, 친근하고 자연스러움)', sample: '/voices/soyeon.mp3' },
  ];

  const fontOptions = [
    { value: 'Arial Black', label: 'Arial Black (굵고 임팩트)', preview: 'Arial Black', recommended: true },
    { value: 'Malgun Gothic', label: '맑은 고딕 (깔끔하고 읽기 쉬움)', preview: '맑은 고딕', recommended: true },
    { value: 'Batang', label: '바탕체 (전통적이고 신뢰감)', preview: '바탕체' },
    { value: 'Gulim', label: '굴림체 (부드럽고 친근함)', preview: '굴림체' },
    { value: 'Dotum', label: '돋움체 (명확하고 현대적)', preview: '돋움체' },
    { value: 'Courier New', label: 'Courier New (타자기 느낌)', preview: 'Courier New', recommended: true },
    { value: 'Times New Roman', label: 'Times New Roman (클래식)', preview: 'Times New Roman' },
    { value: 'Verdana', label: 'Verdana (현대적이고 깔끔)', preview: 'Verdana', recommended: true },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length + images.length > MAX_IMAGES) {
      setError(`최대 ${MAX_IMAGES}개의 이미지만 업로드할 수 있습니다.`)
      return
    }

    const newImages = [...images, ...acceptedFiles.slice(0, MAX_IMAGES - images.length)]
    setImages(newImages)
  }, [images])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: MAX_IMAGES,
    disabled: images.length >= MAX_IMAGES
  })

  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }
    if (!newsUrl || !title) {
      setError('뉴스 URL과 제목을 모두 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)
    setVideoUrl(null)
    setProgress(0)

    // SSE 연결 설정
    const eventSource = new EventSource('https://onminds.ngrok.app/progress');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(data.progress);
      } catch (error) {
        console.error('Progress parsing error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    try {
      const token = await user.getIdToken();

      const formData = new FormData()
      formData.append('newsUrl', newsUrl)
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      formData.append('channelName', channelName)
      formData.append('voice', voice)
      formData.append('titleFont', titleFont)
      formData.append('subtitleFont', subtitleFont)
      formData.append('channelFont', channelFont)
      formData.append('scriptFont', scriptFont)
      formData.append('titleColor', titleColor)
      formData.append('titleOutline', titleOutline)
      formData.append('subtitleColor', subtitleColor)
      formData.append('subtitleOutline', subtitleOutline)
      formData.append('channelColor', channelColor)
      formData.append('channelOutline', channelOutline)
      formData.append('scriptColor', scriptColor)
      formData.append('scriptOutline', scriptOutline)
      
      // 소제목 디버깅 로그 추가
      console.log("=== FRONTEND SUBTITLE DEBUG ===");
      console.log("Subtitle value:", subtitle);
      console.log("Subtitle type:", typeof subtitle);
      console.log("Subtitle length:", subtitle.length);
      console.log("FormData subtitle:", formData.get('subtitle'));
      console.log("Channel name:", channelName);
      console.log("FormData channelName:", formData.get('channelName'));
      console.log("===============================");
      
      // 이미지 파일들 추가
      images.forEach((image) => {
        formData.append('images', image)
      })
      
      const response = await fetch('https://onminds.ngrok.app/generate-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || '영상 제작에 실패했습니다.')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setVideoUrl(url)

      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`
      document.body.appendChild(a)
      a.click()
      a.remove()

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false)
      setProgress(0)
      eventSource.close();
    }
  }

  const handlePreview = async (voiceId: string) => {
    const opt = voiceOptions.find(v => v.id === voiceId);
    if (!opt?.sample) return;
    setPreviewLoading(voiceId);
    try {
      if (previewAudio.current) {
        previewAudio.current.pause();
        previewAudio.current.currentTime = 0;
        previewAudio.current = null;
      }
      previewAudio.current = new Audio(opt.sample);
      previewAudio.current.play();
      previewAudio.current.onended = () => {
        previewAudio.current = null;
        setPreviewLoading(null);
      };
    } catch (e) {
      alert('미리듣기 중 오류가 발생했습니다.');
      setPreviewLoading(null);
    }
  };

  const handleStopPreview = () => {
    if (previewAudio.current) {
      previewAudio.current.pause();
      previewAudio.current.currentTime = 0;
      previewAudio.current = null;
      setPreviewLoading(null);
    }
  };

  // 진행률에 따른 단계 메시지 함수
  const getProgressMessage = (progress: number) => {
    if (progress <= 5) return "기사 내용 추출 중...";
    if (progress <= 15) return "AI 스크립트 생성 중...";
    if (progress <= 25) return "음성 합성 중...";
    if (progress <= 35) return "자막 생성 중...";
    if (progress <= 45) return "이미지 준비 중...";
    if (progress <= 60) return "영상 제작 중...";
    if (progress <= 100) return "완료! 다운로드 중...";
    return "처리 중...";
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black via-red-900 to-blue-900 overflow-hidden">
        {/* 배경 파티클 효과 */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* 메인 로딩 컨테이너 */}
        <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 w-full max-w-md mx-4 overflow-hidden">
          {/* 상단 그라데이션 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
          
          {/* 좌측 상단 장식 */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-full animate-pulse" />
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          
          {/* 우측 상단 장식 */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />

          <div className="relative z-10 flex flex-col items-center">
            {/* 메인 스피너 */}
            <div className="relative mb-8">
              {/* 외부 링 */}
              <div className="w-24 h-24 border-4 border-white/20 rounded-full animate-spin" />
              
              {/* 내부 링 */}
              <div className="absolute inset-2 w-20 h-20 border-4 border-transparent border-t-red-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              
              {/* 중앙 링 */}
              <div className="absolute inset-4 w-16 h-16 border-4 border-transparent border-b-blue-500 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
              
              {/* 중앙 아이콘 */}
              <div className="absolute inset-6 w-12 h-12 bg-gradient-to-br from-red-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-6 h-6 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* 제목 */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black bg-gradient-to-r from-red-400 via-pink-400 to-blue-400 text-transparent bg-clip-text mb-2 animate-pulse">
                AI가 쇼츠 영상을 만드는 중입니다
              </h2>
              <div className="text-sm text-white/60 font-medium">
                {getProgressMessage(progress)}
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="w-full mb-4">
              <div className="relative">
                {/* 배경 바 */}
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  {/* 그라데이션 진행률 바 */}
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 via-pink-500 to-blue-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    {/* 반짝이는 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                </div>
                
                {/* 진행률 퍼센트 */}
                <div className="absolute -top-8 right-0 bg-gradient-to-r from-red-500 to-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                  {progress}%
                </div>
              </div>
            </div>

            {/* 하단 장식 요소들 */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              
              <div className="text-xs text-white/50 font-medium">
                잠시만 기다려주세요...
              </div>
              
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${(i + 3) * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 하단 그라데이션 오버레이 */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/10 to-transparent" />
        </div>

        {/* 추가 배경 효과 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 움직이는 원형 그라데이션 */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex gap-8 items-start">
        <div className="flex-1">
          <div className="text-center mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-red-600 transition-colors duration-200 mb-6 group"
            >
              <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              메인으로 돌아가기
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-red-600 text-transparent bg-clip-text mb-2">
              뉴스 쇼츠 만들기
            </h1>
            <p className="text-gray-600">
              URL을 붙여넣고 AI로 쇼츠를 만들어보세요
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg">
            <div>
              <label className="block text-2xl font-extrabold text-[#111] mb-2">뉴스 URL</label>
              <input
                type="url"
                value={newsUrl}
                onChange={(e) => setNewsUrl(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                placeholder="https://news.example.com/article"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-2xl font-extrabold text-[#111] mb-2">영상 제목</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="쇼츠 영상의 제목을 입력하세요"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setTitleFontModal(true)}
                  className="px-4 py-2 text-base rounded-lg bg-black text-white font-bold whitespace-nowrap shadow hover:bg-gray-900 transition"
                >
                  디자인 선택 &gt;
                </button>
                {titleFontModal && (
                  <FontSettingModal
                    open={titleFontModal}
                    onClose={() => setTitleFontModal(false)}
                    font={titleFont}
                    setFont={setTitleFont}
                    fontOptions={fontOptions}
                    label="제목"
                    color={titleColor}
                    setColor={setTitleColor}
                    outline={titleOutline}
                    setOutline={setTitleOutline}
                    outlineWidth={titleOutlineWidth}
                    setOutlineWidth={setTitleOutlineWidth}
                    fontSize={titleFontSize}
                    setFontSize={setTitleFontSize}
                    title={title}
                    subtitle={subtitle}
                    channelName={channelName}
                    mainText={"정부 첫 달 이재명 대통령의 취임 후 한 달 경과 소식을 전해드립니다."}
                    titleFont={titleFont}
                    titleFontSize={titleFontSize}
                    titleColor={titleColor}
                    titleOutline={titleOutline}
                    titleOutlineWidth={titleOutlineWidth}
                    subtitleFont={subtitleFont}
                    subtitleFontSize={subtitleFontSize}
                    subtitleColor={subtitleColor}
                    subtitleOutline={subtitleOutline}
                    subtitleOutlineWidth={subtitleOutlineWidth}
                    channelFont={channelFont}
                    channelFontSize={channelFontSize}
                    channelColor={channelColor}
                    channelOutline={channelOutline}
                    channelOutlineWidth={channelOutlineWidth}
                    scriptFont={scriptFont}
                    scriptFontSize={scriptFontSize}
                    scriptColor={scriptColor}
                    scriptOutline={scriptOutline}
                    scriptOutlineWidth={scriptOutlineWidth}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-2xl font-extrabold text-[#111] mb-2">소제목 <span className="text-gray-500 text-xs ml-1">(선택사항, 10자 이내 권장)</span></label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="속보! 또는 긴급!"
                  maxLength={15}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setSubtitleFontModal(true)}
                  className="px-4 py-2 text-base rounded-lg bg-black text-white font-bold whitespace-nowrap shadow hover:bg-gray-900 transition"
                >
                  디자인 선택 &gt;
                </button>
                {subtitleFontModal && (
                  <FontSettingModal
                    open={subtitleFontModal}
                    onClose={() => setSubtitleFontModal(false)}
                    font={subtitleFont}
                    setFont={setSubtitleFont}
                    fontOptions={fontOptions}
                    label="소제목"
                    color={subtitleColor}
                    setColor={setSubtitleColor}
                    outline={subtitleOutline}
                    setOutline={setSubtitleOutline}
                    outlineWidth={subtitleOutlineWidth}
                    setOutlineWidth={setSubtitleOutlineWidth}
                    fontSize={subtitleFontSize}
                    setFontSize={setSubtitleFontSize}
                    title={title}
                    subtitle={subtitle}
                    channelName={channelName}
                    mainText={"정부 첫 달 이재명 대통령의 취임 후 한 달 경과 소식을 전해드립니다."}
                    titleFont={titleFont}
                    titleFontSize={titleFontSize}
                    titleColor={titleColor}
                    titleOutline={titleOutline}
                    titleOutlineWidth={titleOutlineWidth}
                    subtitleFont={subtitleFont}
                    subtitleFontSize={subtitleFontSize}
                    subtitleColor={subtitleColor}
                    subtitleOutline={subtitleOutline}
                    subtitleOutlineWidth={subtitleOutlineWidth}
                    channelFont={channelFont}
                    channelFontSize={channelFontSize}
                    channelColor={channelColor}
                    channelOutline={channelOutline}
                    channelOutlineWidth={channelOutlineWidth}
                    scriptFont={scriptFont}
                    scriptFontSize={scriptFontSize}
                    scriptColor={scriptColor}
                    scriptOutline={scriptOutline}
                    scriptOutlineWidth={scriptOutlineWidth}
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-2xl font-extrabold text-[#111] mb-2">채널 이름 <span className="text-gray-500 text-xs ml-1">(선택사항, 10자 이내 권장)</span></label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="채널 이름을 입력하세요"
                  maxLength={10}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setChannelFontModal(true)}
                  className="px-4 py-2 text-base rounded-lg bg-black text-white font-bold whitespace-nowrap shadow hover:bg-gray-900 transition"
                >
                  디자인 선택 &gt;
                </button>
                {channelFontModal && (
                  <FontSettingModal
                    open={channelFontModal}
                    onClose={() => setChannelFontModal(false)}
                    font={channelFont}
                    setFont={setChannelFont}
                    fontOptions={fontOptions}
                    label="채널명"
                    color={channelColor}
                    setColor={setChannelColor}
                    outline={channelOutline}
                    setOutline={setChannelOutline}
                    outlineWidth={channelOutlineWidth}
                    setOutlineWidth={setChannelOutlineWidth}
                    fontSize={channelFontSize}
                    setFontSize={setChannelFontSize}
                    title={title}
                    subtitle={subtitle}
                    channelName={channelName}
                    mainText={"정부 첫 달 이재명 대통령의 취임 후 한 달 경과 소식을 전해드립니다."}
                    titleFont={titleFont}
                    titleFontSize={titleFontSize}
                    titleColor={titleColor}
                    titleOutline={titleOutline}
                    titleOutlineWidth={titleOutlineWidth}
                    subtitleFont={subtitleFont}
                    subtitleFontSize={subtitleFontSize}
                    subtitleColor={subtitleColor}
                    subtitleOutline={subtitleOutline}
                    subtitleOutlineWidth={subtitleOutlineWidth}
                    channelFont={channelFont}
                    channelFontSize={channelFontSize}
                    channelColor={channelColor}
                    channelOutline={channelOutline}
                    channelOutlineWidth={channelOutlineWidth}
                    scriptFont={scriptFont}
                    scriptFontSize={scriptFontSize}
                    scriptColor={scriptColor}
                    scriptOutline={scriptOutline}
                    scriptOutlineWidth={scriptOutlineWidth}
                  />
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-2xl font-extrabold text-[#111]">대본 폰트</label>
                <button
                  type="button"
                  onClick={() => setScriptFontModal(true)}
                  className="px-4 py-2 text-base rounded-lg bg-black text-white font-bold whitespace-nowrap shadow hover:bg-gray-900 transition"
                >
                  디자인 선택 &gt;
                </button>
                {scriptFontModal && (
                  <FontSettingModal
                    open={scriptFontModal}
                    onClose={() => setScriptFontModal(false)}
                    font={scriptFont}
                    setFont={setScriptFont}
                    fontOptions={fontOptions}
                    label="대본"
                    color={scriptColor}
                    setColor={setScriptColor}
                    outline={scriptOutline}
                    setOutline={setScriptOutline}
                    outlineWidth={scriptOutlineWidth}
                    setOutlineWidth={setScriptOutlineWidth}
                    fontSize={scriptFontSize}
                    setFontSize={setScriptFontSize}
                    title={title}
                    subtitle={subtitle}
                    channelName={channelName}
                    mainText={"정부 첫 달 이재명 대통령의 취임 후 한 달 경과 소식을 전해드립니다."}
                    titleFont={titleFont}
                    titleFontSize={titleFontSize}
                    titleColor={titleColor}
                    titleOutline={titleOutline}
                    titleOutlineWidth={titleOutlineWidth}
                    subtitleFont={subtitleFont}
                    subtitleFontSize={subtitleFontSize}
                    subtitleColor={subtitleColor}
                    subtitleOutline={subtitleOutline}
                    subtitleOutlineWidth={subtitleOutlineWidth}
                    channelFont={channelFont}
                    channelFontSize={channelFontSize}
                    channelColor={channelColor}
                    channelOutline={channelOutline}
                    channelOutlineWidth={channelOutlineWidth}
                    scriptFont={scriptFont}
                    scriptFontSize={scriptFontSize}
                    scriptColor={scriptColor}
                    scriptOutline={scriptOutline}
                    scriptOutlineWidth={scriptOutlineWidth}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                본문 자막에 사용될 폰트를 선택하세요
              </p>
            </div>

            <div>
              <label className="block text-2xl font-extrabold text-[#111] mb-2">목소리 선택</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {voiceOptions.map(opt => {
                  const isPlaying = previewLoading === opt.id;
                  return (
                    <div key={opt.id} className={`rounded-2xl border shadow-md p-4 flex items-center gap-4 transition-all duration-200
                      ${voice === opt.id ? 'border-pink-500 ring-2 ring-pink-200 bg-gradient-to-r from-pink-50 to-white scale-[1.03]' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="flex-1">
                        <div className="font-bold text-base mb-1 text-gray-800 flex items-center gap-2">
                          <span className={voice === opt.id ? 'text-pink-600' : 'text-gray-700'}>{opt.label.split(' ')[0]}</span>
                          <span className="text-xs text-gray-400 font-normal">{opt.label.replace(/^[^ ]+ /, '')}</span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button
                            type="button"
                            className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full font-semibold shadow transition-all duration-200
                              ${isPlaying ? 'bg-pink-500 text-white animate-pulse' : 'bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-600'}
                              ${voice === opt.id ? 'border border-pink-400' : 'border border-gray-300'}
                              disabled:opacity-50`}
                            onClick={() => handlePreview(opt.id)}
                            disabled={isLoading || isPlaying}
                            style={{ minWidth: 90 }}
                          >
                            {isPlaying ? (
                              <Loader2 className="animate-spin w-4 h-4 mr-1" />
                            ) : (
                              <Volume2 className="w-4 h-4 mr-1" />
                            )}
                            <span>미리듣기</span>
                          </button>
                          <button
                            type="button"
                            className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-semibold shadow transition-all duration-200
                              ${isPlaying ? 'bg-gray-200 text-red-500 border-red-300' : 'bg-gray-100 text-gray-400 border-gray-200'}
                              hover:bg-red-100 hover:text-red-600`}
                            onClick={handleStopPreview}
                            disabled={!isPlaying}
                            aria-label="미리듣기 중지"
                          >
                            <span>중지</span>
                          </button>
                          <button
                            type="button"
                            className={`ml-2 px-2 py-1 rounded-lg text-xs font-semibold border transition-all duration-200
                              ${voice === opt.id ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-pink-500 border-pink-200 hover:bg-pink-50'}`}
                            onClick={() => setVoice(opt.id)}
                            disabled={isLoading}
                          >
                            선택
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-1">한국어에 최적화된 다양한 목소리를 선택할 수 있습니다.</p>
            </div>

            <div className="mt-10">
              <label className="block text-2xl font-extrabold text-[#111] mb-2">
                이미지 업로드 (선택사항, 최대 {MAX_IMAGES}개)
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  isDragActive
                    ? 'border-red-500 bg-red-50'
                    : images.length >= MAX_IMAGES
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                {images.length >= MAX_IMAGES ? (
                  <p className="text-gray-500">최대 {MAX_IMAGES}개 이미지 업로드 완료</p>
                ) : isDragActive ? (
                  <p className="text-red-600">이미지를 여기에 드롭하세요</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      이미지를 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF 파일 지원 (최대 {MAX_IMAGES}개)
                    </p>
                  </div>
                )}
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={URL.createObjectURL(image)}
                        alt={`업로드된 이미지 ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 px-4 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>{progress || '제작 중...'}</span>
                  </>
                ) : (
                  '쇼츠 영상 만들기'
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 text-center p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl">
                <p>{error}</p>
              </div>
            )}

            {videoUrl && (
              <div className="mt-6 text-center p-4 bg-green-50 border border-green-200 rounded-xl">
                <h3 className="text-lg font-semibold text-green-800 mb-2">영상 제작 완료!</h3>
                <p className="text-green-700 mb-4">영상이 자동으로 다운로드됩니다.</p>
                <a
                  href={videoUrl}
                  download={`${title.replace(/[^a-z0-9]/gi, '_')}.mp4`}
                  className="inline-block bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  다시 다운로드
                </a>
              </div>
            )}
          </form>
        </div>
        {(titleFontModal || subtitleFontModal || channelFontModal || scriptFontModal) && (
          <div className="w-[400px] sticky top-8">
            <PreviewCard
              title={title}
              subtitle={subtitle}
              channelName={channelName}
              mainText={title}
              titleFont={titleFont}
              titleFontSize={titleFontSize}
              titleColor={titleColor}
              titleOutline={titleOutline}
              titleOutlineWidth={titleOutlineWidth}
              subtitleFont={subtitleFont}
              subtitleFontSize={subtitleFontSize}
              subtitleColor={subtitleColor}
              subtitleOutline={subtitleOutline}
              subtitleOutlineWidth={subtitleOutlineWidth}
              channelFont={channelFont}
              channelFontSize={channelFontSize}
              channelColor={channelColor}
              channelOutline={channelOutline}
              channelOutlineWidth={channelOutlineWidth}
              scriptFont={scriptFont}
              scriptFontSize={scriptFontSize}
              scriptColor={scriptColor}
              scriptOutline={scriptOutline}
              scriptOutlineWidth={scriptOutlineWidth}
            />
          </div>
        )}
      </div>
    </main>
  )
}