require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const os = require('os');
const OpenAI = require('openai');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { spawn } = require('child_process');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ffmpeg 실행 파일 경로를 명시적으로 지정
ffmpeg.setFfmpegPath('C:/Users/User/Desktop/news/ffmpeg.exe');

// uploads 폴더 생성
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

const app = express();

// 요청 로깅 미들웨어 추가
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received: ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: true,  // 모든 origin 허용
  methods: ['GET', 'POST'],
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, 'uploads', uuidv4());
    fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// SSE를 위한 클라이언트 연결 관리
let clients = new Set();

// SSE 엔드포인트 추가
app.get('/progress', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res
    };

    clients.add(newClient);

    req.on('close', () => {
        clients.delete(newClient);
    });
});

// 진행률 전송 함수
function sendProgress(progress) {
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ progress })}\n\n`);
    });
}

// --- Helper Functions (Moved from Next.js API) ---

async function extractArticleContent(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const article = document.querySelector('article');
        return article ? article.textContent : document.body.textContent;
    } catch (error) {
        console.error('Error extracting article:', error);
        throw new Error('Failed to extract article content.');
    }
}

async function generateScript(articleContent, title) {
    // 소제목과 본문을 분리하여 생성하는 개선된 프롬프트
    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
            {
                role: "system",
                content: `아래 뉴스 기사를 유튜브 쇼츠용 60초 스크립트로 한국어로 요약해줘. 
                
다음 형식으로 작성해줘:
1. 첫 번째 줄: 메인 제목에 어울리는 임팩트 있는 소제목 (10자 이내)
2. 두 번째 줄부터: 캐주얼하고 명확한 말투의 본문 스크립트 (8~10문장, 각 문장은 5초 이내)

예시:
속보!
오늘 새벽 2시경 서울 강남구에서 큰 화재가 발생했습니다.
현재 소방서에서 진화 작업을 진행 중입니다.
...

번호나 특수 문자는 사용하지 말고, 자연스럽게 이어지게 작성해줘.`
            },
            {
                role: "user",
                content: `제목: ${title}\n\n기사 내용: ${articleContent}`,
            },
        ],
        max_tokens: 1000,
    });
    return response.choices[0].message.content.trim();
}

async function generateSpeech(script, voiceId) {
    const ELEVENLABS_VOICE_ID = voiceId || "21m00Tcm4TlvDq8ikWAM";
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
            text: script,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.0,
                use_speaker_boost: true
            }
        }),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`!!! ElevenLabs API Error: ${response.status} ${response.statusText}`);
        console.error(`!!! ElevenLabs Response Body: ${errorBody}`);
        throw new Error(`Failed to generate speech. Status: ${response.status}`);
    }
    return response.buffer();
}

async function generateSubtitles(audioBuffer) {
    // Whisper needs a file, so we temporarily save the buffer
    const tempAudioPath = path.join(os.tmpdir(), `${uuidv4()}.mp3`);
    fs.writeFileSync(tempAudioPath, audioBuffer);

    const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempAudioPath),
        model: 'whisper-1',
        response_format: 'verbose_json',
    });

    fs.unlinkSync(tempAudioPath); // Clean up temporary audio file

    // 문장 단위로 SRT 생성 (싱크는 segment 내에서 균등 분할)
    let srtContent = "";
    let idx = 1;
    transcription.segments.forEach(segment => {
        // 문장 단위로 분리 (마침표, 느낌표, 물음표, 줄바꿈 기준)
        const sentences = segment.text.match(/[^.!?\n]+[.!?]?/g);
        if (sentences) {
            let segStart = segment.start;
            let segEnd = segment.end;
            let duration = (segEnd - segStart) / sentences.length;
            sentences.forEach((sentence, i) => {
                let start = segStart + duration * i;
                let end = segStart + duration * (i + 1);
                const startTime = new Date(start * 1000).toISOString().substr(11, 12).replace('.', ',');
                const endTime = new Date(end * 1000).toISOString().substr(11, 12).replace('.', ',');
                srtContent += `${idx++}\n${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
            });
        }
    });
    return srtContent;
}

async function extractKeyword(text) {
    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "system",
                content: "From the following text, extract a single, representative keyword in English. Return only the keyword."
            },
            {
                role: "user",
                content: text
            }
        ],
        max_tokens: 10
    });
    return response.choices[0].message.content.trim();
}

async function fetchUnsplashImages(keyword, count) {
    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${count}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`);
        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.statusText}`);
        }
        const data = await response.json();
        // 최대 해상도(full/raw) 우선, 없으면 regular
        return data.results.map(photo => photo.urls.full || photo.urls.raw || photo.urls.regular);
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);
        return [];
    }
}

// hex 색상(#RRGGBB) → ASS 색상 코드로 변환 함수 추가
function hexToASS(hex) {
  // #RRGGBB → &H00BBGGRR&
  if (!hex) return '&H00FFFFFF&';
  const h = hex.replace('#', '');
  if (h.length !== 6) return '&H00FFFFFF&';
  const r = h.substring(0,2);
  const g = h.substring(2,4);
  const b = h.substring(4,6);
  return `&H00${b}${g}${r}&`;
}

// opacity(0~1) → ASS 알파값(00~FF) 변환 함수 추가
function opacityToASSAlpha(opacity) {
  // opacity: 0(불투명) ~ 1(완전투명) → ASS: 00(불투명) ~ FF(투명)
  const alpha = Math.round((1 - parseFloat(opacity)) * 255);
  return alpha.toString(16).padStart(2, '0').toUpperCase();
}

// --- Global Error Handlers ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err, origin) => {
  console.error(`CRITICAL: Caught exception: ${err}\n` + `Exception origin: ${origin}`);
  process.exit(1); // Exit gracefully
});

