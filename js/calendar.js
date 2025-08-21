// 달력 관리 클래스
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.today = new Date();
        this.events = [];
        this.backgroundImage = null;
        
        this.monthNames = [
            '1월', '2월', '3월', '4월', '5월', '6월',
            '7월', '8월', '9월', '10월', '11월', '12월'
        ];
        
        this.initializeEventListeners();
    }

    // 이벤트 리스너 초기화
    initializeEventListeners() {
        // 월 네비게이션
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => this.previousMonth());
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => this.nextMonth());
        }
    }

    // 달력 초기화
    async initialize() {
        await this.loadUserEvents();
        await this.setBackgroundImage();
        this.render();
    }

    // 사용자 일정 로드
    async loadUserEvents() {
        try {
            if (window.authManager && window.authManager.isLoggedIn()) {
                const user = window.authManager.getCurrentUser();
                const userData = await window.githubAPI.getUserData(user.accountFile);
                this.events = userData.events || [];
            }
        } catch (error) {
            console.error('사용자 일정 로드 오류:', error);
            this.events = [];
        }
    }

    // 배경 이미지 설정
    async setBackgroundImage() {
        try {
            const month = this.currentDate.getMonth() + 1;
            const imageUrl = await window.githubAPI.getBackgroundImages(month);
            
            const calendarContainer = document.querySelector('.calendar-container');
            
            if (imageUrl) {
                this.backgroundImage = imageUrl;
                document.body.style.backgroundImage = `url(${imageUrl})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
                
                // 배경 이미지가 있을 때 달력 컨테이너 투명도 80%
                if (calendarContainer) {
                    calendarContainer.classList.remove('no-background');
                }
            } else {
                // 기본 그라데이션 배경
                this.backgroundImage = null;
                document.body.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                
                // 배경 이미지가 없을 때 달력 컨테이너 투명도 95%
                if (calendarContainer) {
                    calendarContainer.classList.add('no-background');
                }
            }
        } catch (error) {
            console.error('배경 이미지 설정 오류:', error);
            // 기본 그라데이션 배경
            document.body.style.backgroundImage = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            
            const calendarContainer = document.querySelector('.calendar-container');
            if (calendarContainer) {
                calendarContainer.classList.add('no-background');
            }
        }
    }

    // 달력 렌더링
    render() {
        this.updateHeader();
        this.renderCalendarDays();
    }

    // 헤더 업데이트
    updateHeader() {
        const currentMonthElement = document.getElementById('currentMonth');
        if (currentMonthElement) {
            const year = this.currentDate.getFullYear();
            const month = this.monthNames[this.currentDate.getMonth()];
            currentMonthElement.textContent = `${year}년 ${month}`;
        }
    }

    // 달력 날짜 렌더링
    renderCalendarDays() {
        const calendarDays = document.getElementById('calendarDays');
        if (!calendarDays) return;

        calendarDays.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 이번 달 첫째 날과 마지막 날
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 첫째 주의 시작 날짜 (일요일부터 시작)
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // 마지막 주의 끝 날짜
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

        // 날짜 생성
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const dayElement = this.createDayElement(currentDate, month);
            calendarDays.appendChild(dayElement);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    // 날짜 요소 생성
    createDayElement(date, currentMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        
        const dayEvents = document.createElement('div');
        dayEvents.className = 'day-events';
        
        // 다른 달의 날짜인지 확인
        if (date.getMonth() !== currentMonth) {
            dayElement.classList.add('other-month');
        }
        
        // 오늘 날짜인지 확인
        if (this.isSameDate(date, this.today)) {
            dayElement.classList.add('today');
        }
        
        // 해당 날짜의 일정 표시
        this.renderEventsForDate(dayElement, date, dayEvents);
        
        // 날짜 클릭 이벤트 추가
        this.addDayClickEvent(dayElement, date);
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(dayEvents);
        
        return dayElement;
    }
        
    // 해당 날짜의 일정 표시
    renderEventsForDate(dayElement, date, dayEvents) {
        dayEvents.innerHTML = '';
        
        // 날짜별 일정을 그룹화하여 연속 일정 처리
        const eventGroups = this.groupContinuousEvents(date);
        
        eventGroups.forEach(group => {
            const eventBar = document.createElement('div');
            eventBar.className = 'event-bar';
            eventBar.style.backgroundColor = group.event.color;
            
            // 공유된 일정인 경우 스타일 추가
            if (group.event.isShared) {
                eventBar.classList.add('shared-event');
                eventBar.style.opacity = '0.7';
                eventBar.style.borderLeft = '3px solid #667eea';
            }
            
            // 연속 일정 위치 결정
            if (group.isStart && group.isEnd) {
                // 단일 날짜 일정
                eventBar.classList.add('event-single');
                const content = group.event.isShared ? `📤 ${group.event.content}` : group.event.content;
                eventBar.innerHTML = `<span class="event-text">${content}</span>`;
            } else if (group.isStart) {
                // 시작 날짜
                eventBar.classList.add('event-start');
                const content = group.event.isShared ? `📤 ${group.event.content}` : group.event.content;
                eventBar.innerHTML = `<span class="event-text">${content}</span>`;
            } else if (group.isEnd) {
                // 종료 날짜
                eventBar.classList.add('event-end');
                eventBar.innerHTML = `<span class="event-text"></span>`;
            } else {
                // 중간 날짜
                eventBar.classList.add('event-middle');
                eventBar.innerHTML = `<span class="event-text"></span>`;
            }
            
            eventBar.addEventListener('click', (e) => {
                e.stopPropagation();
                if (group.event.isShared) {
                    window.eventManager.showSharedEventDetail(group.event);
                } else {
                    this.showEventDetail(group.event);
                }
            });
            
            dayEvents.appendChild(eventBar);
        });
    }

    // 연속 일정 그룹화
    groupContinuousEvents(date) {
        const groups = [];
        const dateEvents = this.getEventsForDate(date);
        
        dateEvents.forEach(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            
            const isStart = this.isSameDate(date, startDate);
            const isEnd = this.isSameDate(date, endDate);
            
            groups.push({
                event: event,
                isStart: isStart,
                isEnd: isEnd
            });
        });
        
        return groups;
    }

    // 날짜 클릭 이벤트 (일정 추가)
    addDayClickEvent(dayElement, date) {
        dayElement.addEventListener('click', () => {
            if (window.eventManager) {
                window.eventManager.showAddEventModal(date);
            }
        });
        
        return dayElement;
    }

    // 특정 날짜의 일정 가져오기
    getEventsForDate(date) {
        const allEvents = this.getAllEvents(); // 일반 일정 + 공유된 일정
        return allEvents.filter(event => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            return date >= startDate && date <= endDate;
        });
    }

    // 날짜 비교 (년월일만)
    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    // 이전 달로 이동
    async previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        await this.setBackgroundImage();
        this.render();
    }

    // 다음 달로 이동
    async nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        await this.setBackgroundImage();
        this.render();
    }

    // 특정 날짜로 이동
    async goToDate(date) {
        this.currentDate = new Date(date);
        await this.setBackgroundImage();
        this.render();
    }

    // 오늘로 이동
    async goToToday() {
        this.currentDate = new Date(this.today);
        await this.setBackgroundImage();
        this.render();
    }

    // 일정 추가
    addEvent(event) {
        // ID 생성
        event.id = this.generateEventId();
        this.events.push(event);
        this.saveEvents();
        this.render();
    }

    // 일정 수정
    updateEvent(eventId, updatedEvent) {
        const index = this.events.findIndex(event => event.id === eventId);
        if (index !== -1) {
            this.events[index] = { ...updatedEvent, id: eventId };
            this.saveEvents();
            this.render();
        }
    }

    // 일정 삭제
    deleteEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
        this.saveEvents();
        this.render();
    }

    // 일정 저장
    async saveEvents() {
        try {
            if (window.authManager && window.authManager.isLoggedIn()) {
                const user = window.authManager.getCurrentUser();
                await window.githubAPI.saveUserData(user.accountFile, { events: this.events });
            }
        } catch (error) {
            console.error('일정 저장 오류:', error);
            if (window.authManager) {
                window.authManager.showMessage('일정 저장 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    // 일정 ID 생성
    generateEventId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 날짜 범위 겹침 확인
    isDateRangeOverlapping(startDate1, endDate1, startDate2, endDate2) {
        return startDate1 <= endDate2 && endDate1 >= startDate2;
    }

    // 일정 겹침 확인
    checkEventOverlap(startDate, endDate, excludeEventId = null) {
        return this.events.some(event => {
            if (excludeEventId && event.id === excludeEventId) {
                return false;
            }
            
            const eventStart = new Date(event.startDate);
            const eventEnd = new Date(event.endDate);
            
            return this.isDateRangeOverlapping(
                new Date(startDate), 
                new Date(endDate), 
                eventStart, 
                eventEnd
            );
        });
    }

    // 일정 상세 표시
    showEventDetail(event) {
        if (window.eventManager) {
            window.eventManager.showEventDetail(event);
        }
    }

    // 모든 일정 가져오기
    getAllEvents() {
        return [...this.events].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    }

    // 날짜 포맷팅
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 날짜 범위 포맷팅
    formatDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (this.isSameDate(start, end)) {
            return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일`;
        } else {
            return `${start.getFullYear()}년 ${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getFullYear()}년 ${end.getMonth() + 1}월 ${end.getDate()}일`;
        }
    }

    // 공유된 일정 추가
    addSharedEvent(sharedEvent) {
        // 공유된 일정을 별도 배열에 저장
        if (!this.sharedEvents) {
            this.sharedEvents = [];
        }
        this.sharedEvents.push(sharedEvent);
        this.render(); // 달력 다시 렌더링
    }

    // 모든 일정 가져오기 (일반 일정 + 공유된 일정)
    getAllEvents() {
        const regularEvents = this.events || [];
        const sharedEvents = this.sharedEvents || [];
        return [...regularEvents, ...sharedEvents];
    }
}

// 전역 달력 관리자 인스턴스
window.calendarManager = new CalendarManager();

