import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// 환경 변수 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// 기사 본문 추출 및 길이 제한
async function extractArticleContent(url: string): Promise<string> {
  try {
    const response = await fetch(url)
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
            model: 'gpt-4',
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
          model: 'gpt-4',
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
    formData.append('file', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'audio.mp3')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'srt')
    formData.append('language', 'ko')
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
async function fetchUnsplashImages(keyword: string, accessKey: string, count: number = 6): Promise<string[]> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${count}&orientation=portrait&w=1080&h=1920&client_id=${accessKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new Error('이미지 검색 실패');
  
  const imagePaths: string[] = [];
  for (let idx = 0; idx < data.results.length; idx++) {
    const imgRes = await fetch(data.results[idx].urls.full);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const imgPath = path.join(process.cwd(), 'temp', `${uuidv4()}_bg_${idx}.jpg`);
    fs.writeFileSync(imgPath, imgBuffer);
    imagePaths.push(imgPath);
  }
  return imagePaths;
}

// fluent-ffmpeg를 사용하여 영상 생성
async function generateVideo(
  audioBuffer: Buffer, 
  subtitles: string, 
  script: string, 
  titleSubtitles: string,
  imagePaths: string[]
): Promise<Buffer> {
  const tempDir = path.join(process.cwd(), 'temp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
  const id = uuidv4()
  const audioPath = path.join(tempDir, `${id}_audio.mp3`)
  const subsPath = path.join(tempDir, `${id}_subs.srt`)
  const titleSubsPath = path.join(tempDir, `${id}_title_subs.srt`)
  const outPath = path.join(tempDir, `${id}_output.mp4`)
  
  fs.writeFileSync(audioPath, audioBuffer)
  fs.writeFileSync(subsPath, subtitles, { encoding: 'utf8' })
  fs.writeFileSync(titleSubsPath, titleSubtitles, { encoding: 'utf8' })
  
  const relativeSubsPath = path.relative(process.cwd(), subsPath).replace(/\\/g, '/')
  const relativeTitleSubsPath = path.relative(process.cwd(), titleSubsPath).replace(/\\/g, '/')

  // 이미지 파일 경로를 FFmpeg 입력으로 변환
  const imageInputs = imagePaths.map((path) => ({
    path,
    duration: 10 // 각 이미지 10초
  }))

  // FFmpeg 필터 생성 (슬라이드+배경 구조)
  const filter = [
    // 각 슬라이드별 배경 생성
    ...imageInputs.map((_, i) => `color=black:s=1080x1920[topbg${i}]`),
    ...imageInputs.map((_, i) => `color=black:s=1080x640[botbg${i}]`),
    // 각 이미지 처리 및 합성
    ...imageInputs.map((_, i) => `[${i}:v]scale=1080:640[midimg${i}]`),
    ...imageInputs.map((_, i) => `[topbg${i}][midimg${i}]overlay=0:640:shortest=1[redimg${i}]`),
    ...imageInputs.map((_, i) => `[redimg${i}][botbg${i}]overlay=0:1280:shortest=1,scale=1080:1920,setsar=1[finalbg${i}]`),
    // 슬라이드 연결
    imageInputs.map((_, i) => `[finalbg${i}]`).join('') + `concat=n=${imageInputs.length}:v=1:a=0[bgv]`,
    // 자막 추가
    `[bgv]subtitles='${relativeTitleSubsPath}':charenc=UTF-8:force_style='FontName=Noto Sans,FontSize=15,PrimaryColour=&H0000FF&,OutlineColour=&H000000&,Outline=2,Shadow=1,Alignment=2,MarginV=200' [withtitle]`,
    `[withtitle]subtitles='${relativeSubsPath}':charenc=UTF-8:force_style='FontName=Noto Sans,FontSize=10,PrimaryColour=&H00FFFFFF&,OutlineColour=&H000000&,Outline=2,Shadow=1,Alignment=2,MarginV=40' [v]`
  ].join(';')

  // FFmpeg 명령어 생성
  const ffmpegCommand = ffmpeg()
  
  // 이미지 입력 추가
  imageInputs.forEach((input, i) => {
    ffmpegCommand.input(input.path)
      .inputOptions(['-loop 1', `-t ${input.duration}`])
  })
  
  // 오디오 입력 추가
  ffmpegCommand.input(audioPath)

  await new Promise((resolve, reject) => {
    ffmpegCommand
      .complexFilter(filter)
      .outputOptions([
        '-map [v]',
        '-map 6:a',
        '-c:v libx264',
        '-tune stillimage',
        '-c:a aac',
        '-b:a 192k',
        '-pix_fmt yuv420p',
        '-shortest'
      ])
      .output(outPath)
      .on('stderr', (line) => { console.log('ffmpeg:', line) })
      .on('end', resolve)
      .on('error', reject)
      .run()
  })

  const videoBuffer = fs.readFileSync(outPath)
  
  // 임시 파일 정리
  fs.unlinkSync(audioPath)
  fs.unlinkSync(subsPath)
  fs.unlinkSync(titleSubsPath)
  fs.unlinkSync(outPath)
  
  return videoBuffer
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const url = formData.get('url') as string
    const title = formData.get('title') as string
    const userImages = formData.getAll('images') as File[]

    if (!title) {
      throw new Error('제목을 입력해주세요.')
    }

    // 1. 기사 본문 추출 (3000자 제한)
    const articleContent = await extractArticleContent(url)
    if (!articleContent) {
      throw new Error('기사 본문을 추출할 수 없습니다.')
    }

    // 2. GPT로 60초 스크립트 생성
    const scriptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
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
      throw new Error('스크립트 생성에 실패했습니다.')
    }

    // 3. ElevenLabs로 본문 음성 생성
    const { audioBuffer } = await generateSpeech(script)
    // 4. Whisper API로 본문 자막 생성
    const subtitles = await generateSubtitles(audioBuffer)

    // 제목 자막 생성 (전체 시간 동안 표시)
    const titleSubtitleContent = `1
00:00:00,000 --> 00:59:59,999
${title}`

    // 사용자 이미지 처리
    const tempDir = path.join(process.cwd(), 'temp')
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
    
    const userImagePaths: string[] = []
    for (const image of userImages) {
      const buffer = Buffer.from(await image.arrayBuffer())
      const imagePath = path.join(tempDir, `${uuidv4()}_user_bg.jpg`)
      fs.writeFileSync(imagePath, buffer)
      userImagePaths.push(imagePath)
    }

    // 부족한 이미지는 Unsplash에서 가져오기
    const keyword = extractKeyword(script)
    const remainingCount = Math.max(0, 6 - userImagePaths.length)
    const unsplashImages = remainingCount > 0 
      ? await fetchUnsplashImages(keyword, process.env.UNSPLASH_ACCESS_KEY!, remainingCount)
      : []

    // 모든 이미지 경로 합치기
    const allImagePaths = [...userImagePaths, ...unsplashImages]

    // 5. FFmpeg로 영상 생성
    const videoBuffer = await generateVideo(audioBuffer, subtitles, script, titleSubtitleContent, allImagePaths)

    // 임시 파일 정리
    userImagePaths.forEach(path => fs.unlinkSync(path))
    unsplashImages.forEach(path => fs.unlinkSync(path))

    // 영상 파일을 base64로 반환
    const videoBase64 = videoBuffer.toString('base64')
    return NextResponse.json({
      success: true,
      data: {
        script,
        subtitles,
        videoBase64,
        title
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 