const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ffmpeg 실행 파일 경로를 명시적으로 지정 (설치 경로에 맞게 수정)
ffmpeg.setFfmpegPath('C:/Users/User/Desktop/news/ffmpeg.exe');

const app = express();
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
  { name: 'titleSubtitles', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      return res.status(400).json({ error: '이미지가 업로드되지 않았습니다.' });
    }

    // outputs 폴더를 C:/Users/User/Desktop/outputs로 고정
    const outputsDir = 'C:/Users/User/Desktop/outputs';
    if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir);
    let outputPath = path.join(outputsDir, `${uuidv4()}.mp4`);

    const command = ffmpeg();

    // uploadsDir를 절대경로로
    // const uploadsDir = path.resolve('uploads'); // 필요시 사용

    // 각 파일의 경로를 절대경로로 변환
    const imageFiles = req.files.images.map(file => ({ ...file, path: path.resolve(file.path) }));
    const audioFile = req.files.audio && req.files.audio[0] ? { ...req.files.audio[0], path: path.resolve(req.files.audio[0].path) } : null;
    const subtitleFile = req.files.subtitles && req.files.subtitles[0] ? { ...req.files.subtitles[0], path: path.resolve(req.files.subtitles[0].path) } : null;
    const titleSubtitleFile = req.files.titleSubtitles && req.files.titleSubtitles[0] ? { ...req.files.titleSubtitles[0], path: path.resolve(req.files.titleSubtitles[0].path) } : null;

    imageFiles.forEach(file => command.input(file.path));
    if (audioFile) command.input(audioFile.path);

    // 이미지 전환 시간 계산 (오디오 길이를 이미지 수로 나눔)
    const audioDuration = 60; // 예상 오디오 길이 (초)
    const imageCount = imageFiles.length;
    const transitionDuration = audioDuration / imageCount;

    let filterComplex = '';
    filterComplex += imageFiles.map((_, i) =>
      `[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}];`
    ).join('');
    filterComplex += imageFiles.map((_, i) => `[v${i}]`).join('') + `concat=n=${imageCount}:v=1:a=0[outv];`;

    let lastVideoLabel = '[outv]';
    if (subtitleFile && subtitleFile.size > 100) {
      const subtitlePathForFilter = subtitleFile.path.replace(/\\/g, '/');
      filterComplex += `${lastVideoLabel}subtitles='${subtitlePathForFilter}':force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=1'[v1];`;
      lastVideoLabel = '[v1]';
    }
    if (titleSubtitleFile && titleSubtitleFile.size > 100) {
      const titleSubtitlePathForFilter = titleSubtitleFile.path.replace(/\\/g, '/');
      filterComplex += `${lastVideoLabel}subtitles='${titleSubtitlePathForFilter}':force_style='FontName=Arial,FontSize=36,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=2'[v2];`;
      lastVideoLabel = '[v2]';
    }

    // 오디오 입력 인덱스 계산 (이미지 개수만큼 입력 후 오디오)
    const audioInputIndex = imageFiles.length;

    command
      .on('start', commandLine => {
        console.log('Spawned FFmpeg with command:', commandLine);
      })
      .on('end', () => {
        res.download(outputPath, () => {
          fs.unlinkSync(outputPath);
          Object.values(req.files).forEach(files => {
            files.forEach(file => fs.unlinkSync(file.path));
          });
        });
      })
      .on('error', err => {
        console.error('ffmpeg error:', err.message, 'input files:', req.files);
        res.status(500).json({ error: '영상 생성 중 오류가 발생했습니다: ' + err.message });
      })
      .videoCodec('libx264')
      .videoBitrate('2000k')
      // .size('1080x1920') // filter_complex에서만 스케일 적용
      .fps(30)
      .audioCodec('aac')
      .audioBitrate('192k')
      .complexFilter(filterComplex, [lastVideoLabel.replace(/\[|\]/g, '')])
      .outputOptions(`-map ${audioInputIndex}:a`)
      .save(outputPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, '0.0.0.0', () => {
  console.log('Video server running on port 4000');
});