app.post('/generate-video', upload.any(), async (req, res) => {
    // escapePath를 최상단에 선언
    const escapePath = (p) => p.replace(/\\/g, '/').replace(/:/g, '\\:');
    console.log("Received request to /generate-video");
    
    // Add detailed logging to inspect the incoming request
    console.log("--- Inspector ---");
    console.log("req.body (text fields):", JSON.stringify(req.body, null, 2));
    console.log("req.files (file fields):", req.files);
    console.log("-----------------");

    const { newsUrl, title, subtitle, channelName, voice, titleFont, subtitleFont, channelFont, scriptFont,
      titleColor, titleOutline, subtitleColor, subtitleOutline, channelColor, channelOutline, scriptColor, scriptOutline,
      titleShadowColor, titleShadowOpacity, titleShadowBlur,
      subtitleShadowColor, subtitleShadowOpacity, subtitleShadowBlur,
      channelShadowColor, channelShadowOpacity, channelShadowBlur,
      scriptShadowColor, scriptShadowOpacity, scriptShadowBlur } = req.body;
    
    // 소제목 디버깅 로그 추가
    console.log("=== SUBTITLE DEBUG ===");
    console.log("Raw subtitle from req.body:", subtitle);
    console.log("Subtitle type:", typeof subtitle);
    console.log("Subtitle length:", subtitle ? subtitle.length : 'undefined');
    console.log("Subtitle trimmed:", subtitle ? subtitle.trim() : 'undefined');
    console.log("Channel name:", channelName);
    console.log("Title font:", titleFont);
    console.log("Subtitle font:", subtitleFont);
    console.log("Channel font:", channelFont);
    console.log("Script font:", scriptFont);
    console.log("=====================");
    
    if (!newsUrl || !title) {
        console.log("Validation failed: News URL or title is missing.");
        return res.status(400).json({ error: 'News URL and title are required.' });
    }

    console.log(`[DATA] Received URL: ${newsUrl}, Title: ${title}, Subtitle: ${subtitle || 'AI가 생성 예정'}, Channel: ${channelName || '기본 채널'}`);

    let tempDir; // Declare here to be accessible in the final catch block

    try {
        console.log("[SETUP] Attempting to create temp directory...");
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-session-'));
        console.log(`[SETUP] Temp directory created at: ${tempDir}`);

        console.log("[STEP 1/7] Extracting article content... (5%)");
        sendProgress(5);
        const articleContent = await extractArticleContent(newsUrl);
        console.log("[STEP 1/7] Article content extracted successfully.");

        console.log("[STEP 2/7] Generating script... (15%)");
        sendProgress(15);
        const script = await generateScript(articleContent, title);
        console.log(`[STEP 2/7] Script generated: ${script.substring(0, 50)}...`);

        console.log("[STEP 3/7] Generating speech... (25%)");
        sendProgress(25);
        const audioBuffer = await generateSpeech(script, voice);
        const audioFilePath = path.join(tempDir, 'audio.mp3');
        fs.writeFileSync(audioFilePath, audioBuffer);
        console.log("[STEP 3/7] Speech generated and saved.");

        console.log("[STEP 4/7] Generating subtitles... (35%)");
        sendProgress(35);
        const srtContent = await generateSubtitles(audioBuffer);
        const srtFilePath = path.join(tempDir, 'subtitles.srt');
        fs.writeFileSync(srtFilePath, srtContent);
        console.log("[STEP 4/7] Subtitles generated and saved.");
        
        console.log("[STEP 5/7] Preparing images... (45%)");
        sendProgress(45);
        let imagePaths = [];
        // Add user-uploaded images first
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => imagePaths.push(file.path));
            console.log(`[STEP 5/7] Added ${req.files.length} user-uploaded images.`);
        }

        const imagesNeeded = 6 - imagePaths.length;
        if (imagesNeeded > 0) {
            console.log(`[STEP 5/7] Fetching ${imagesNeeded} additional images from Unsplash...`);
            const keyword = await extractKeyword(script);
            console.log(`[STEP 5/7] Keyword for Unsplash: ${keyword}`);
            const unsplashUrls = await fetchUnsplashImages(keyword, imagesNeeded);

            for (let i = 0; i < unsplashUrls.length; i++) {
                const url = unsplashUrls[i];
                const dest = path.join(tempDir, `unsplash_${i}.jpg`);
                const response = await axios({ url, responseType: 'stream' });
                await new Promise((resolve, reject) => {
                    const writer = fs.createWriteStream(dest);
                    response.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                imagePaths.push(dest);
            }
            console.log(`[STEP 5/7] Downloaded ${unsplashUrls.length} images from Unsplash.`);
        }
        
        console.log("[STEP 6/7] Starting FFMPEG video generation (using direct command)... (60%)");
        sendProgress(60);
        const finalOutputPath = path.join('C:/Users/User/Desktop/outputs', `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`);
        if (!fs.existsSync('C:/Users/User/Desktop/outputs')) {
            fs.mkdirSync('C:/Users/User/Desktop/outputs');
        }

        await new Promise((resolve, reject) => {
            // 정보 텍스트 SRT 생성 (filter 생성 전에 반드시 선언)
            const infoText = '익명  14:25   조회수  3,463,126';
            const infoSrtContent = `1\n00:00:00,000 --> 00:59:59,999\n${infoText}`;
            const infoSubsPath = path.join(tempDir, 'info_subs.srt');
            fs.writeFileSync(infoSubsPath, infoSrtContent, { encoding: 'utf8' });
            const relativeInfoSubsPath = escapePath(infoSubsPath);

            // 1. 소제목 처리: 프론트엔드에서 받은 소제목이 있으면 사용, 없으면 AI가 생성한 것 사용
            let finalSubtitle;
            if (subtitle && subtitle.trim()) {
                finalSubtitle = subtitle.trim();
                console.log(`[SUBTITLE] Using user-provided subtitle: ${finalSubtitle}`);
            } else {
                // AI가 생성한 스크립트에서 소제목 추출
                const scriptLines = script.split('\n').filter(line => line.trim());
                finalSubtitle = scriptLines[0] || "Breaking News";
                console.log(`[SUBTITLE] Using AI-generated subtitle: ${finalSubtitle}`);
            }
            
            // 1. 소제목 처리: 프론트엔드에서 받은 채널명이 있으면 사용, 없으면 기본값 사용
            let finalChannelName;
            if (channelName && channelName.trim()) {
                finalChannelName = channelName.trim();
                console.log(`[CHANNEL] Using user-provided channel name: ${finalChannelName}`);
            } else {
                finalChannelName = "썰튜브";
                console.log(`[CHANNEL] Using default channel name: ${finalChannelName}`);
            }
            
            console.log(`[CHANNEL] Using channel name: ${finalChannelName}`);
            
            // 폰트 처리 - 썰튜브용 고정 폰트
            const finalTitleFont = "Malgun Gothic";
            const finalSubtitleFont = "Malgun Gothic";
            const finalChannelFont = "Malgun Gothic";
            const finalScriptFont = "Malgun Gothic";
            // 색상/획 처리 - 썰튜브용 하얀색 통일, 획 제거
            const finalTitleColor = '&H00FFFFFF&'; // 하얀색
            const finalTitleOutline = '&H00000000&'; // 투명 (획 제거)
            const finalSubtitleColor = '&H00FFFFFF&'; // 하얀색
            const finalSubtitleOutline = '&H00000000&'; // 투명 (획 제거)
            const finalChannelColor = '&H00FFFFFF&'; // 하얀색
            const finalChannelOutline = '&H00000000&'; // 투명 (획 제거)
            const finalScriptColor = '&H00FFFFFF&'; // 하얀색
            const finalScriptOutline = '&H00000000&'; // 투명 (획 제거)
            
            // 그림자 처리 - 썰튜브용 그림자 제거
            const finalTitleShadowColor = '&H00000000&'; // 투명
            const finalTitleShadowAlpha = '00'; // 투명
            const finalTitleShadow = 0; // 그림자 제거
            const finalSubtitleShadowColor = '&H00000000&'; // 투명
            const finalSubtitleShadowAlpha = '00'; // 투명
            const finalSubtitleShadow = 0; // 그림자 제거
            const finalChannelShadowColor = '&H00000000&'; // 투명
            const finalChannelShadowAlpha = '00'; // 투명
            const finalChannelShadow = 0; // 그림자 제거
            const finalScriptShadowColor = '&H00000000&'; // 투명
            const finalScriptShadowAlpha = '00'; // 투명
            const finalScriptShadow = 0; // 그림자 제거
            
            console.log(`[FONTS] Title: ${finalTitleFont}, Subtitle: ${finalSubtitleFont}, Channel: ${finalChannelFont}, Script: ${finalScriptFont}`);
            console.log(`[SHADOWS] Title: ${finalTitleShadowColor}@${finalTitleShadowAlpha}, Subtitle: ${finalSubtitleShadowColor}@${finalSubtitleShadowAlpha}, Channel: ${finalChannelShadowColor}@${finalChannelShadowAlpha}, Script: ${finalScriptShadowColor}@${finalScriptShadowAlpha}`);
            
            // 정본 스크립트는 AI가 생성한 것을 사용 (소제목 제외)
            const scriptLines = script.split('\n').filter(line => line.trim());
            const mainScript = scriptLines.slice(1).join('\n'); // 첫 번째 줄(AI 소제목) 제외하고 나머지가 본문
            
            // 2. 자막 파일들 생성 (모두 반드시 생성)
            // 제목 SRT
            const titleSubtitleContent = `1\n00:00:00,000 --> 00:59:59,999\n${title}`;
            const titleSubsPath = path.join(tempDir, 'title_subs.srt');
            fs.writeFileSync(titleSubsPath, titleSubtitleContent, { encoding: 'utf8' });
            // 채널명 SRT
            const channelSubtitleContent = `1\n00:00:00,000 --> 00:59:59,999\n${finalChannelName}`;
            const channelSubsPath = path.join(tempDir, 'channel_subs.srt');
            fs.writeFileSync(channelSubsPath, channelSubtitleContent, { encoding: 'utf8' });
            // 본문 SRT
            const mainSrtPath = path.join(tempDir, 'main_subs.srt');
            fs.writeFileSync(mainSrtPath, srtContent, { encoding: 'utf8' });

            // 자막 파일 생성 확인 로그
            console.log('=== SUBTITLE FILES CREATED ===');
            console.log('Title subtitle path:', titleSubsPath);
            console.log('Title subtitle content:', titleSubtitleContent);
            console.log('Channel subtitle path:', channelSubsPath);
            console.log('Channel subtitle content:', channelSubtitleContent);
            console.log('Main subtitle path:', mainSrtPath);
            console.log('Main subtitle content:', srtContent.substring(0, 100) + '...');
            console.log('================================');

            // 3. Check if we have images
            if (imagePaths.length === 0) {
                throw new Error('No images available for video generation');
            }

            // 4. Escape paths for Windows - 절대 경로 사용
            const relativeTitleSubsPath = escapePath(titleSubsPath);
            const relativeSubtitleSubsPath = escapePath(srtFilePath);
            const relativeChannelSubsPath = escapePath(channelSubsPath);
            const relativeMainSubsPath = escapePath(mainSrtPath);

            console.log('=== ESCAPED PATHS ===');
            console.log('Title subtitle escaped path:', relativeTitleSubsPath);
            console.log('Subtitle subtitle escaped path:', relativeSubtitleSubsPath);
            console.log('Channel subtitle escaped path:', relativeChannelSubsPath);
            console.log('Main subtitle escaped path:', relativeMainSubsPath);
            console.log('=====================');

            // 5. Create complex filter for slideshow with backgrounds and subtitles
            const imageInputs = imagePaths.map((_, index) => ({
                path: imagePaths[index],
                duration: 10 // 각 이미지 10초
            }));

            const filter = [
                // 배경 생성 및 합성
                ...imageInputs.map((_, i) => `color=c=#7ecbff:s=1080x384:d=10[topbg${i}]`),
                ...imageInputs.map((_, i) => `color=c=white:s=1080x1536:d=10[botbg${i}]`),
                ...imageInputs.map((_, i) => `[topbg${i}][botbg${i}]vstack=inputs=2[bg${i}]`),
                ...imageInputs.map((_, i) => `[${i}:v]scale=1080:800:force_original_aspect_ratio=decrease,pad=1080:800:(ow-iw)/2:(oh-ih)/2:color=black@0[img${i}]`),
                ...imageInputs.map((_, i) => `[bg${i}][img${i}]overlay=0:900:shortest=1,scale=1080:1920,setsar=1[finalbg${i}]`),
                imageInputs.map((_, i) => `[finalbg${i}]`).join('') + `concat=n=${imageInputs.length}:v=1:a=0[bgv]`,
                // 자막 추가 (채널명 → 제목 → 정보 → 가로선 → 본문)
                `[bgv]subtitles='${relativeChannelSubsPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=14,Bold=1,PrimaryColour=&H00000000&,Outline=0,Alignment=2,MarginV=235' [withchannel]`,
                `[withchannel]subtitles='${relativeTitleSubsPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=14,Bold=1,PrimaryColour=&H00000000&,Outline=0,Alignment=2,MarginV=210,MarginR=170' [withtitle]`,
                `[withtitle]subtitles='${relativeInfoSubsPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=6,Bold=1,PrimaryColour=&H00000000&,Outline=0,Alignment=2,MarginV=200,MarginR=170' [withinfo]`,
                `[withinfo]drawbox=x=0:y=600:w=1100:h=2:color=black@1:t=fill [withline]`,
                `[withline]subtitles='${relativeMainSubsPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=12,Bold=1,PrimaryColour=&H00000000&,Outline=0,Alignment=2,MarginV=170,WordWrap=1' [v]`
            ].join(';');

            // 6. Create ffmpeg command with multiple image inputs
            const ffmpegArgs = [];
            
            // Add each image as input with loop and duration
            imageInputs.forEach((input) => {
                ffmpegArgs.push('-loop', '1', '-t', input.duration.toString(), '-i', input.path);
            });

            // Add audio as last input
            ffmpegArgs.push('-i', audioFilePath);

            // Add output options
            ffmpegArgs.push(
                '-y',
                '-filter_complex', filter,
                '-map', '[v]',
                '-map', `${imageInputs.length}:a`, // Audio from last input
                '-c:v', 'libx264',
                '-tune', 'stillimage',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-shortest',
                finalOutputPath
            );

            console.log('Complex slideshow ffmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));
            console.log('Using images:', imagePaths);
            console.log('Using audio:', audioFilePath);
            console.log('Filter:', filter);
            console.log('Title:', title);
            console.log('Final Subtitle:', finalSubtitle);
            console.log('Final Channel Name:', finalChannelName);

            // Execute the command
            const ffmpegProcess = spawn('C:/Users/User/Desktop/news/ffmpeg.exe', ffmpegArgs);

            let stderrOutput = '';
            
            ffmpegProcess.stdout.on('data', (data) => {
                console.log('ffmpeg stdout:', data.toString());
            });

            ffmpegProcess.stderr.on('data', (data) => {
                const output = data.toString();
                stderrOutput += output;
                console.log('ffmpeg stderr:', output);
            });

            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('[STEP 6/7] Video generation finished successfully.');
                    sendProgress(100);
                    resolve();
                } else {
                    console.error(`ffmpeg process exited with code ${code}`);
                    console.error('Full stderr output:', stderrOutput);
                    reject(new Error(`FFmpeg process exited with code ${code}`));
                }
            });

            ffmpegProcess.on('error', (err) => {
                console.error('ffmpeg spawn error:', err.message);
                reject(err);
            });
        });

        console.log("[STEP 7/7] Sending video to client... (100%)");
        res.download(finalOutputPath, path.basename(finalOutputPath), (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            console.log("[CLEANUP] Cleaning up temporary files...");
             // Cleanup
            try {
                if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
                if (req.files) {
                  req.files.forEach(file => {
                    const dir = path.dirname(file.path);
                    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { console.error(`Failed to delete temp upload dir ${dir}`, e); }
                  });
                }
                fs.unlinkSync(finalOutputPath);
                console.log("[CLEANUP] Temporary files cleaned up successfully.");
            } catch (e) {
                console.error('[CLEANUP] Cleanup error:', e);
            }
        });

  } catch (err) {
        console.error("!!! CRITICAL ERROR in /generate-video route !!!");
        console.error(err);
        res.status(500).json({ error: err.message || 'An unknown error occurred on the server.' });
        // Ensure cleanup even on failure
        try {
            if (tempDir) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                console.log("[CLEANUP] Cleaned up temp directory after error.");
            }
        } catch(e) {
            console.error('[CLEANUP] Failed to cleanup temp dir on error:', e);
        }
  }
});

