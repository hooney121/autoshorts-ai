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
  origin: ['https://autoshortsai.vercel.app', 'http://localhost:3000'],
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
    // Using the detailed 60-second script prompt from the backup file.
    const response = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
            {
                role: "system",
                content: `아래 뉴스 기사를 유튜브 쇼츠용 60초 스크립트로 한국어로 요약해줘. 캐주얼하고 명확한 말투로 작성해줘. 총 8~10문장, 각 문장은 5초 이내로 말할 수 있게 짧고 임팩트 있게 작성해. 문장마다 줄바꿈(엔터)으로 구분해줘. 번호나 순서를 표시하지 말고, 순수 텍스트만 작성해줘. 실제 뉴스 대본처럼 자연스럽게 이어지게 해줘.`
            },
            {
                role: "user",
                content: articleContent,
            },
        ],
        max_tokens: 1000, // Increased max_tokens for a longer script
    });
    return response.choices[0].message.content.trim();
}

async function generateSpeech(script) {
    // The previous voice ID ('z9fAnlkpzviPz146aXkP') was not found.
    // Using a standard, widely available voice ID "Rachel" instead.
    const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; 

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

    let srtContent = "";
    transcription.segments.forEach((segment, index) => {
        const start = new Date(segment.start * 1000).toISOString().substr(11, 12).replace('.', ',');
        const end = new Date(segment.end * 1000).toISOString().substr(11, 12).replace('.', ',');
        srtContent += `${index + 1}\n${start} --> ${end}\n${segment.text.trim()}\n\n`;
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
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=${count}&orientation=portrait&client_id=${process.env.UNSPLASH_ACCESS_KEY}`);
        if (!response.ok) {
            throw new Error(`Unsplash API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.results.map(photo => photo.urls.regular);
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);
        return [];
    }
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
    console.log("Received request to /generate-video");
    
    // Add detailed logging to inspect the incoming request
    console.log("--- Inspector ---");
    console.log("req.body (text fields):", JSON.stringify(req.body, null, 2));
    console.log("req.files (file fields):", req.files);
    console.log("-----------------");

    const { newsUrl, title } = req.body;
    
    if (!newsUrl || !title) {
        console.log("Validation failed: News URL or title is missing.");
        return res.status(400).json({ error: 'News URL and title are required.' });
    }

    console.log(`[DATA] Received URL: ${newsUrl}, Title: ${title}`);

    let tempDir; // Declare here to be accessible in the final catch block

    try {
        console.log("[SETUP] Attempting to create temp directory...");
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-session-'));
        console.log(`[SETUP] Temp directory created at: ${tempDir}`);

        console.log("[STEP 1/7] Extracting article content...");
        const articleContent = await extractArticleContent(newsUrl);
        console.log("[STEP 1/7] Article content extracted successfully.");

        console.log("[STEP 2/7] Generating script...");
        const script = await generateScript(articleContent, title);
        console.log(`[STEP 2/7] Script generated: ${script.substring(0, 50)}...`);

        console.log("[STEP 3/7] Generating speech...");
        const audioBuffer = await generateSpeech(script);
        const audioFilePath = path.join(tempDir, 'audio.mp3');
        fs.writeFileSync(audioFilePath, audioBuffer);
        console.log("[STEP 3/7] Speech generated and saved.");

        console.log("[STEP 4/7] Generating subtitles...");
        const srtContent = await generateSubtitles(audioBuffer);
        const srtFilePath = path.join(tempDir, 'subtitles.srt');
        fs.writeFileSync(srtFilePath, srtContent);
        console.log("[STEP 4/7] Subtitles generated and saved.");
        
        console.log("[STEP 5/7] Preparing images...");
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
        
        console.log("[STEP 6/7] Starting FFMPEG video generation (using backup file logic)...");
        const finalOutputPath = path.join('C:/Users/User/Desktop/outputs', `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`);
        if (!fs.existsSync('C:/Users/User/Desktop/outputs')) {
            fs.mkdirSync('C:/Users/User/Desktop/outputs');
        }

        await new Promise((resolve, reject) => {
            // --- Start of logic from backup file ---

            // 1. Create a separate subtitle file for the main title
            const titleSubtitleContent = `1\n00:00:00,000 --> 00:59:59,999\n${title}`;
            const titleSubsPath = path.join(tempDir, 'title_subs.srt');
            fs.writeFileSync(titleSubsPath, titleSubtitleContent, { encoding: 'utf8' });

            // 2. Escape paths for the FFMPEG filter
            const escapePath = (p) => p.replace(/\\/g, '/').replace(/:/g, '\\:');
            const escapedSubsPath = escapePath(srtFilePath);
            const escapedTitleSubsPath = escapePath(titleSubsPath);

            // 3. Construct the complex filter from the backup file
            const imageDuration = 10; // Each image is set to a long duration
            const nImages = imagePaths.length;
            const filter = [
                ...imagePaths.map((_, i) => `color=black:s=1080x1920[topbg${i}]`),
                ...imagePaths.map((_, i) => `color=black:s=1080x640[botbg${i}]`),
                ...imagePaths.map((_, i) => `[${i}:v]scale=1080:640[midimg${i}]`),
                ...imagePaths.map((_, i) => `[topbg${i}][midimg${i}]overlay=0:640:shortest=1[redimg${i}]`),
                ...imagePaths.map((_, i) => `[redimg${i}][botbg${i}]overlay=0:1280:shortest=1,scale=1080:1920,setsar=1[finalbg${i}]`),
                imagePaths.map((_, i) => `[finalbg${i}]`).join('') + `concat=n=${nImages}:v=1:a=0[bgv]`,
                `[bgv]subtitles='${escapedTitleSubsPath}':charenc=UTF-8:force_style='FontName=Noto Sans,FontSize=15,PrimaryColour=&H0000FF&,OutlineColour=&H000000&,Outline=2,Shadow=1,Alignment=2,MarginV=200' [withtitle]`,
                `[withtitle]subtitles='${escapedSubsPath}':charenc=UTF-8:force_style='FontName=Noto Sans,FontSize=10,PrimaryColour=&H00FFFFFF&,OutlineColour=&H000000&,Outline=2,Shadow=1,Alignment=2,MarginV=40' [v]`
            ].join(';');
            
            // 4. Create the ffmpeg command instance
            const ffmpegCommand = ffmpeg();
            
            // Add each image as a looped input with a fixed duration
            imagePaths.forEach((imgPath) => {
                ffmpegCommand.input(imgPath).inputOptions(['-loop 1', `-t ${imageDuration}`]);
            });

            // Add the audio as the last input
            ffmpegCommand.input(audioFilePath);

            // 5. Execute the command with options from the backup file
            ffmpegCommand
                .complexFilter(filter)
                .outputOptions([
                    '-map [v]',
                    `-map ${nImages}:a`, // Dynamically map the audio stream
                    '-c:v', 'libx264',
                    '-tune', 'stillimage',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-pix_fmt', 'yuv420p',
                    '-shortest' // Use audio length to determine final video length
                ])
                .on('start', (commandLine) => {
                    console.log('ffmpeg command:', commandLine);
                })
                .on('stderr', (line) => { console.log('ffmpeg stderr:', line); }) // Add detailed logs
                .on('end', () => {
                    console.log('[STEP 6/7] Video generation finished (backup logic).');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('ffmpeg error (backup logic):', err.message);
                    reject(err);
                })
                .save(finalOutputPath);
            
            // --- End of logic from backup file ---
        });

        console.log("[STEP 7/7] Sending video to client...");
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

app.listen(4000, '0.0.0.0', () => {
  console.log('Video server running on port 4000');
});