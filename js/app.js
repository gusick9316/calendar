// 메인 애플리케이션 클래스
class WazCalendarApp {
    constructor() {
        this.init();
    }

    // 애플리케이션 초기화
    init() {
        // DOM이 로드된 후 실행
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.onDOMReady();
            });
        } else {
            this.onDOMReady();
        }
    }

    // DOM 준비 완료 후 실행
    onDOMReady() {
        console.log('와즈달력 애플리케이션 시작');
        
        // 전역 에러 핸들러 설정
        this.setupGlobalErrorHandlers();
        
        // 알림 배지 업데이트 주기적 실행
        this.startNotificationUpdater();
        
        // 키보드 단축키 설정
        this.setupKeyboardShortcuts();
        
        // 서비스 워커 등록 (오프라인 지원)
        this.registerServiceWorker();
        
        console.log('와즈달력 애플리케이션 초기화 완료');
    }

    // 전역 에러 핸들러 설정
    setupGlobalErrorHandlers() {
        // JavaScript 에러 처리
        window.addEventListener('error', (event) => {
            console.error('전역 에러:', event.error);
            showToast('예상치 못한 오류가 발생했습니다.', 'error');
        });

        // Promise rejection 처리
        window.addEventListener('unhandledrejection', (event) => {
            console.error('처리되지 않은 Promise 거부:', event.reason);
            showToast('네트워크 오류가 발생했습니다.', 'error');
        });

        // 네트워크 상태 모니터링
        window.addEventListener('online', () => {
            showToast('인터넷 연결이 복구되었습니다.', 'success');
        });

        window.addEventListener('offline', () => {
            showToast('인터넷 연결이 끊어졌습니다.', 'error');
        });
    }

    // 알림 배지 업데이트
    startNotificationUpdater() {
        // 5분마다 알림 확인
        setInterval(() => {
            if (authManager.isLoggedIn() && window.friendsManager) {
                window.friendsManager.updateNotificationBadge();
            }
        }, 5 * 60 * 1000);

        // 초기 업데이트
        setTimeout(() => {
            if (authManager.isLoggedIn() && window.friendsManager) {
                window.friendsManager.updateNotificationBadge();
            }
        }, 2000);
    }

    // 키보드 단축키 설정
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + 키 조합
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case 'n':
                        event.preventDefault();
                        if (authManager.isLoggedIn() && window.memoManager) {
                            window.memoManager.openMemoModal();
                        }
                        break;
                    case 'l':
                        event.preventDefault();
                        if (authManager.isLoggedIn() && window.memoManager) {
                            window.memoManager.openMemoListModal();
                        }
                        break;
                    case 'f':
                        event.preventDefault();
                        if (authManager.isLoggedIn() && window.friendsManager) {
                            window.friendsManager.openFriendsModal();
                        }
                        break;
                }
            }

            // ESC 키로 모달 닫기
            if (event.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    activeModal.classList.remove('active');
                }
            }

            // 화살표 키로 월 네비게이션
            if (authManager.isLoggedIn() && window.calendarManager) {
                if (event.key === 'ArrowLeft' && event.altKey) {
                    event.preventDefault();
                    window.calendarManager.previousMonth();
                } else if (event.key === 'ArrowRight' && event.altKey) {
                    event.preventDefault();
                    window.calendarManager.nextMonth();
                } else if (event.key === 'Home' && event.altKey) {
                    event.preventDefault();
                    window.calendarManager.goToToday();
                }
            }
        });
    }

    // 서비스 워커 등록
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('서비스 워커 등록 성공:', registration);
                })
                .catch((error) => {
                    console.log('서비스 워커 등록 실패:', error);
                });
        }
    }

    // 애플리케이션 정보 표시
    showAppInfo() {
        const info = `
와즈달력 v1.0
개발자: Manus AI
기능:
- 사용자 계정 관리
- 달력 및 일정 관리
- 친구 시스템
- 실시간 채팅
- 일정 공유

키보드 단축키:
- Ctrl+N: 새 메모 추가
- Ctrl+L: 메모 목록 보기
- Ctrl+F: 친구 목록 보기
- Alt+←/→: 이전/다음 월
- Alt+Home: 오늘로 이동
- ESC: 모달 닫기
        `;
        
        alert(info);
    }

    // 데이터 백업
    async backupUserData() {
        if (!authManager.isLoggedIn()) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }

        try {
            const user = authManager.getCurrentUser();
            const backupData = {
                username: user.username,
                memos: user.memos || [],
                friends: user.friends || [],
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `waz-calendar-backup-${user.username}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            showToast('데이터 백업이 완료되었습니다.', 'success');

        } catch (error) {
            console.error('데이터 백업 오류:', error);
            showToast('데이터 백업 중 오류가 발생했습니다.', 'error');
        }
    }

    // 데이터 복원
    async restoreUserData(file) {
        if (!authManager.isLoggedIn()) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }

        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            
            if (!backupData.version || !backupData.memos) {
                throw new Error('올바르지 않은 백업 파일입니다.');
            }

            const user = authManager.getCurrentUser();
            
            // 데이터 복원 확인
            if (!confirm('기존 데이터가 모두 삭제되고 백업 데이터로 복원됩니다. 계속하시겠습니까?')) {
                return;
            }

            user.memos = backupData.memos || [];
            
            await authManager.updateUserData();
            
            if (window.calendarManager) {
                window.calendarManager.refresh();
            }
            
            showToast('데이터 복원이 완료되었습니다.', 'success');

        } catch (error) {
            console.error('데이터 복원 오류:', error);
            showToast('데이터 복원 중 오류가 발생했습니다.', 'error');
        }
    }

    // 테마 변경
    changeTheme(theme) {
        document.body.className = `theme-${theme}`;
        localStorage.setItem('waz_calendar_theme', theme);
    }

    // 저장된 테마 로드
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('waz_calendar_theme') || 'default';
        this.changeTheme(savedTheme);
    }

    // 애플리케이션 상태 확인
    getAppStatus() {
        return {
            isLoggedIn: authManager.isLoggedIn(),
            currentUser: authManager.getCurrentUser()?.username,
            version: '1.0',
            lastUpdate: new Date().toISOString()
        };
    }
}

// 유틸리티 함수들
const utils = {
    // 날짜 포맷팅
    formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    },

    // 시간 포맷팅
    formatTime(date) {
        return new Date(date).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // 상대 시간 표시
    getRelativeTime(date) {
        const now = new Date();
        const target = new Date(date);
        const diffMs = now - target;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '방금 전';
        if (diffMins < 60) return `${diffMins}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        if (diffDays < 7) return `${diffDays}일 전`;
        
        return target.toLocaleDateString('ko-KR');
    },

    // 색상 밝기 계산
    getColorBrightness(hex) {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return (r * 299 + g * 587 + b * 114) / 1000;
    },

    // 텍스트 색상 결정 (배경색에 따라)
    getTextColor(backgroundColor) {
        return this.getColorBrightness(backgroundColor) > 128 ? '#000000' : '#ffffff';
    },

    // 디바이스 타입 확인
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    },

    // 터치 디바이스 확인
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
};