app.post('/generate-story-video', upload.any(), async (req, res) => {
    // escapePath를 최상단에 선언
    const escapePath = (p) => p.replace(/\\/g, '/').replace(/:/g, '\\:');
    console.log("Received request to /generate-story-video");
    
    // Add detailed logging to inspect the incoming request
    console.log("--- Inspector ---");
    console.log("req.body (text fields):", JSON.stringify(req.body, null, 2));
    console.log("req.files (file fields):", req.files);
    console.log("-----------------");

    const { storyContent, title, subtitle, channelName, voice, titleFont, subtitleFont, channelFont, scriptFont,
      titleColor, titleOutline, subtitleColor, subtitleOutline, channelColor, channelOutline, scriptColor, scriptOutline,
      titleShadowColor, titleShadowOpacity, titleShadowBlur,
      subtitleShadowColor, subtitleShadowOpacity, subtitleShadowBlur,
      channelShadowColor, channelShadowOpacity, channelShadowBlur,
      scriptShadowColor, scriptShadowOpacity, scriptShadowBlur } = req.body;
    
    // 소제목 디버깅 로그 추가
    console.log("=== SUBTITLE DEBUG ===");
    console.log("Raw subtitle from req.body:", subtitle);
    console.log("Subtitle type:", typeof subtitle);
    console.log("Subtitle length:", subtitle ? subtitle.length : 'undefined');
    console.log("Subtitle trimmed:", subtitle ? subtitle.trim() : 'undefined');
    console.log("Channel name:", channelName);
    console.log("Title font:", titleFont);
    console.log("Subtitle font:", subtitleFont);
    console.log("Channel font:", channelFont);
    console.log("Script font:", scriptFont);
    console.log("=====================");
    
    if (!storyContent || !title) {
        console.log("Validation failed: Story content or title is missing.");
        return res.status(400).json({ error: 'Story content and title are required.' });
    }

    console.log(`[DATA] Received Story Content: ${storyContent.substring(0, 100)}..., Title: ${title}, Subtitle: ${subtitle || 'AI가 생성 예정'}, Channel: ${channelName || '기본 채널'}`);

    let tempDir; // Declare here to be accessible in the final catch block

    try {
        console.log("[SETUP] Attempting to create temp directory...");
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'story-session-'));
        console.log(`[SETUP] Temp directory created at: ${tempDir}`);

        console.log("[STEP 1/7] Generating script from story content... (5%)");
        sendProgress(5);
        // 썰튜브 스타일 프롬프트로 AI 스크립트 생성
        const scriptResponse = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "system",
                    content: `아래 이야기를 유튜브 썰튜브 쇼츠용 60초 스크립트로 요약해줘. 
                    
다음 형식으로 작성해줘:
1. 첫 번째 줄: 메인 제목에 어울리는 임팩트 있는 소제목 (10자 이내)
2. 두 번째 줄부터: 썰튜브 특유의 친근하고 재치있는 말투의 본문 스크립트 (8~10문장, 각 문장은 5초 이내)

예시:
썰 시작!
오늘 새벽 2시경 서울 강남구에서 큰 화재가 발생했습니다.
현재 소방서에서 진화 작업을 진행 중입니다.
...

번호나 특수 문자는 사용하지 말고, 자연스럽게 이어지게 작성해줘.`
                },
                {
                    role: "user",
                    content: `제목: ${title}\n\n이야기 내용: ${storyContent}`,
                },
            ],
            max_tokens: 1000,
        });
        const script = scriptResponse.choices[0].message.content.trim();
        console.log(`[STEP 1/7] Script generated: ${script.substring(0, 50)}...`);

        console.log("[STEP 2/7] Generating speech... (25%)");
        sendProgress(25);
        const audioBuffer = await generateSpeech(script, voice);
        const audioFilePath = path.join(tempDir, 'audio.mp3');
        fs.writeFileSync(audioFilePath, audioBuffer);
        console.log("[STEP 2/7] Speech generated and saved.");

        console.log("[STEP 3/7] Generating subtitles... (35%)");
        sendProgress(35);
        const srtContent = await generateSubtitles(audioBuffer);
        const srtFilePath = path.join(tempDir, 'subtitles.srt');
        fs.writeFileSync(srtFilePath, srtContent);
        console.log("[STEP 3/7] Subtitles generated and saved.");
        
        console.log("[STEP 4/7] Preparing images... (45%)");
        sendProgress(45);
        let imagePaths = [];
        // Add user-uploaded images first
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => imagePaths.push(file.path));
            console.log(`[STEP 4/7] Added ${req.files.length} user-uploaded images.`);
        }

        const imagesNeeded = 6 - imagePaths.length;
        if (imagesNeeded > 0) {
            console.log(`[STEP 4/7] Fetching ${imagesNeeded} additional images from Unsplash...`);
            const keyword = await extractKeyword(script);
            console.log(`[STEP 4/7] Keyword for Unsplash: ${keyword}`);
            const unsplashUrls = await fetchUnsplashImages(keyword, imagesNeeded);

            for (let i = 0; i < unsplashUrls.length; i++) {
                const url = unsplashUrls[i];
                const dest = path.join(tempDir, `unsplash_${i}.jpg`);
                const response = await axios({ url, responseType: 'stream' });
                await new Promise((resolve, reject) => {
                    const writer = fs.createWriteStream(dest);
                    response.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                imagePaths.push(dest);
            }
            console.log(`[STEP 4/7] Downloaded ${unsplashUrls.length} images from Unsplash.`);
        }
        
        console.log("[STEP 5/7] Starting FFMPEG video generation (using direct command)... (60%)");
        sendProgress(60);
        const finalOutputPath = path.join('C:/Users/User/Desktop/outputs', `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`);
        if (!fs.existsSync('C:/Users/User/Desktop/outputs')) {
            fs.mkdirSync('C:/Users/User/Desktop/outputs');
        }

        await new Promise((resolve, reject) => {
            // 정보 텍스트 SRT 생성 (filter 생성 전에 반드시 선언)
            const infoText = '익명  14:25   조회수  3,463,126';
            const infoSrtContent = `1\n00:00:00,000 --> 00:59:59,999\n${infoText}`;
            const infoSubsPath = path.join(tempDir, 'info_subs.srt');
            fs.writeFileSync(infoSubsPath, infoSrtContent, { encoding: 'utf8' });
            const relativeInfoSubsPath = escapePath(infoSubsPath);

            // 1. 소제목 처리: 프론트엔드에서 받은 소제목이 있으면 사용, 없으면 AI가 생성한 것 사용
            let finalSubtitle;
            if (subtitle && subtitle.trim()) {
                finalSubtitle = subtitle.trim();
                console.log(`[SUBTITLE] Using user-provided subtitle: ${finalSubtitle}`);
            } else {
                // AI가 생성한 스크립트에서 소제목 추출
                const scriptLines = script.split('\n').filter(line => line.trim());
                finalSubtitle = scriptLines[0] || "썰 시작!";
                console.log(`[SUBTITLE] Using AI-generated subtitle: ${finalSubtitle}`);
            }
            
            // 1. 소제목 처리: 프론트엔드에서 받은 채널명이 있으면 사용, 없으면 기본값 사용
            let finalChannelName;
            if (channelName && channelName.trim()) {
                finalChannelName = channelName.trim();
                console.log(`[CHANNEL] Using user-provided channel name: ${finalChannelName}`);
            } else {
                finalChannelName = "썰튜브";
                console.log(`[CHANNEL] Using default channel name: ${finalChannelName}`);
            }
            
            console.log(`[CHANNEL] Using channel name: ${finalChannelName}`);
            
            // 폰트 처리 - 썰튜브용 고정 폰트
            const finalTitleFont = "Malgun Gothic";
            const finalSubtitleFont = "Malgun Gothic";
            const finalChannelFont = "Malgun Gothic";
            const finalScriptFont = "Malgun Gothic";
            // 색상/획 처리 - 썰튜브용 하얀색 통일, 획 제거
            const finalTitleColor = '&H00FFFFFF&'; // 하얀색
            const finalTitleOutline = '&H00000000&'; // 투명 (획 제거)
            const finalSubtitleColor = '&H00FFFFFF&'; // 하얀색
            const finalSubtitleOutline = '&H00000000&'; // 투명 (획 제거)
            const finalChannelColor = '&H00FFFFFF&'; // 하얀색
            const finalChannelOutline = '&H00000000&'; // 투명 (획 제거)
            const finalScriptColor = '&H00FFFFFF&'; // 하얀색
            const finalScriptOutline = '&H00000000&'; // 투명 (획 제거)
            
            // 그림자 처리 - 썰튜브용 그림자 제거
            const finalTitleShadowColor = '&H00000000&'; // 투명
            const finalTitleShadowAlpha = '00'; // 투명
            const finalTitleShadow = 0; // 그림자 제거
            const finalSubtitleShadowColor = '&H00000000&'; // 투명
            const finalSubtitleShadowAlpha = '00'; // 투명
            const finalSubtitleShadow = 0; // 그림자 제거
            const finalChannelShadowColor = '&H00000000&'; // 투명
            const finalChannelShadowAlpha = '00'; // 투명
            const finalChannelShadow = 0; // 그림자 제거
            const finalScriptShadowColor = '&H00000000&'; // 투명
            const finalScriptShadowAlpha = '00'; // 투명
            const finalScriptShadow = 0; // 그림자 제거
            
            console.log(`[FONTS] Title: ${finalTitleFont}, Subtitle: ${finalSubtitleFont}, Channel: ${finalChannelFont}, Script: ${finalScriptFont}`);
            console.log(`[SHADOWS] Title: ${finalTitleShadowColor}@${finalTitleShadowAlpha}, Subtitle: ${finalSubtitleShadowColor}@${finalSubtitleShadowAlpha}, Channel: ${finalChannelShadowColor}@${finalChannelShadowAlpha}, Script: ${finalScriptShadowColor}@${finalScriptShadowAlpha}`);
            
            // 본문 스크립트는 AI가 생성한 것을 사용 (소제목 제외)
            const scriptLines = script.split('\n').filter(line => line.trim());
            const mainScript = scriptLines.slice(1).join('\n'); // 첫 번째 줄(AI 소제목) 제외하고 나머지가 본문
            
            // 2. 자막 파일들 생성 (모두 반드시 생성)
            // 제목 SRT
            const titleSubtitleContent = `1\n00:00:00,000 --> 00:59:59,999\n${title}`;
            const titleSubsPath = path.join(tempDir, 'title_subs.srt');
            fs.writeFileSync(titleSubsPath, titleSubtitleContent, { encoding: 'utf8' });
            // 채널명 SRT
            const channelSubtitleContent = `1\n00:00:00,000 --> 00:59:59,999\n${finalChannelName}`;
            const channelSubsPath = path.join(tempDir, 'channel_subs.srt');
            fs.writeFileSync(channelSubsPath, channelSubtitleContent, { encoding: 'utf8' });
            // 본문 SRT
            const mainSrtPath = path.join(tempDir, 'main_subs.srt');
            fs.writeFileSync(mainSrtPath, srtContent, { encoding: 'utf8' });

            // 자막 파일 생성 확인 로그
            console.log('=== SUBTITLE FILES CREATED ===');
            console.log('Title subtitle path:', titleSubsPath);
            console.log('Title subtitle content:', titleSubtitleContent);
            console.log('Channel subtitle path:', channelSubsPath);
            console.log('Channel subtitle content:', channelSubtitleContent);
            console.log('Main subtitle path:', mainSrtPath);
            console.log('Main subtitle content:', srtContent.substring(0, 100) + '...');
            console.log('================================');

            // 3. Check if we have images
            if (imagePaths.length === 0) {
                throw new Error('No images available for video generation');
            }

            // 4. Escape paths for Windows - 절대 경로 사용
            const relativeTitleSubsPath = escapePath(titleSubsPath);
            const relativeSubtitleSubsPath = escapePath(srtFilePath);
            const relativeChannelSubsPath = escapePath(channelSubsPath);
            const relativeMainSubsPath = escapePath(mainSrtPath);

            console.log('=== ESCAPED PATHS ===');
            console.log('Title subtitle escaped path:', relativeTitleSubsPath);
            console.log('Subtitle subtitle escaped path:', relativeSubtitleSubsPath);
            console.log('Channel subtitle escaped path:', relativeChannelSubsPath);
            console.log('Main subtitle escaped path:', relativeMainSubsPath);
            console.log('=====================');

            // 5. Create complex filter for slideshow with backgrounds and subtitles
            const imageInputs = imagePaths.map((_, index) => ({
                path: imagePaths[index],
                duration: 10 // 각 이미지 10초
            }));

            const filter = [
                // 배경 생성 및 합성
                ...imageInputs.map((_, i) => `color=c=#7ecbff:s=1080x384:d=10[topbg${i}]`),
                ...imageInputs.map((_, i) => `color=c=white:s=1080x1536:d=10[botbg${i}]`),
                ...imageInputs.map((_, i) => `[topbg${i}][botbg${i}]vstack=inputs=2[bg${i}]`),
                ...imageInputs.map((_, i) => `[${i}:v]scale=1080:800:force_original_aspect_ratio=decrease,pad=1080:800:(ow-iw)/2:(oh-ih)/2:color=black@0[img${i}]`),
                ...imageInputs.map((_, i) => `[bg${i}][img${i}]overlay=0:900:shortest=1,scale=1080:1920,setsar=1[finalbg${i}]`),
                imageInputs.map((_, i) => `[finalbg${i}]`).join('') + `concat=n=${imageInputs.length}:v=1:a=0[bgv]`,
                // 자막 추가 (채널명 → 제목 → 정보 → 가로선 → 본문)
                `[bgv]subtitles='${relativeChannelSubsPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=14,Bold=1,PrimaryColour=&H00000000&,Outline=0,Alignment=2,MarginV=235' [withchannel]`,
                `[withchannel]subtitles='${relativeTitleSubsPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=14,Bold=1,PrimaryColour=&H00000000&,Outline=0,Alignment=2,MarginV=210,MarginR=170' [withtitle]`,
                `[withtitle]subtitles='${relativeInfoSubsPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=6,Bold=1,PrimaryColour=&H00000000&,Outline=0,Alignment=2,MarginV=200,MarginR=170' [withinfo]`,
                `[withinfo]drawbox=x=0:y=600:w=1100:h=2:color=black@1:t=fill [withline]`,
                `[withline]subtitles='${relativeMainSubsPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=12,Bold=1,PrimaryColour=&H00000000&,Outline=0,Alignment=2,MarginV=170,WordWrap=1' [v]`
            ].join(';');

            // 6. Create ffmpeg command with multiple image inputs
            const ffmpegArgs = [];
            
            // Add each image as input with loop and duration
            imageInputs.forEach((input) => {
                ffmpegArgs.push('-loop', '1', '-t', input.duration.toString(), '-i', input.path);
            });

            // Add audio as last input
            ffmpegArgs.push('-i', audioFilePath);

            // Add output options
            ffmpegArgs.push(
                '-y',
                '-filter_complex', filter,
                '-map', '[v]',
                '-map', `${imageInputs.length}:a`, // Audio from last input
                '-c:v', 'libx264',
                '-tune', 'stillimage',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-pix_fmt', 'yuv420p',
                '-shortest',
                finalOutputPath
            );

            console.log('Complex slideshow ffmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));
            console.log('Using images:', imagePaths);
            console.log('Using audio:', audioFilePath);
            console.log('Filter:', filter);
            console.log('Title:', title);
            console.log('Final Subtitle:', finalSubtitle);
            console.log('Final Channel Name:', finalChannelName);

            // Execute the command
            const ffmpegProcess = spawn('C:/Users/User/Desktop/news/ffmpeg.exe', ffmpegArgs);

            let stderrOutput = '';
            
            ffmpegProcess.stdout.on('data', (data) => {
                console.log('ffmpeg stdout:', data.toString());
            });

            ffmpegProcess.stderr.on('data', (data) => {
                const output = data.toString();
                stderrOutput += output;
                console.log('ffmpeg stderr:', output);
            });

            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('[STEP 5/7] Video generation finished successfully.');
                    sendProgress(100);
                    resolve();
                } else {
                    console.error(`ffmpeg process exited with code ${code}`);
                    console.error('Full stderr output:', stderrOutput);
                    reject(new Error(`FFmpeg process exited with code ${code}`));
                }
            });

            ffmpegProcess.on('error', (err) => {
                console.error('ffmpeg spawn error:', err.message);
                reject(err);
            });
        });

        console.log("[STEP 6/7] Sending video to client... (100%)");
        res.download(finalOutputPath, path.basename(finalOutputPath), (err) => {
            if (err) {
                console.error('Download error:', err);
            }
            console.log("[CLEANUP] Cleaning up temporary files...");
             // Cleanup
            try {
                if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
                if (req.files) {
                  req.files.forEach(file => {
                    const dir = path.dirname(file.path);
                    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { console.error(`Failed to delete temp upload dir ${dir}`, e); }
                  });
                }
                fs.unlinkSync(finalOutputPath);
                console.log("[CLEANUP] Temporary files cleaned up successfully.");
            } catch (e) {
                console.error('[CLEANUP] Cleanup error:', e);
            }
        });

  } catch (err) {
        console.error("!!! CRITICAL ERROR in /generate-story-video route !!!");
        console.error(err);
        res.status(500).json({ error: err.message || 'An unknown error occurred on the server.' });
        // Ensure cleanup even on failure
        try {
            if (tempDir) {
                fs.rmSync(tempDir, { recursive: true, force: true });
                console.log("[CLEANUP] Cleaned up temp directory after error.");
            }
        } catch(e) {
            console.error('[CLEANUP] Failed to cleanup temp dir on error:', e);
        }
  }
});

