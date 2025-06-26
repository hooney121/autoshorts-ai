import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import FormData from 'form-data'
import fetch from 'node-fetch'

// 환경 변수 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 기사 본문 추출 및 길이 제한
async function extractArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`뉴스 기사를 가져오는데 실패했습니다. (상태 코드: ${response.status}) URL을 확인해주세요.`);
    }

    const html = await response.text()
    let content = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (content.length < 100) {
      throw new Error('본문을 추출할 수 없습니다.')
    }

    // 내용이 2000자를 초과하는 경우 요약
    if (content.length > 2000) {
      // 내용을 2000자 단위로 나누기
      const chunks = []
      for (let i = 0; i < content.length; i += 2000) {
        chunks.push(content.slice(i, i + 2000))
      }

      // 각 청크를 개별적으로 요약
      const summarizedChunks = await Promise.all(
        chunks.map(async (chunk) => {
          const summaryResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: '다음 기사 내용을 1000자 이내로 요약해주세요. 핵심 내용을 유지하면서 간단명료하게 작성해주세요.'
              },
              {
                role: 'user',
                content: chunk
              }
            ]
          })
          return summaryResponse.choices[0].message?.content || chunk.slice(0, 1000)
        })
      )

      // 요약된 청크들을 하나로 합치기
      content = summarizedChunks.join('\n')

      // 최종 요약이 여전히 2000자를 초과하는 경우 한 번 더 요약
      if (content.length > 2000) {
        const finalSummaryResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '다음 기사 내용을 2000자 이내로 요약해주세요. 핵심 내용을 유지하면서 간단명료하게 작성해주세요.'
            },
            {
              role: 'user',
              content: content
            }
          ]
        })
        content = finalSummaryResponse.choices[0].message?.content || content.slice(0, 2000)
      }
    }

    return content
  } catch (error) {
    console.error('Error extracting article:', error)
    throw new Error('기사 본문을 추출할 수 없습니다.')
  }
}

// ElevenLabs API를 사용하여 음성 생성
async function generateSpeech(text: string): Promise<{ audioBuffer: Buffer }> {
  const response = await fetch(
    'https://api.elevenlabs.io/v1/text-to-speech/4JJwo477JUAx3HV0T7n7',
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    }
  )
  if (!response.ok) {
    throw new Error('음성 생성에 실패했습니다.')
  }
  const arrayBuffer = await response.arrayBuffer()
  return { audioBuffer: Buffer.from(arrayBuffer) }
}

// Whisper API를 사용하여 자막 생성
async function generateSubtitles(audioBuffer: Buffer): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', audioBuffer, { filename: 'audio.mp3', contentType: 'audio/mpeg' })
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'srt')
    formData.append('language', 'ko')
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    })
    if (!response.ok) {
      throw new Error('자막 생성에 실패했습니다.')
    }
    return await response.text()
  } catch (error) {
    console.error('Error generating subtitles:', error)
    throw new Error('자막 생성에 실패했습니다.')
  }
}

// 스크립트에서 키워드 추출 (스크립트에서 가장 많이 나온 단어를 키워드로 사용)
function extractKeyword(script: string): string {
  const words = script.match(/\b[a-zA-Z가-힣]{3,}\b/g) || [];
  const freq: Record<string, number> = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted.length ? sorted[0][0] : 'news';
}

// Unsplash 이미지 검색 및 다운로드 (여러 이미지)
async function fetchUnsplashImages(keyword: string, accessKey: string, count: number = 6): Promise<Buffer[]> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${count}&orientation=portrait&w=1080&h=1920&client_id=${accessKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error('이미지 검색 실패');
  
  const imageBuffers: Buffer[] = [];
  for (let idx = 0; idx < data.results.length; idx++) {
    const imgRes = await fetch(data.results[idx].urls.full);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    imageBuffers.push(imgBuffer);
  }
  return imageBuffers;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const newsUrl = formData.get('newsUrl') as string;
    const title = formData.get('title') as string;
    const userImages = formData.getAll('images') as File[];

    if (!newsUrl || !title) {
      return NextResponse.json({ error: '뉴스 URL과 제목을 모두 입력해주세요.' }, { status: 400 });
    }

    // 1. 기사 본문 추출
    const articleContent = await extractArticleContent(newsUrl)
    if (!articleContent) {
      throw new Error('기사 본문을 추출할 수 없습니다.')
    }

    // 2. GPT로 60초 스크립트 생성
    const scriptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '아래 뉴스 기사를 유튜브 쇼츠용 60초 스크립트로 한국어로 요약해줘. 캐주얼하고 명확한 말투로 작성해줘. 총 8~10문장, 각 문장은 5초 이내로 말할 수 있게 짧고 임팩트 있게 작성해. 문장마다 줄바꿈(엔터)으로 구분해줘. 번호나 순서를 표시하지 말고, 순수 텍스트만 작성해줘. 실제 뉴스 대본처럼 자연스럽게 이어지게 해줘.'
        },
        {
          role: 'user',
          content: articleContent
        }
      ]
    })
    const script = scriptResponse.choices[0].message?.content
    if (!script) {
      throw new Error('스크립트를 생성할 수 없습니다.')
    }

    // 3. ElevenLabs로 음성 생성
    const { audioBuffer } = await generateSpeech(script)

    // 4. Whisper로 자막 생성
    const subtitles = await generateSubtitles(audioBuffer)

    // 5. 이미지 처리 (사용자 이미지 우선 사용, 부족하면 자동 생성)
    const userImageBuffers: Buffer[] = [];
    for (const image of userImages) {
        const buffer = Buffer.from(await image.arrayBuffer());
        userImageBuffers.push(buffer);
    }
    
    let finalImages: Buffer[] = userImageBuffers;
    const requiredImageCount = 6;
    if (userImageBuffers.length < requiredImageCount) {
        const keyword = extractKeyword(script);
        const remainingCount = requiredImageCount - userImageBuffers.length;
        try {
            const unsplashImages = await fetchUnsplashImages(keyword, process.env.UNSPLASH_ACCESS_KEY || '', remainingCount);
            finalImages = [...userImageBuffers, ...unsplashImages];
        } catch (imageError) {
            console.warn('Unsplash 이미지 생성 실패, 사용자 이미지만 사용:', imageError);
            if (finalImages.length === 0) {
              throw new Error('사용자 이미지가 없고, 자동 이미지 생성에도 실패했습니다.');
            }
        }
    }

    // 6. 비디오 생성 서버로 데이터 전송
    const videoFormData = new FormData()
    videoFormData.append('newsUrl', newsUrl)
    videoFormData.append('title', title)
    videoFormData.append('audio', audioBuffer, 'audio.mp3')
    videoFormData.append('subtitles', subtitles, 'subtitles.srt')
    finalImages.forEach((img, i) => {
      videoFormData.append(`image_${i}`, img, `image_${i}.jpg`)
    })

    const videoServerUrl = 'https://onminds.ngrok.app/generate-video'
    const videoResponse = await fetch(videoServerUrl, {
      method: 'POST',
      body: videoFormData,
      headers: videoFormData.getHeaders(),
    })

    if (!videoResponse.ok) {
      const errorBody = await videoResponse.text()
      console.error('비디오 서버 에러:', errorBody)
      throw new Error(`비디오 생성에 실패했습니다: ${videoResponse.statusText}`)
    }
    
    const videoArrayBuffer = await videoResponse.arrayBuffer();

    return new NextResponse(videoArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.mp4"`,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/create:', error)
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
} 