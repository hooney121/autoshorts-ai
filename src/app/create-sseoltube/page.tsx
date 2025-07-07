'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleHeart, Upload, Sparkles, Play, Download, CheckCircle, Clock, Image as ImageIcon, FileText, Mic, Video } from 'lucide-react';

export default function CreateStoryPage() {
  const [title, setTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const steps = [
    { icon: FileText, label: '스크립트 생성' },
    { icon: Mic, label: '음성 합성' },
    { icon: ImageIcon, label: '이미지 처리' },
    { icon: Video, label: '비디오 합성' },
    { icon: Download, label: '다운로드' }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...fileArray].slice(0, 6));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !storyContent) {
      alert('제목과 이야기 내용을 모두 입력해주세요.');
      return;
    }
    if (images.length === 0) {
      alert('이미지를 1장 이상 업로드해주세요.');
      return;
    }
    
    setIsLoading(true);
    setProgress('썰튜브 영상 생성 중...');
    
    try {
      const formData = new FormData();
      formData.append('storyContent', storyContent);
      formData.append('title', title);
      formData.append('channelName', channelName);
      formData.append('voice', '21m00Tcm4TlvDq8ikWAM'); // 기본 음성
      
      // 이미지 파일들 추가
      images.forEach((image) => {
        formData.append('images', image);
      });
      
      const response = await fetch('https://bc2a6408c776.ngrok.app/generate-story-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '썰튜브 영상 생성에 실패했습니다.');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // 자동 다운로드
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setProgress('완료!');
      alert('썰튜브 영상이 성공적으로 생성되었습니다!');
      
    } catch (error) {
      console.error('Error:', error);
      alert('썰튜브 영상 생성 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setIsLoading(false);
      setProgress('');
      setCurrentStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#ffe4e6] py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center mb-12">
          <div className="inline-flex items-center bg-gradient-to-r from-green-500 to-teal-400 text-white px-7 py-3 rounded-2xl text-xl font-bold mb-6 shadow-xl backdrop-blur-md border border-white/30">
            <MessageCircleHeart className="h-7 w-7 mr-3" />
            썰튜브 쇼츠 제작
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 bg-gradient-to-r from-green-500 to-teal-400 bg-clip-text text-transparent drop-shadow-lg">
            당신의 이야기를 쇼츠로!
          </h1>
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl md:text-3xl font-extrabold rainbow-text px-2 text-center leading-tight" style={{background: 'linear-gradient(90deg, #ff0080, #7928ca, #007cf0, #00dfd8, #ff0080)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>
              AI가 당신의 이야기를<br />60초 쇼츠로<br />생성시켜 드립니다!
            </span>
          </div>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-10">
          {/* 메인 폼 */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="md:col-span-2">
            <div className="bg-white/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-10">
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* 제목 입력 */}
                <div className="space-y-2">
                  <label className="block text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" /> 제목 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-7 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-400/30 focus:border-green-400 text-lg transition-all duration-200 bg-white/80 shadow-inner" placeholder="예: 충격적인 학교 뒷이야기" required />
                </div>
                {/* 채널명 입력 */}
                <div className="space-y-2">
                  <label className="block text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-400" /> 채널명 (선택)
                  </label>
                  <input type="text" value={channelName} onChange={(e) => setChannelName(e.target.value)} className="w-full px-7 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-400/30 focus:border-teal-400 text-lg transition-all duration-200 bg-white/80 shadow-inner" placeholder="예: 믿을 수 없는 결말" />
                </div>
                {/* 이야기 내용 입력 */}
                <div className="space-y-2">
                  <label className="block text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <MessageCircleHeart className="h-5 w-5 text-pink-400" /> 이야기 내용 <span className="text-red-500">*</span>
                  </label>
                  <textarea value={storyContent} onChange={(e) => setStoryContent(e.target.value)} rows={8} className="w-full px-7 py-5 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-400/30 focus:border-pink-400 text-lg resize-none transition-all duration-200 bg-white/80 shadow-inner" placeholder="재미있고 흥미로운 이야기를 자세히 작성해주세요. AI가 이를 바탕으로 쇼츠용 스크립트를 생성합니다." required />
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <FileText className="h-4 w-4 mr-2" /> {storyContent.length}자 작성됨
                  </div>
                </div>
                {/* 이미지 업로드 */}
                <div className="space-y-2">
                  <label className="block text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-blue-400" /> 이미지 업로드 (최대 6장)
                  </label>
                  <div className="border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors duration-200 bg-white/70">
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                    <label htmlFor="image-upload" className="cursor-pointer inline-flex flex-col items-center">
                      <div className="bg-gradient-to-r from-blue-400 to-teal-400 p-4 rounded-full mb-3 shadow-lg">
                        <Upload className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-lg font-semibold text-gray-700 mb-1">이미지 선택</span>
                      <span className="text-gray-500">클릭하여 이미지를 업로드하세요</span>
                    </label>
                  </div>
                  {images.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {images.map((image, index) => (
                        <motion.div key={index} className="relative group" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: index * 0.1 }}>
                          <img src={URL.createObjectURL(image)} alt={`Uploaded ${index + 1}`} className="w-full h-32 object-cover rounded-xl shadow-xl border-2 border-white/70" />
                          <button type="button" onClick={() => removeImage(index)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg">×</button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </div>
                {/* 제출 버튼 */}
                <motion.button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-green-500 to-teal-400 text-white py-5 px-8 rounded-2xl font-bold text-2xl hover:from-green-600 hover:to-teal-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.03] flex items-center justify-center gap-3" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  {isLoading ? (<><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white mr-3"></div>쇼츠 생성 중...</>) : (<><Sparkles className="mr-3 h-7 w-7" />쇼츠 생성하기</>)}
                </motion.button>
              </form>
            </div>
          </motion.div>
          {/* 사이드바 */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="space-y-8 flex flex-col justify-between">
            {/* 진행 상황 Progress Bar */}
            {isLoading && (
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-7">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-green-500" />진행 상황</h3>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${((currentStep+1)/steps.length)*100}%` }} transition={{ duration: 0.7 }} className="bg-gradient-to-r from-green-400 to-teal-400 h-4 rounded-full shadow-inner" />
                </div>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-lg shadow-lg ${index < currentStep ? 'bg-gradient-to-r from-green-400 to-teal-400' : index === currentStep ? 'bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse' : 'bg-gray-300 text-gray-400'}`}>{index < currentStep ? <CheckCircle className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}</div>
                      <span className={`text-base font-semibold ${index <= currentStep ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  ))}
                </div>
                {progress && (<div className="mt-5 p-3 bg-blue-50 rounded-lg text-blue-800 text-center text-sm font-medium shadow-inner">{progress}</div>)}
              </div>
            )}
            {/* 사용법 안내 */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-7">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MessageCircleHeart className="h-5 w-5 text-green-500" />사용법</h3>
              <ul className="space-y-3 text-gray-700 text-base">
                <li className="flex items-start gap-2"><span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>재미있고 흥미로운 이야기를 자세히 작성해주세요</li>
                <li className="flex items-start gap-2"><span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>AI가 자동으로 쇼츠용 스크립트와 음성을 생성합니다</li>
                <li className="flex items-start gap-2"><span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>이미지를 업로드하면 더 관련성 높은 비디오가 만들어집니다</li>
                <li className="flex items-start gap-2"><span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>생성된 비디오는 자동으로 다운로드됩니다</li>
              </ul>
            </div>
            {/* 특징 */}
            <div className="bg-gradient-to-br from-green-400 to-teal-500 rounded-2xl shadow-xl p-7 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 mr-1" />썰튜브 쇼츠 특징</h3>
              <ul className="space-y-2 text-base">
                <li>• 60초 최적화된 쇼츠</li>
                <li>• AI 음성 합성</li>
                <li>• 자동 자막 생성</li>
                <li>• 고품질 이미지 처리</li>
                <li>• 모바일 최적화</li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* How it works 섹션 */}
        <section className="my-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">AI 쇼츠 제작 과정</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="bg-white/70 rounded-2xl shadow-xl p-6 flex flex-col items-center w-64">
              <FileText className="h-10 w-10 text-green-500 mb-2" />
              <span className="font-bold mb-1">1. 썰 입력</span>
              <span className="text-gray-600 text-sm text-center">재미있는 이야기를 입력하세요.</span>
            </div>
            <div className="bg-white/70 rounded-2xl shadow-xl p-6 flex flex-col items-center w-64">
              <Sparkles className="h-10 w-10 text-purple-500 mb-2" />
              <span className="font-bold mb-1">2. AI 자동 생성</span>
              <span className="text-gray-600 text-sm text-center">AI가 대본, 음성, 이미지를 만듭니다.</span>
            </div>
            <div className="bg-white/70 rounded-2xl shadow-xl p-6 flex flex-col items-center w-64">
              <Play className="h-10 w-10 text-blue-500 mb-2" />
              <span className="font-bold mb-1">3. 영상 합성</span>
              <span className="text-gray-600 text-sm text-center">모든 요소를 합쳐 쇼츠 완성!</span>
            </div>
            <div className="bg-white/70 rounded-2xl shadow-xl p-6 flex flex-col items-center w-64">
              <Download className="h-10 w-10 text-teal-500 mb-2" />
              <span className="font-bold mb-1">4. 다운로드</span>
              <span className="text-gray-600 text-sm text-center">완성된 영상을 저장하세요.</span>
            </div>
          </div>
        </section>

        {/* 샘플 썰/영상 섹션 */}
        <section className="my-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">쇼츠 예시</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="bg-white/80 rounded-2xl shadow-xl p-6 w-80">
              <h3 className="font-bold text-lg mb-2 text-green-600">예시 썰</h3>
              <p className="text-gray-700 mb-4">“학교에서 있었던 충격적인 사건! AI가 영상으로 만들어줬어요.”</p>
              <iframe
                src="https://www.youtube.com/embed/1kwe7QWzyfw"
                title="쇼츠 예시 영상"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video rounded-xl shadow-lg"
              ></iframe>
            </div>
          </div>
        </section>

        {/* FAQ 섹션 */}
        <section className="my-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">자주 묻는 질문</h2>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white/80 rounded-xl shadow p-5">
              <h4 className="font-bold text-green-600 mb-2">Q. 영상 길이는?</h4>
              <p className="text-gray-700">AI가 자동으로 60초 내외의 쇼츠로 만들어줍니다.</p>
            </div>
            <div className="bg-white/80 rounded-xl shadow p-5">
              <h4 className="font-bold text-green-600 mb-2">Q. 저작권 문제는?</h4>
              <p className="text-gray-700">AI가 생성한 이미지/음성/영상은 저작권 걱정 없이 사용 가능합니다.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 