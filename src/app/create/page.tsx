"use client"

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'
import { ArrowLeft, Upload, X } from 'lucide-react'

export default function Create() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length + images.length > 6) {
      setError('최대 6개의 이미지만 업로드할 수 있습니다.')
      return
    }

    const newImages = [...images, ...acceptedFiles]
    setImages(newImages)

    const newPreviewUrls = acceptedFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls([...previewUrls, ...newPreviewUrls])
  }, [images, previewUrls])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 6,
    disabled: images.length >= 6
  })

  const removeImage = (index: number) => {
    setImages(prevImages => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);
      return newImages;
    });
    setPreviewUrls(prevUrls => {
      const newPreviewUrls = [...prevUrls];
      if (newPreviewUrls[index]) {
        try {
          URL.revokeObjectURL(newPreviewUrls[index]);
        } catch {
          // 이미 해제된 경우 무시
        }
      }
      newPreviewUrls.splice(index, 1);
      return newPreviewUrls;
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setVideoUrl('')

    try {
      const formData = new FormData()
      formData.append('url', url)
      formData.append('title', title)
      images.forEach(image => formData.append('images', image))

      const response = await fetch('https://07f4-210-99-244-43.ngrok-free.app/generate-video', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.text().catch(() => '')
        throw new Error(data ? String(data) : '영상 생성에 실패했습니다.')
      }

      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);
      setVideoUrl(videoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '영상 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              메인으로 돌아가기
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">쇼츠 만들기</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">뉴스 URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="https://news.example.com/article"
                required
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="영상 제목을 입력하세요"
                required
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 업로드 (최대 6개)
              </label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-500 hover:bg-red-50'}
                  ${images.length >= 6 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="space-y-2">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-sm text-gray-500">
                    {isDragActive ? (
                      <p>이미지를 여기에 놓으세요</p>
                    ) : (
                      <p>
                        이미지를 드래그하거나 클릭하여 업로드하세요
                        <br />
                        <span className="text-xs">(JPG, PNG, GIF 파일 지원)</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {images.length}/6 이미지 업로드됨
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !url || !title}
              className="w-full bg-red-600 text-white p-4 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  처리 중...
                </div>
              ) : (
                '영상 생성하기'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          {videoUrl && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-green-600">영상이 생성되었습니다!</h2>
                  <p className="text-gray-600 mt-1">아래 버튼을 클릭하여 영상을 다운로드하세요.</p>
                </div>
                <button
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = videoUrl
                    a.download = `${title || 'shorts'}.mp4`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  영상 다운로드
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 