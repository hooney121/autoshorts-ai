const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ffmpeg 실행 파일 경로를 명시적으로 지정 (설치 경로에 맞게 수정)
ffmpeg.setFfmpegPath('C:/ffmpeg/bin/ffmpeg.exe');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));
const upload = multer({ dest: 'uploads/' });

app.post('/generate-video', upload.array('images', 6), async (req, res) => {
  try {
    // 이미지 업로드 유효성 검사
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '이미지가 업로드되지 않았습니다.' });
    }

    const outputPath = path.join('outputs', `${uuidv4()}.mp4`);
    if (!fs.existsSync('outputs')) fs.mkdirSync('outputs');
    const command = ffmpeg();

    req.files.forEach(file => command.input(file.path));

    command
      .on('end', () => {
        res.download(outputPath, () => {
          fs.unlinkSync(outputPath);
          req.files.forEach(file => fs.unlinkSync(file.path));
        });
      })
      .on('error', err => {
        // 에러 발생 시 입력 파일 로그 추가
        console.error('ffmpeg error:', err.message, 'input files:', req.files.map(f => f.path));
        res.status(500).json({ error: '영상 생성 중 오류가 발생했습니다: ' + err.message });
      })
      .save(outputPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, '0.0.0.0', () => {
  console.log('Video server running on port 4000');
});