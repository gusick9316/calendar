// 메인 앱 클래스
class WazCalendarApp {
    constructor() {
        this.isInitialized = false;
        this.initialize();
    }

    // 앱 초기화
    async initialize() {
        try {
            // DOM이 로드될 때까지 대기
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('앱 초기화 오류:', error);
        }
    }

    // 앱 초기화 실행
    async initializeApp() {
        try {
            // 전역 인스턴스들이 생성될 때까지 대기
            await this.waitForInstances();
            
            // 키보드 이벤트 리스너 추가
            this.addGlobalEventListeners();
            
            // 앱 상태 확인
            this.checkAppState();
            
            this.isInitialized = true;
            console.log('와즈달력 앱이 성공적으로 초기화되었습니다.');
            
        } catch (error) {
            console.error('앱 초기화 실행 오류:', error);
            this.showErrorMessage('앱 초기화 중 오류가 발생했습니다.');
        }
    }

    // 전역 인스턴스들이 생성될 때까지 대기
    async waitForInstances() {
        const maxAttempts = 50;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            if (window.githubAPI && window.authManager && window.calendarManager && window.eventManager) {
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('필요한 인스턴스들이 생성되지 않았습니다.');
    }

    // 전역 이벤트 리스너 추가
    addGlobalEventListeners() {
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });

        // 온라인/오프라인 상태 감지
        window.addEventListener('online', () => {
            this.showMessage('인터넷 연결이 복구되었습니다.', 'success');
        });