app.get('/test-bluewhite-video', async (req, res) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-bluewhite-'));
    const finalOutputPath = path.join(tempDir, 'test.mp4');
    // 10초짜리 상단 파란색(20%), 하단 하얀색(80%) 영상
    const filter = [
        "color=c=#7ecbff:s=1080x384:d=10[top]", // 20% (384px)
        "color=c=white:s=1080x1536:d=10[bottom]", // 80% (1536px)
        "[top][bottom]vstack=inputs=2[bg]",
        "[bg]copy[v]"
    ].join(';');
    const ffmpegArgs = [
        '-y',
        '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
        '-filter_complex', filter,
        '-map', '[v]',
        '-map', '0:a',
        '-t', '10',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        finalOutputPath
    ];
    const ffmpegProcess = spawn('C:/Users/User/Desktop/news/ffmpeg.exe', ffmpegArgs);
    ffmpegProcess.on('close', (code) => {
        if (code === 0) {
            res.download(finalOutputPath, 'test.mp4', (err) => {
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
            });
        } else {
            res.status(500).json({ error: 'ffmpeg error' });
            try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
        }
    });
});

app.get('/test-caption-only-video', async (req, res) => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-caption-only-'));
    const finalOutputPath = path.join(tempDir, 'test.mp4');
    // 자막 내용 예시
    const title = '테스트 제목';
    const subtitle = '테스트 소제목';
    const mainScript = ['이것은 첫 번째 대사입니다.', '이것은 두 번째 대사입니다.', '이것은 세 번째 대사입니다.'];
    // srt 파일 생성
    const titleSrt = `1\n00:00:00,000 --> 00:00:09,999\n${title}`;
    const subtitleSrt = `1\n00:00:00,000 --> 00:00:09,999\n${subtitle}`;
    const mainSrt = mainScript.map((line, idx) => `${idx+1}\n00:00:${(idx*3).toString().padStart(2,'0')},000 --> 00:00:${((idx+1)*3-1).toString().padStart(2,'0')},999\n${line}`).join('\n\n');
    const titleSrtPath = path.join(tempDir, 'title.srt');
    const subtitleSrtPath = path.join(tempDir, 'subtitle.srt');
    const mainSrtPath = path.join(tempDir, 'main.srt');
    fs.writeFileSync(titleSrtPath, titleSrt);
    fs.writeFileSync(subtitleSrtPath, subtitleSrt);
    fs.writeFileSync(mainSrtPath, mainSrt);
    // filter_complex: 배경 + 자막만
    const filter = [
        "color=c=#7ecbff:s=1080x384:d=9[top]",
        "color=c=white:s=1080x1536:d=9[bottom]",
        "[top][bottom]vstack=inputs=2[bg]",
        `[bg]subtitles='${titleSrtPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=48,Bold=1,PrimaryColour=&H00FFFFFF&,OutlineColour=&H000000&,Outline=3,Alignment=2,MarginV=600' [withtitle]`,
        `[withtitle]subtitles='${subtitleSrtPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=36,Bold=1,PrimaryColour=&H00FFFFCC&,OutlineColour=&H000000&,Outline=2,Alignment=2,MarginV=540' [withsubtitle]`,
        `[withsubtitle]subtitles='${mainSrtPath}':charenc=UTF-8:force_style='FontName=Malgun Gothic,FontSize=32,PrimaryColour=&H00FFFFFF&,OutlineColour=&H000000&,Outline=2,Alignment=2,MarginV=120' [v]`
    ].join(';');
    const ffmpegArgs = [
        '-y',
        '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
        '-filter_complex', filter,
        '-map', '[v]',
        '-map', '0:a',
        '-t', '9',
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        finalOutputPath
    ];
    const ffmpegProcess = spawn('C:/Users/User/Desktop/news/ffmpeg.exe', ffmpegArgs);
    ffmpegProcess.on('close', (code) => {
        if (code === 0) {
            res.download(finalOutputPath, 'test.mp4', (err) => {
                try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
            });
        } else {
            res.status(500).json({ error: 'ffmpeg error' });
            try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
        }
    });
});

app.listen(4001, '0.0.0.0', () => {
  console.log('=== VIDEO SERVER STARTED ===');
  console.log('Server running on port 4001');
  console.log('Server accessible at: http://localhost:4001');
  console.log('Ngrok URL: https://bc2a6408c776.ngrok.app');
  console.log('===========================');
});