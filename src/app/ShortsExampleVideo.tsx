import { useState } from "react";

export function ShortsExampleVideo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex justify-center mt-12">
      <div
        className={`
          relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden
          border border-slate-200
          transition-all duration-500
          ${playing ? "shadow-2xl scale-105" : "shadow-lg hover:shadow-2xl hover:scale-105"}
          group
        `}
        style={{ cursor: playing ? "auto" : "pointer" }}
        onClick={() => !playing && setPlaying(true)}
      >
        {/* 오버레이 UI */}
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 z-10 pointer-events-none">
            <span className="bg-white/80 text-red-600 font-bold px-4 py-2 rounded-full text-lg shadow-md mb-4">
              쇼츠 자동생성 예시
            </span>
            <span className="text-white text-xl font-semibold drop-shadow-lg">클릭해서 영상 보기</span>
          </div>
        )}
        {/* 썸네일 or 영상 */}
        {!playing ? (
          <img
            src="https://img.youtube.com/vi/1kwe7QWzyfw/hqdefault.jpg"
            alt="쇼츠 예시 썸네일"
            className="w-full h-full object-cover transition-all duration-500 group-hover:blur-[2px]"
            draggable={false}
          />
        ) : (
          <iframe
            src="https://www.youtube.com/embed/1kwe7QWzyfw?autoplay=1"
            title="쇼츠 생성 예시 영상"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          ></iframe>
        )}
      </div>
    </div>
  );
} 