// 전역 변수로 유틸리티 함수 노출
window.utils = utils;

// 애플리케이션 인스턴스 생성 및 시작
const app = new WazCalendarApp();

// 개발자 도구용 전역 함수
window.wazCalendar = {
    app: app,
    auth: authManager,
    calendar: () => window.calendarManager,
    memo: () => window.memoManager,
    friends: () => window.friendsManager,
    chat: () => window.chatManager,
    utils: utils,
    
    // 디버그 함수들
    debug: {
        showAppInfo: () => app.showAppInfo(),
        getStatus: () => app.getAppStatus(),
        clearStorage: () => {
            localStorage.clear();
            location.reload();
        },
        exportLogs: () => {
            console.save = function(data, filename) {
                if (!data) {
                    console.error('Console.save: No data');
                    return;
                }
                
                if (!filename) filename = 'console.json';
                
                if (typeof data === "object") {
                    data = JSON.stringify(data, undefined, 4);
                }
                
                const blob = new Blob([data], {type: 'text/json'});
                const e = document.createEvent('MouseEvents');
                const a = document.createElement('a');
                
                a.download = filename;
                a.href = window.URL.createObjectURL(blob);
                a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
                e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                a.dispatchEvent(e);
            };
        }
    }
};

console.log('와즈달력 애플리케이션이 준비되었습니다.');
console.log('개발자 도구에서 window.wazCalendar로 접근할 수 있습니다.');