        window.addEventListener('offline', () => {
            this.showMessage('인터넷 연결이 끊어졌습니다.', 'error');
        });

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: 새 일정 추가
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                if (window.authManager && window.authManager.isLoggedIn()) {
                    window.eventManager.showAddEventModal();
                }
            }
            
            // Ctrl/Cmd + L: 일정 목록 보기
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                if (window.authManager && window.authManager.isLoggedIn()) {
                    window.eventManager.showEventsListModal();
                }
            }
            
            // T 키: 오늘로 이동
            if (e.key === 't' || e.key === 'T') {
                if (window.authManager && window.authManager.isLoggedIn() && !this.isInputFocused()) {
                    window.calendarManager.goToToday();
                }
            }
            
            // 좌우 화살표: 월 이동
            if (e.key === 'ArrowLeft' && !this.isInputFocused()) {
                if (window.authManager && window.authManager.isLoggedIn()) {
                    window.calendarManager.previousMonth();
                }
            }
            
            if (e.key === 'ArrowRight' && !this.isInputFocused()) {
                if (window.authManager && window.authManager.isLoggedIn()) {
                    window.calendarManager.nextMonth();
                }
            }
        });
    }

    // 입력 필드에 포커스가 있는지 확인
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.contentEditable === 'true'
        );
    }

    // 모든 모달 닫기
    closeAllModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    // 앱 상태 확인
    checkAppState() {
        // GitHub API 연결 상태 확인
        this.checkGitHubConnection();
        
        // 로컬 스토리지 지원 확인
        this.checkLocalStorageSupport();
        
        // 브라우저 호환성 확인
        this.checkBrowserCompatibility();
    }

    // GitHub API 연결 상태 확인
    async checkGitHubConnection() {
        try {
            // 간단한 API 호출로 연결 상태 확인
            const response = await fetch('https://api.github.com/rate_limit');
            if (!response.ok) {
                throw new Error('GitHub API 연결 실패');
            }
        } catch (error) {
            console.warn('GitHub API 연결 확인 실패:', error);
            this.showMessage('GitHub 서버 연결에 문제가 있을 수 있습니다.', 'warning');
        }
    }

    // 로컬 스토리지 지원 확인
    checkLocalStorageSupport() {
        try {
            const testKey = 'waz-calendar-test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
        } catch (error) {
            console.warn('로컬 스토리지 지원 안됨:', error);
            this.showMessage('브라우저에서 로컬 저장소를 지원하지 않습니다. 자동 로그인 기능이 제한될 수 있습니다.', 'warning');
        }
    }

    // 브라우저 호환성 확인
    checkBrowserCompatibility() {
        // 필수 기능들 확인
        const requiredFeatures = [
            'fetch',
            'Promise',
            'localStorage',
            'addEventListener'
        ];

        const unsupportedFeatures = requiredFeatures.filter(feature => {
            return typeof window[feature] === 'undefined';
        });

        if (unsupportedFeatures.length > 0) {
            console.warn('지원되지 않는 기능들:', unsupportedFeatures);
            this.showMessage('브라우저가 일부 기능을 지원하지 않습니다. 최신 브라우저를 사용해주세요.', 'warning');
        }
    }

    // 에러 메시지 표시
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'app-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: #ff6b6b;
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 10001;
            font-weight: 600;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // 메시지 표시
    showMessage(message, type = 'info') {
        if (window.authManager) {
            window.authManager.showMessage(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // 앱 정리
    cleanup() {
        // 필요한 정리 작업 수행
        console.log('앱 정리 중...');
    }

    // 앱 정보 표시
    showAppInfo() {
        const info = {
            name: '와즈달력',
            version: '1.0.0',
            author: 'gusick9316',
            description: 'GitHub Pages 기반 개인 달력 앱'
        };
        
        console.log('=== 와즈달력 앱 정보 ===');
        console.log(`이름: ${info.name}`);
        console.log(`버전: ${info.version}`);
        console.log(`제작자: ${info.author}`);
        console.log(`설명: ${info.description}`);
        console.log('========================');
    }

    // 디버그 정보 표시
    showDebugInfo() {
        if (!this.isInitialized) {
            console.log('앱이 아직 초기화되지 않았습니다.');
            return;
        }

        console.log('=== 디버그 정보 ===');
        console.log('GitHub API:', window.githubAPI ? '연결됨' : '연결 안됨');
        console.log('인증 관리자:', window.authManager ? '활성' : '비활성');
        console.log('달력 관리자:', window.calendarManager ? '활성' : '비활성');
        console.log('일정 관리자:', window.eventManager ? '활성' : '비활성');
        
        if (window.authManager) {
            console.log('로그인 상태:', window.authManager.isLoggedIn() ? '로그인됨' : '로그아웃됨');
            if (window.authManager.isLoggedIn()) {
                const user = window.authManager.getCurrentUser();
                console.log('현재 사용자:', user.username);
            }
        }
        
        if (window.calendarManager) {
            console.log('현재 날짜:', window.calendarManager.currentDate);
            console.log('일정 개수:', window.calendarManager.events.length);
        }
        
        console.log('==================');
    }

    // 앱 재시작
    async restart() {
        console.log('앱 재시작 중...');
        this.cleanup();
        this.isInitialized = false;
        await this.initialize();
    }
}

// 전역 함수들 (디버깅용)
window.showAppInfo = () => {
    if (window.wazCalendarApp) {
        window.wazCalendarApp.showAppInfo();
    }
};

window.showDebugInfo = () => {
    if (window.wazCalendarApp) {
        window.wazCalendarApp.showDebugInfo();
    }
};

window.restartApp = () => {
    if (window.wazCalendarApp) {
        window.wazCalendarApp.restart();
    }
};

// 앱 시작
window.wazCalendarApp = new WazCalendarApp();

// 개발자 도구에서 사용할 수 있는 헬퍼 함수들
if (typeof console !== 'undefined') {
    console.log('%c와즈달력 앱이 로드되었습니다!', 'color: #667eea; font-size: 16px; font-weight: bold;');
    console.log('%c사용 가능한 명령어:', 'color: #4ecdc4; font-weight: bold;');
    console.log('- showAppInfo(): 앱 정보 표시');
    console.log('- showDebugInfo(): 디버그 정보 표시');
    console.log('- restartApp(): 앱 재시작');
}

