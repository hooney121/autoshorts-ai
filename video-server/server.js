const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const os = require('os');

// ffmpeg 실행 파일 경로를 명시적으로 지정 (설치 경로에 맞게 수정)
ffmpeg.setFfmpegPath('C:/Users/User/Desktop/news/ffmpeg.exe');

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
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({ storage });

app.post('/generate-video', upload.fields([
  { name: 'images', maxCount: 6 },
  { name: 'audio', maxCount: 1 },
  { name: 'subtitles', maxCount: 1 },
  { name: 'title', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ error: '이미지가 업로드되지 않았습니다.' });
    }

    // 임시 폴더 생성
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-images-'));
    const imagesNeeded = 6;
    let allImages = req.files.images.map((file, idx) => {
      const dest = path.join(tempDir, `${idx + 1}.jpg`);
      fs.copyFileSync(file.path, dest);
      return dest;
    });

    // 부족한 이미지는 Unsplash에서 다운로드
    for (let i = allImages.length; i < imagesNeeded; i++) {
      const url = `https://source.unsplash.com/random/1080x1920?sig=${i}`;
      const dest = path.join(tempDir, `${i + 1}.jpg`);
      const response = await axios({ url, responseType: 'stream' });
      await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(dest);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      allImages.push(dest);
    }

    // 오디오 파일 준비
    const audioFile = req.files.audio && req.files.audio[0] ? path.resolve(req.files.audio[0].path) : null;
    if (!audioFile) {
      return res.status(400).json({ error: '오디오 파일이 업로드되지 않았습니다.' });
    }

    // outputs 폴더를 C:/Users/User/Desktop/outputs로 고정
    const outputsDir = 'C:/Users/User/Desktop/outputs';
    if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir);
    const firstOutputPath = path.join(outputsDir, `${uuidv4()}-no-subs.mp4`);
    const finalOutputPath = path.join(outputsDir, `${uuidv4()}.mp4`);

    // 1차: 슬라이드쇼 + 오디오 영상 생성
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(path.join(tempDir, '%d.jpg'))
        .input(audioFile)
        .inputOptions(['-framerate 1'])
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions('-shortest')
        .on('end', resolve)
        .on('error', reject)
        .save(firstOutputPath);
    });

    // 2차: 자막 입히기 (있을 때만)
    let outputPath = firstOutputPath;
    const subtitleFile = req.files.subtitles && req.files.subtitles[0] ? path.resolve(req.files.subtitles[0].path) : null;
    if (subtitleFile && fs.statSync(subtitleFile).size > 100) {
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(firstOutputPath)
          .outputOptions([`-vf subtitles='${subtitleFile.replace(/\\/g, '/')}':force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=1'`])
          .on('end', resolve)
          .on('error', reject)
          .save(finalOutputPath);
      });
      outputPath = finalOutputPath;
    }

    // 결과 파일 전송 및 임시 파일 정리
    res.download(outputPath, () => {
      try {
        fs.unlinkSync(firstOutputPath);
        if (outputPath !== firstOutputPath) fs.unlinkSync(finalOutputPath);
        allImages.forEach(img => fs.unlinkSync(img));
        fs.rmdirSync(tempDir);
        Object.values(req.files).forEach(files => {
          files.forEach(file => fs.unlinkSync(file.path));
        });
      } catch (e) { /* 무시 */ }
    });
  } catch (err) {
    console.error("Error processing video:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, '0.0.0.0', () => {
  console.log('Video server running on port 4000');
});