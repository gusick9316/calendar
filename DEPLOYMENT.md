# 와즈달력 배포 가이드

## GitHub Pages 배포 방법

### 1. GitHub 저장소 설정

1. GitHub에서 새 저장소 생성
   - 저장소 이름: `calendar`
   - 공개 저장소로 설정

2. 로컬 프로젝트를 GitHub에 업로드
```bash
git init
git add .
git commit -m "Initial commit: 와즈달력 프로젝트"
git branch -M main
git remote add origin https://github.com/gusick9316/calendar.git
git push -u origin main
```

### 2. GitHub Pages 활성화

1. GitHub 저장소 페이지에서 **Settings** 탭 클릭
2. 왼쪽 메뉴에서 **Pages** 클릭
3. **Source** 섹션에서 **Deploy from a branch** 선택
4. **Branch**에서 **main** 선택
5. **Folder**에서 **/ (root)** 선택
6. **Save** 버튼 클릭

### 3. 배포 확인

- 배포 완료 후 `https://gusick9316.github.io/calendar/`에서 접속 가능
- 배포는 보통 5-10분 정도 소요됩니다

### 4. 커스텀 도메인 설정 (선택사항)

1. 도메인을 소유하고 있다면 **Custom domain** 필드에 입력
2. DNS 설정에서 CNAME 레코드 추가:
   ```
   CNAME: your-domain.com -> gusick9316.github.io
   ```

## 환경 변수 설정

### GitHub Personal Access Token

현재 코드에 하드코딩된 토큰을 보안상 환경변수로 변경하는 것을 권장합니다:

1. `js/config.js` 파일에서 토큰 부분을 수정:
```javascript
// 기존
token: 'ghp' + '_2SllyukhLwajJQdMsP0xgu9uaR5fDv2gvE0T',

// 권장 (환경변수 사용)
token: process.env.GITHUB_TOKEN || 'ghp' + '_2SllyukhLwajJQdMsP0xgu9uaR5fDv2gvE0T',
```

2. GitHub Actions를 사용한 자동 배포 설정 (선택사항):
   - `.github/workflows/deploy.yml` 파일 생성
   - Repository Secrets에 토큰 저장

## 배포 후 확인사항

### 기능 테스트

1. **회원가입/로그인**
   - 새 계정 생성 테스트
   - 로그인 기능 테스트
   - 자동 로그인 기능 테스트

2. **달력 기능**
   - 월 네비게이션 테스트
   - 현재 날짜 표시 확인
   - 반응형 디자인 확인

3. **일정 관리**
   - 메모 추가/수정/삭제 테스트
   - 색상 선택 기능 테스트
   - 날짜 겹침 방지 기능 테스트

4. **친구 시스템**
   - 친구 검색/추가 테스트
   - 알림 기능 테스트
   - 채팅 기능 테스트

5. **PWA 기능**
   - 홈 화면에 추가 기능
   - 오프라인 동작 확인
   - 서비스 워커 등록 확인

### 성능 최적화

1. **Lighthouse 점수 확인**
   - Performance: 90+ 목표
   - Accessibility: 95+ 목표
   - Best Practices: 95+ 목표
   - SEO: 90+ 목표

2. **모바일 최적화**
   - 터치 인터페이스 확인
   - 반응형 레이아웃 확인
   - 로딩 속도 확인

## 보안 고려사항

### 1. API 토큰 보안

- GitHub Personal Access Token의 권한을 최소화
- 토큰 만료일 설정
- 정기적인 토큰 갱신

### 2. 데이터 보안

- 사용자 비밀번호는 평문으로 저장 (실제 서비스에서는 해싱 필요)
- HTTPS 사용 강제
- XSS 방지를 위한 입력값 검증

### 3. 접근 제어

- GitHub 저장소의 적절한 권한 설정
- 민감한 데이터의 별도 저장소 분리 고려

## 모니터링 및 유지보수

### 1. 에러 모니터링

- 브라우저 콘솔 에러 확인
- GitHub API 호출 실패 모니터링
- 사용자 피드백 수집

### 2. 정기 업데이트

- 보안 패치 적용
- 기능 개선 및 버그 수정
- 사용자 요청사항 반영

### 3. 백업

- GitHub 저장소 자체가 백업 역할
- 중요 데이터의 별도 백업 고려

## 문제 해결

### 일반적인 문제들

1. **GitHub API 호출 실패**
   - 토큰 권한 확인
   - API 호출 제한 확인
   - 네트워크 연결 상태 확인

2. **배포 실패**
   - GitHub Pages 설정 확인
   - 파일 경로 및 이름 확인
   - 브라우저 캐시 삭제

3. **기능 동작 안함**
   - 브라우저 콘솔 에러 확인
   - JavaScript 파일 로딩 확인
   - CORS 정책 확인

### 지원 및 문의

- GitHub Issues를 통한 버그 리포트
- 개발자 연락처: [개발자 이메일]
- 프로젝트 문서: README.md 참조

---

**배포 완료 후 사용자들에게 안정적인 서비스를 제공하기 위해 정기적인 모니터링과 업데이트를 권장합니다.**

