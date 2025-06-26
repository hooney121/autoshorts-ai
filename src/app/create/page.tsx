"use client"

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Volume2, Loader2, Square } from 'lucide-react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'

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
  const [progress, setProgress] = useState<string>('')
  const [voice, setVoice] = useState('21m00Tcm4TlvDq8ikWAM')

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
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const previewAudio = useRef<HTMLAudioElement | null>(null);

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
    setProgress('사용자 인증 및 사용량 확인 중...')

    try {
      const token = await user.getIdToken();

      const formData = new FormData()
      formData.append('newsUrl', newsUrl)
      formData.append('title', title)
      formData.append('subtitle', subtitle)
      formData.append('channelName', channelName)
      formData.append('voice', voice)
      
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

      setProgress('데이터 업로드 및 처리 시작 중...')
      
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

      setProgress('영상 생성 완료! 다운로드 중...')
      
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
      setProgress('')
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

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">뉴스 URL</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">영상 제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              placeholder="쇼츠 영상의 제목을 입력하세요"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              소제목 
              <span className="text-gray-500 text-xs ml-1">(선택사항, 10자 이내 권장)</span>
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              placeholder="속보! 또는 긴급!"
              maxLength={15}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              소제목을 입력하지 않으면 AI가 자동으로 생성합니다
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              채널 이름 
              <span className="text-gray-500 text-xs ml-1">(선택사항, 10자 이내 권장)</span>
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              placeholder="채널 이름을 입력하세요"
              maxLength={10}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              채널 이름을 입력하지 않으면 AI가 자동으로 생성합니다
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">목소리 선택</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
    </main>
  )
}