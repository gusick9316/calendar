// 달력 관리 클래스
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.backgroundImages = [];
        this.currentBackgroundImage = null;
        this.init();
    }

    // 초기화
    init() {
        this.setupEventListeners();
        this.loadBackgroundImages();
        this.renderCalendar();
        this.updateCurrentMonth();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 월 네비게이션
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.previousMonth();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.nextMonth();
        });

        // 메모 관련 버튼
        document.getElementById('addMemoBtn').addEventListener('click', () => {
            this.openMemoModal();
        });

        document.getElementById('memoListBtn').addEventListener('click', () => {
            this.openMemoListModal();
        });

        // 친구 및 알림 버튼
        document.getElementById('friendsBtn').addEventListener('click', () => {
            if (window.friendsManager) {
                window.friendsManager.openFriendsModal();
            }
        });

        document.getElementById('notificationsBtn').addEventListener('click', () => {
            if (window.friendsManager) {
                window.friendsManager.openNotificationsModal();
            }
        });
    }

    // 배경 이미지 로드
    async loadBackgroundImages() {
        try {
            const month = this.currentDate.getMonth() + 1;
            this.backgroundImages = await githubAPI.getMonthlyBackgroundImages(month);
            this.setRandomBackground();
        } catch (error) {
            console.error('배경 이미지 로드 오류:', error);
            this.setDefaultBackground();
        }
    }

    // 랜덤 배경 이미지 설정
    setRandomBackground() {
        if (this.backgroundImages.length > 0) {
            const randomIndex = Math.floor(Math.random() * this.backgroundImages.length);
            this.currentBackgroundImage = this.backgroundImages[randomIndex];
            
            // 배경 이미지 적용
            const calendarContainer = document.querySelector('.calendar-container');
            calendarContainer.style.backgroundImage = `url(${this.currentBackgroundImage})`;
            calendarContainer.style.backgroundSize = 'cover';
            calendarContainer.style.backgroundPosition = 'center';
            calendarContainer.style.backgroundRepeat = 'no-repeat';
            
            // 달력 그리드 투명도 조절
            const calendarGrid = document.querySelector('.calendar-grid');
            calendarGrid.style.background = 'rgba(255, 255, 255, 0.8)';
        } else {
            this.setDefaultBackground();
        }
    }

    // 기본 배경 설정
    setDefaultBackground() {
        const calendarContainer = document.querySelector('.calendar-container');
        calendarContainer.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
        
        const calendarGrid = document.querySelector('.calendar-grid');
        calendarGrid.style.background = 'rgba(255, 255, 255, 0.9)';
    }

    // 달력 렌더링
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 현재 월의 첫 번째 날과 마지막 날
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 달력 시작 날짜 (이전 월의 마지막 주 포함)
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // 달력 종료 날짜 (다음 월의 첫 주 포함)
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
        
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        const today = new Date();
        const currentDate = new Date(startDate);
        
        // 6주 * 7일 = 42일 렌더링
        for (let i = 0; i < 42; i++) {
            const dayElement = this.createDayElement(currentDate, month, today);
            calendarDays.appendChild(dayElement);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // 메모 표시
        this.displayMemos();
    }

    // 날짜 요소 생성
    createDayElement(date, currentMonth, today) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // 날짜 표시
        const dateNumber = document.createElement('span');
        dateNumber.textContent = date.getDate();
        dayElement.appendChild(dateNumber);
        
        // 클래스 추가
        if (date.getMonth() !== currentMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (this.isSameDay(date, today)) {
            dayElement.classList.add('today');
        }
        
        // 클릭 이벤트
        dayElement.addEventListener('click', () => {
            this.selectDate(date);
        });
        
        // 날짜 데이터 저장
        dayElement.dataset.date = this.formatDate(date);
        
        return dayElement;
    }

    // 날짜 선택
    selectDate(date) {
        // 이전 선택 해제
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });
        
        // 새로운 날짜 선택
        this.selectedDate = new Date(date);
        const dayElement = document.querySelector(`[data-date="${this.formatDate(date)}"]`);
        if (dayElement) {
            dayElement.classList.add('selected');
        }
    }

    // 이전 월로 이동
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.updateCurrentMonth();
        this.loadBackgroundImages();
        this.renderCalendar();
    }

    // 다음 월로 이동
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.updateCurrentMonth();
        this.loadBackgroundImages();
        this.renderCalendar();
    }

    // 현재 월 표시 업데이트
    updateCurrentMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthName = APP_CONFIG.monthNames[month];
        
        document.getElementById('currentMonth').textContent = `${year}년 ${monthName}`;
    }

    // 메모 표시
    displayMemos() {
        if (!authManager.isLoggedIn()) return;
        
        const user = authManager.getCurrentUser();
        if (!user || !user.memos) return;
        
        // 모든 메모 아이템 제거
        document.querySelectorAll('.memo-item').forEach(item => item.remove());
        
        // 현재 월의 메모만 표시
        const currentYear = this.currentDate.getFullYear();
        const currentMonth = this.currentDate.getMonth();
        
        user.memos.forEach(memo => {
            const startDate = new Date(memo.startDate);
            const endDate = new Date(memo.endDate);
            
            // 메모 기간 내의 모든 날짜에 표시
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                // 현재 월에 해당하는 날짜만 표시
                if (currentDate.getFullYear() === currentYear && currentDate.getMonth() === currentMonth) {
                    const dayElement = document.querySelector(`[data-date="${this.formatDate(currentDate)}"]`);
                    if (dayElement) {
                        const memoItem = document.createElement('div');
                        memoItem.className = 'memo-item';
                        memoItem.style.backgroundColor = memo.color;
                        memoItem.title = memo.content;
                        
                        // 메모 클릭 이벤트
                        memoItem.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.showMemoOptions(memo);
                        });
                        
                        dayElement.appendChild(memoItem);
                        dayElement.classList.add('has-memo');
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
    }

    // 메모 옵션 표시 (수정/삭제)
    showMemoOptions(memo) {
        const options = confirm('이 메모를 수정하시겠습니까?\n확인: 수정, 취소: 삭제');
        
        if (options) {
            // 수정
            if (window.memoManager) {
                window.memoManager.editMemo(memo);
            }
        } else {
            // 삭제 확인
            if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
                if (window.memoManager) {
                    window.memoManager.deleteMemo(memo.id);
                }
            }
        }
    }

    // 메모 모달 열기
    openMemoModal() {
        if (window.memoManager) {
            window.memoManager.openMemoModal();
        }
    }

    // 메모 목록 모달 열기
    openMemoListModal() {
        if (window.memoManager) {
            window.memoManager.openMemoListModal();
        }
    }

    // 날짜 포맷팅
    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 같은 날짜인지 확인
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // 현재 날짜로 이동
    goToToday() {
        this.currentDate = new Date();
        this.updateCurrentMonth();
        this.loadBackgroundImages();
        this.renderCalendar();
    }

    // 특정 날짜로 이동
    goToDate(date) {
        this.currentDate = new Date(date);
        this.updateCurrentMonth();
        this.loadBackgroundImages();
        this.renderCalendar();
    }

    // 달력 새로고침
    refresh() {
        this.renderCalendar();
    }
}

// 달력 관리자 인스턴스 생성
window.calendarManager = new CalendarManager();

