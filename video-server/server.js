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
    cb(null, path.join(__dirname, 'uploads'));
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
      const sourcePath = file.path; // multer가 저장한 실제 파일 경로
      const dest = path.join(tempDir, `${idx + 1}.jpg`);
      fs.copyFileSync(sourcePath, dest);
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
    const finalOutputPath = path.join(outputsDir, `${uuidv4()}.mp4`);

    // 영상 생성 (이미지, 오디오, 자막을 한 번에 처리)
    await new Promise((resolve, reject) => {
      // 1. ffmpeg concat demuxer를 위한 파일 리스트 생성
      const filelistPath = path.join(tempDir, 'filelist.txt');
      const imageDuration = 3; // 각 이미지 노출 시간 (초), framerate 1/3와 동일
      const fileContent = allImages.map(imgPath => {
          // Windows 경로('\\')를 ffmpeg가 인식할 수 있도록 '/'로 변경
          const ffmpegPath = imgPath.replace(/\\/g, '/');
          return `file '${ffmpegPath}'\nduration ${imageDuration}`;
      }).join('\n');
      fs.writeFileSync(filelistPath, fileContent);

      const command = ffmpeg();

      // 입력: 이미지 시퀀스 (concat demuxer 사용)
      command.input(filelistPath).inputOptions(['-f', 'concat', '-safe', '0']);
      
      // 입력: 오디오 (절대 경로 사용)
      command.input(audioFile);

      // 자막과 해상도 조절 필터 복원
      const subtitleFile = req.files.subtitles && req.files.subtitles[0] ? req.files.subtitles[0] : null;
      const filters = [];
      if (subtitleFile) {
        // 자막 파일을 임시 폴더로 옮김
        const srtName = 'subtitles.srt';
        const srtTempPath = path.join(tempDir, srtName);
        fs.renameSync(subtitleFile.path, srtTempPath);

        // Windows 경로를 ffmpeg 필터에 맞게 이스케이프
        const escapedSrtPath = srtTempPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:');
        filters.push(`subtitles=${escapedSrtPath}:force_style='FontName=Arial,FontSize=24,PrimaryColour=&HFFFFFF,OutlineColour=&H000000,Outline=1'`);
      }
      // 해상도 조절 필터 추가
      filters.push('scale=1080:1920');
      // 복합 필터를 사용하여 필터 체인 직접 구성
      command.complexFilter(`[0:v]${filters.join(',')}[v]`);

      command
        .outputOptions([
          '-map', '[v]',      // 필터링된 비디오 스트림 선택
          '-map', '1:a',      // 원본 오디오 스트림 선택
          '-c:v', 'libx264',  
          '-c:a', 'aac',      
          '-pix_fmt', 'yuv420p',
          '-shortest'
        ])
        .on('start', (commandLine) => {
          console.log('ffmpeg command:', commandLine);
        })
        .on('end', resolve)
        .on('error', (err) => {
          console.error('ffmpeg final video error:', err.message);
          reject(err);
        })
        .save(finalOutputPath)
        .run(); // ffmpeg 실행
    });
    
    // 결과 파일 전송 및 임시 파일 정리
    res.download(finalOutputPath, (err) => {
      if (err) {
        console.error('Download error:', err);
      }
      
      // 파일 핸들이 해제될 시간을 주기 위해 약간의 딜레이 후 정리
      setTimeout(() => {
        try {
          // 임시 폴더와 그 안의 파일들을 삭제 (최신 방식으로 변경)
          fs.rmSync(tempDir, { recursive: true, force: true });
          // multer가 업로드한 원본 파일들 삭제
          Object.values(req.files).forEach(files => {
            files.forEach(file => {
              try {
                fs.unlinkSync(file.path);
              } catch (e) { /* 무시 */ }
            });
          });
           // 최종 비디오 파일 삭제
          fs.unlinkSync(finalOutputPath);
        } catch (e) { 
          console.error('Cleanup error:', e);
        }
      }, 500); // 0.5초 딜레이
    });
  } catch (err) {
    console.error("Error processing video:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, '0.0.0.0', () => {
  console.log('Video server running on port 4000');
});