# NewsToShorts.ai

기사 URL을 입력하면 AI가 자동으로 유튜브 쇼츠를 생성해주는 웹 서비스입니다.

## 주요 기능

- 기사 URL에서 본문 자동 추출
- GPT-4를 활용한 60초 스크립트 생성
- ElevenLabs AI 음성 합성
- 자동 자막 생성
- FFmpeg를 활용한 영상 합성

## 기술 스택

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Node.js + Express
- **AI 텍스트 요약**: OpenAI GPT-4
- **음성 생성**: ElevenLabs API
- **자막 처리**: Whisper API
- **영상 합성**: FFmpeg

## 시작하기

1. 저장소 클론
```bash
git clone https://github.com/yourusername/newstoshorts.git
cd newstoshorts
```

2. 의존성 설치 1
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정합니다:
```
OPENAI_API_KEY=your_openai_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 확인
```
http://localhost:3000
```

## 사용 방법

1. 메인 페이지에서 "쇼츠 만들기 시작하기" 버튼 클릭
2. 기사 URL 입력
3. "쇼츠 생성하기" 버튼 클릭
4. 생성된 영상 미리보기 및 다운로드

## 라이선스

MIT License
