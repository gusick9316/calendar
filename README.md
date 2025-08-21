# 와즈달력 (Waz Calendar)

심플하고 직관적인 웹 기반 달력 애플리케이션입니다.

## 주요 기능

### 📅 달력 기능
- 월별 달력 보기
- 현재 날짜 표시
- 월/년 네비게이션
- 반응형 디자인 (모바일/태블릿/데스크톱 지원)

### 👤 사용자 관리
- 회원가입 및 로그인
- 자동 로그인 (12시간 유지)
- 사용자명 중복 검사
- 비밀번호 유효성 검사 (8-30자)

### 📝 일정 관리
- 일정 추가/수정/삭제
- 날짜 범위 선택
- 8가지 색상 선택
- 메모 내용 (50자 제한)
- 일정 목록 보기
- 날짜 겹침 방지

### 👥 친구 시스템
- 친구 검색 및 추가
- 친구 요청 알림
- 친구 목록 관리
- 친구 삭제

### 💬 채팅 기능
- 개인 채팅 (150자 제한)
- 실시간 메시지 전송
- 채팅 알림
- 일정 공유 기능

### 🎨 UI/UX
- 심플하고 부드러운 디자인
- 월별 배경 이미지 (계절별)
- 투명도 조절
- 키보드 단축키 지원
- 접근성 고려

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: GitHub API (JSON 파일 저장)
- **Deployment**: GitHub Pages
- **Design**: 반응형 웹 디자인

## 키보드 단축키

- `Ctrl + N`: 새 메모 추가
- `Ctrl + L`: 메모 목록 보기
- `Ctrl + F`: 친구 목록 보기
- `Alt + ←/→`: 이전/다음 월
- `Alt + Home`: 오늘로 이동
- `ESC`: 모달 닫기

## 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/gusick9316/calendar.git
cd calendar
```

2. 웹 서버에서 실행
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .
```

3. 브라우저에서 `http://localhost:8000` 접속

## 배포

GitHub Pages를 통해 자동 배포됩니다.

## 데이터 저장

모든 사용자 데이터는 GitHub 저장소에 JSON 형태로 저장됩니다:

- `accounts/`: 사용자 계정 정보
- `chats/`: 채팅 메시지
- `calendar/01-12/`: 월별 배경 이미지

## 보안

- GitHub Personal Access Token을 통한 API 인증
- 클라이언트 사이드 데이터 검증
- XSS 방지를 위한 HTML 이스케이프

## 라이선스

MIT License

## 개발자

Manus AI

---

**와즈달력**으로 일정을 효율적으로 관리하고 친구들과 소통하세요! 🎉

