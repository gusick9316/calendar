// 인증 관리 클래스
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userFilename = null;
        this.userSha = null;
        this.init();
    }

    // 초기화
    init() {
        this.setupEventListeners();
        this.checkAutoLogin();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 로그인 폼
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // 회원가입 폼
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignup();
        });

        // 화면 전환 버튼
        document.getElementById('showSignup').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupScreen();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginScreen();
        });

        // 로그아웃 버튼
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
    }

    // 자동 로그인 확인
    async checkAutoLogin() {
        const savedUser = localStorage.getItem(STORAGE_KEYS.currentUser);
        const loginTime = localStorage.getItem(STORAGE_KEYS.loginTime);

        if (savedUser && loginTime) {
            const timeDiff = Date.now() - parseInt(loginTime);
            
            // 12시간이 지나지 않았으면 자동 로그인
            if (timeDiff < APP_CONFIG.autoLoginDuration) {
                try {
                    showLoading(true);
                    const userData = JSON.parse(savedUser);
                    
                    // GitHub에서 최신 사용자 데이터 가져오기
                    const accountData = await githubAPI.verifyUserAccount(userData.username, userData.password);
                    
                    if (accountData) {
                        this.currentUser = accountData.data;
                        this.userFilename = accountData.filename;
                        this.userSha = accountData.sha;
                        this.showCalendarScreen();
                        showToast('자동 로그인되었습니다.', 'success');
                    } else {
                        this.clearAutoLogin();
                    }
                } catch (error) {
                    console.error('자동 로그인 오류:', error);
                    this.clearAutoLogin();
                } finally {
                    showLoading(false);
                }
            } else {
                this.clearAutoLogin();
            }
        }
    }

    // 자동 로그인 정보 삭제
    clearAutoLogin() {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        localStorage.removeItem(STORAGE_KEYS.loginTime);
        this.showLoginScreen();
    }

    // 로그인 처리
    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            showToast('사용자명과 비밀번호를 입력해주세요.', 'error');
            return;
        }

        try {
            showLoading(true);
            
            const accountData = await githubAPI.verifyUserAccount(username, password);
            
            if (accountData) {
                this.currentUser = accountData.data;
                this.userFilename = accountData.filename;
                this.userSha = accountData.sha;
                
                // 자동 로그인 정보 저장
                localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify({
                    username: username,
                    password: password
                }));
                localStorage.setItem(STORAGE_KEYS.loginTime, Date.now().toString());
                
                this.showCalendarScreen();
                showToast('로그인되었습니다.', 'success');
            } else {
                showToast('사용자명 또는 비밀번호가 다릅니다.', 'error');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            showToast('로그인 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // 회원가입 처리
    async handleSignup() {
        const username = document.getElementById('signupUsername').value.trim();
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

        // 유효성 검사
        if (!username || !password || !passwordConfirm) {
            showToast('모든 필드를 입력해주세요.', 'error');
            return;
        }

        if (password !== passwordConfirm) {
            showToast('비밀번호가 일치하지 않습니다.', 'error');
            return;
        }

        if (password.length < APP_CONFIG.passwordMinLength || password.length > APP_CONFIG.passwordMaxLength) {
            showToast(`비밀번호는 ${APP_CONFIG.passwordMinLength}-${APP_CONFIG.passwordMaxLength}자 사이여야 합니다.`, 'error');
            return;
        }

        // 사용자명 유효성 검사 (영문, 숫자, 언더스코어만 허용)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showToast('사용자명은 영문, 숫자, 언더스코어만 사용할 수 있습니다.', 'error');
            return;
        }

        try {
            showLoading(true);
            
            // 사용자명 중복 확인
            const usernameExists = await githubAPI.checkUsernameExists(username);
            
            if (usernameExists) {
                showToast('다른 사용자가 사용중인 사용자명입니다.', 'error');
                return;
            }

            // 계정 생성
            const filename = await githubAPI.createUserAccount(username, password);
            
            showToast('계정이 생성되었습니다. 로그인해주세요.', 'success');
            this.showLoginScreen();
            
            // 로그인 폼에 사용자명 자동 입력
            document.getElementById('loginUsername').value = username;
            
        } catch (error) {
            console.error('회원가입 오류:', error);
            showToast('회원가입 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // 로그아웃
    logout() {
        this.currentUser = null;
        this.userFilename = null;
        this.userSha = null;
        
        // 자동 로그인 정보 삭제
        this.clearAutoLogin();
        
        // 폼 초기화
        document.getElementById('loginForm').reset();
        document.getElementById('signupForm').reset();
        
        showToast('로그아웃되었습니다.', 'success');
    }

    // 로그인 화면 표시
    showLoginScreen() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('loginScreen').classList.add('active');
    }

    // 회원가입 화면 표시
    showSignupScreen() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('signupScreen').classList.add('active');
    }

    // 달력 화면 표시
    showCalendarScreen() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById('calendarScreen').classList.add('active');
        
        // 사용자 정보 표시
        document.getElementById('currentUser').textContent = `${this.currentUser.username}님`;
        
        // 달력 초기화
        if (window.calendarManager) {
            window.calendarManager.init();
        }
    }

    // 사용자 데이터 업데이트
    async updateUserData() {
        if (this.currentUser && this.userFilename) {
            try {
                await githubAPI.updateUserData(this.userFilename, this.currentUser);
            } catch (error) {
                console.error('사용자 데이터 업데이트 오류:', error);
                throw error;
            }
        }
    }

    // 현재 사용자 정보 가져오기
    getCurrentUser() {
        return this.currentUser;
    }

    // 로그인 상태 확인
    isLoggedIn() {
        return this.currentUser !== null;
    }
}

// 유틸리티 함수들
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.add('active');
    } else {
        spinner.classList.remove('active');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 인증 관리자 인스턴스 생성
const authManager = new AuthManager();

