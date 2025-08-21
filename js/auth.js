// 인증 관리 클래스
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.accountFile = null;
        this.autoLoginDuration = 12 * 60 * 60 * 1000; // 12시간 (밀리초)
        
        this.initializeEventListeners();
        this.checkAutoLogin();
    }

    // 이벤트 리스너 초기화
    initializeEventListeners() {
        // 로그인 폼
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // 회원가입 폼
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // 화면 전환 버튼들
        const showSignupBtn = document.getElementById('showSignup');
        if (showSignupBtn) {
            showSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSignupScreen();
            });
        }

        const backToLoginBtn = document.getElementById('backToLogin');
        if (backToLoginBtn) {
            backToLoginBtn.addEventListener('click', () => this.showLoginScreen());
        }

        // 로그아웃 버튼
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // 자동 로그인 확인
    async checkAutoLogin() {
        try {
            const loginData = localStorage.getItem('wazCalendarLogin');
            if (!loginData) {
                this.showLoginScreen();
                return;
            }

            const { username, accountFile, timestamp } = JSON.parse(loginData);
            const now = Date.now();
            
            // 12시간이 지났는지 확인
            if (now - timestamp > this.autoLoginDuration) {
                localStorage.removeItem('wazCalendarLogin');
                this.showLoginScreen();
                return;
            }

            // 계정 정보 유효성 확인
            const userData = await window.githubAPI.getUserData(accountFile);
            if (userData) {
                this.currentUser = username;
                this.accountFile = accountFile;
                this.showCalendarScreen();
                this.showMessage('자동 로그인되었습니다.', 'success');
            } else {
                localStorage.removeItem('wazCalendarLogin');
                this.showLoginScreen();
            }
        } catch (error) {
            console.error('자동 로그인 확인 오류:', error);
            localStorage.removeItem('wazCalendarLogin');
            this.showLoginScreen();
        }
    }

    // 로그인 처리
    async handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!username || !password) {
            this.showError('loginError', '사용자명과 비밀번호를 입력해주세요.');
            return;
        }

        this.showLoading('loginForm');
        
        try {
            const result = await window.githubAPI.authenticateUser(username, password);
            
            if (result.success) {
                this.currentUser = username;
                this.accountFile = result.accountFile;
                
                // 자동 로그인 정보 저장
                const loginData = {
                    username: username,
                    accountFile: result.accountFile,
                    timestamp: Date.now()
                };
                localStorage.setItem('wazCalendarLogin', JSON.stringify(loginData));
                
                this.showCalendarScreen();
                this.showMessage('로그인 성공!', 'success');
            } else {
                this.showError('loginError', '사용자명 또는 비밀번호가 다릅니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            this.showError('loginError', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            this.hideLoading('loginForm');
        }
    }

    // 회원가입 처리
    async handleSignup(event) {
        event.preventDefault();
        
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        
        // 입력 유효성 검사
        if (!username || !password || !passwordConfirm) {
            this.showError('signupError', '모든 필드를 입력해주세요.');
            return;
        }

        if (password !== passwordConfirm) {
            this.showError('signupError', '비밀번호가 일치하지 않습니다.');
            return;
        }

        if (password.length < 8 || password.length > 30) {
            this.showError('signupError', '비밀번호는 8글자 이상 30글자 이하로 입력해주세요.');
            return;
        }

        // 사용자명 유효성 검사 (영문, 숫자, 언더스코어만 허용)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            this.showError('signupError', '사용자명은 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다.');
            return;
        }

        this.showLoading('signupForm');
        
        try {
            // 사용자명 중복 확인
            const usernameExists = await window.githubAPI.checkUsernameExists(username);
            if (usernameExists) {
                this.showError('signupError', '다른 사용자가 사용중인 사용자명입니다.');
                this.hideLoading('signupForm');
                return;
            }

            // 계정 생성
            await window.githubAPI.saveAccount(username, password);
            
            this.showMessage('회원가입이 완료되었습니다! 로그인해주세요.', 'success');
            this.showLoginScreen();
            
            // 로그인 폼에 사용자명 자동 입력
            document.getElementById('loginUsername').value = username;
            
        } catch (error) {
            console.error('회원가입 오류:', error);
            this.showError('signupError', '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            this.hideLoading('signupForm');
        }
    }

    // 로그아웃
    logout() {
        localStorage.removeItem('wazCalendarLogin');
        this.currentUser = null;
        this.accountFile = null;
        this.showLoginScreen();
        this.showMessage('로그아웃되었습니다.', 'info');
    }

    // 화면 전환 함수들
    showLoginScreen() {
        this.hideAllScreens();
        document.getElementById('loginScreen').classList.add('active');
        this.clearForms();
        this.clearErrors();
    }

    showSignupScreen() {
        this.hideAllScreens();
        document.getElementById('signupScreen').classList.add('active');
        this.clearForms();
        this.clearErrors();
    }

    showCalendarScreen() {
        this.hideAllScreens();
        document.getElementById('calendarScreen').classList.add('active');
        
        // 달력 초기화
        if (window.calendarManager) {
            window.calendarManager.initialize();
        }
    }

    hideAllScreens() {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
    }

    // 폼 초기화
    clearForms() {
        const forms = document.querySelectorAll('.form');
        forms.forEach(form => {
            if (form.tagName === 'FORM') {
                form.reset();
            }
        });
    }

    // 에러 메시지 초기화
    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.classList.remove('show');
            element.textContent = '';
        });
    }

    // 에러 메시지 표시
    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
            
            // 3초 후 자동 숨김
            setTimeout(() => {
                errorElement.classList.remove('show');
            }, 3000);
        }
    }

    // 성공/정보 메시지 표시 (임시 알림)
    showMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.temp-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 새 메시지 생성
        const messageElement = document.createElement('div');
        messageElement.className = `temp-message temp-message-${type}`;
        messageElement.textContent = message;
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        document.body.appendChild(messageElement);

        // 3초 후 제거
        setTimeout(() => {
            messageElement.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.remove();
                }
            }, 300);
        }, 3000);
    }

    // 로딩 상태 표시
    showLoading(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="loading"></span> 처리중...';
            }
        }
    }

    // 로딩 상태 해제
    hideLoading(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                if (formId === 'loginForm') {
                    submitBtn.textContent = '로그인';
                } else if (formId === 'signupForm') {
                    submitBtn.textContent = '가입';
                }
            }
        }
    }

    // 현재 사용자 정보 반환
    getCurrentUser() {
        return {
            username: this.currentUser,
            accountFile: this.accountFile
        };
    }

    // 로그인 상태 확인
    isLoggedIn() {
        return this.currentUser !== null && this.accountFile !== null;
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 전역 인증 관리자 인스턴스
window.authManager = new AuthManager();

