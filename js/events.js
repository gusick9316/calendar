// 일정 관리 클래스
class EventManager {
    constructor() {
        this.currentEvent = null;
        this.isEditMode = false;
        this.selectedColor = '#ff6b6b';
        
        this.colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
            '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
        ];
        
        this.initializeEventListeners();
    }

    // 이벤트 리스너 초기화
    initializeEventListeners() {
        // 메모 추가 버튼
        const addEventBtn = document.getElementById('addEventBtn');
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => this.showAddEventModal());
        }

        // 메모 목록 버튼
        const viewEventsBtn = document.getElementById('viewEventsBtn');
        if (viewEventsBtn) {
            viewEventsBtn.addEventListener('click', () => this.showEventsListModal());
        }

        // 일정 추가/수정 모달
        this.initializeEventModal();
        
        // 일정 목록 모달
        this.initializeEventsListModal();
        
        // 일정 상세 모달
        this.initializeEventDetailModal();
    }

    // 일정 모달 초기화
    initializeEventModal() {
        const modal = document.getElementById('eventModal');
        const closeBtn = document.getElementById('closeModal');
        const form = document.getElementById('eventForm');
        const deleteBtn = document.getElementById('deleteEventBtn');
        const contentTextarea = document.getElementById('eventContent');
        const charCount = document.querySelector('.char-count');

        // 모달 닫기
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideEventModal());
        }

        // 모달 외부 클릭시 닫기
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideEventModal();
                }
            });
        }

        // 폼 제출
        if (form) {
            form.addEventListener('submit', (e) => this.handleEventSubmit(e));
        }

        // 삭제 버튼
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleEventDelete());
        }

        // 색상 선택
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => this.selectColor(option));
        });

        // 문자 수 카운터
        if (contentTextarea && charCount) {
            contentTextarea.addEventListener('input', () => {
                const length = contentTextarea.value.length;
                charCount.textContent = `${length}/50`;
                
                if (length > 45) {
                    charCount.style.color = '#ff6b6b';
                } else {
                    charCount.style.color = '#999';
                }
            });
        }

        // 종료 날짜 자동 설정
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput && endDateInput) {
            startDateInput.addEventListener('change', () => {
                if (!endDateInput.value || endDateInput.value < startDateInput.value) {
                    endDateInput.value = startDateInput.value;
                }
            });
        }
    }

    // 일정 목록 모달 초기화
    initializeEventsListModal() {
        const modal = document.getElementById('eventsListModal');
        const closeBtn = document.getElementById('closeEventsListModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideEventsListModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideEventsListModal();
                }
            });
        }
    }

    // 일정 상세 모달 초기화
    initializeEventDetailModal() {
        const modal = document.getElementById('eventDetailModal');
        const closeBtn = document.getElementById('closeEventDetailModal');
        const editBtn = document.getElementById('editEventBtn');
        const deleteBtn = document.getElementById('deleteEventDetailBtn');
        const shareBtn = document.getElementById('shareEventBtn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideEventDetailModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideEventDetailModal();
                }
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', () => this.editCurrentEvent());
        }

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => this.deleteCurrentEvent());
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.showShareEventModal());
        }

        // 일정 공유 모달 이벤트
        this.initializeShareEventModal();
    }

    // 일정 공유 모달 초기화
    initializeShareEventModal() {
        const modal = document.getElementById('shareEventModal');
        const closeBtn = document.getElementById('closeShareEventModal');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideShareEventModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideShareEventModal();
                }
            });
        }
    }

    // 일정 추가 모달 표시
    showAddEventModal(selectedDate = null) {
        this.isEditMode = false;
        this.currentEvent = null;
        
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteEventBtn');
        const form = document.getElementById('eventForm');
        
        if (modalTitle) modalTitle.textContent = '메모 추가';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (form) form.reset();
        
        // 선택된 날짜가 있으면 설정
        if (selectedDate) {
            const dateStr = this.formatDateForInput(selectedDate);
            const startDateInput = document.getElementById('startDate');
            const endDateInput = document.getElementById('endDate');
            
            if (startDateInput) startDateInput.value = dateStr;
            if (endDateInput) endDateInput.value = dateStr;
        }
        
        // 기본 색상 선택
        this.selectColor(document.querySelector('.color-option'));
        
        // 문자 수 카운터 초기화
        const charCount = document.querySelector('.char-count');
        if (charCount) charCount.textContent = '0/50';
        
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    // 일정 수정 모달 표시
    showEditEventModal(event) {
        this.isEditMode = true;
        this.currentEvent = event;
        
        const modal = document.getElementById('eventModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteEventBtn');
        
        if (modalTitle) modalTitle.textContent = '메모 수정';
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
        
        // 폼에 기존 데이터 설정
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        const contentTextarea = document.getElementById('eventContent');
        
        if (startDateInput) startDateInput.value = this.formatDateForInput(new Date(event.startDate));
        if (endDateInput) endDateInput.value = this.formatDateForInput(new Date(event.endDate));
        if (contentTextarea) {
            contentTextarea.value = event.content;
            // 문자 수 카운터 업데이트
            const charCount = document.querySelector('.char-count');
            if (charCount) charCount.textContent = `${event.content.length}/50`;
        }
        
        // 색상 선택
        const colorOption = document.querySelector(`[data-color="${event.color}"]`);
        if (colorOption) {
            this.selectColor(colorOption);
        }
        
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    // 일정 모달 숨기기
    hideEventModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        
        this.currentEvent = null;
        this.isEditMode = false;
    }

    // 색상 선택
    selectColor(colorElement) {
        // 기존 선택 해제
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // 새 색상 선택
        colorElement.classList.add('selected');
        this.selectedColor = colorElement.dataset.color;
        
        const selectedColorInput = document.getElementById('selectedColor');
        if (selectedColorInput) {
            selectedColorInput.value = this.selectedColor;
        }
    }

    // 일정 제출 처리
    async handleEventSubmit(event) {
        event.preventDefault();
        await this.saveEvent();
    }

    // 일정 저장
    async saveEvent() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const content = document.getElementById('eventContent').value.trim();
        const color = document.getElementById('selectedColor').value;

        if (!startDate || !endDate || !content) {
            this.showMessage('모든 필드를 입력해주세요.', 'error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            this.showMessage('시작 날짜는 종료 날짜보다 이전이어야 합니다.', 'error');
            return;
        }

        const event = {
            id: this.isEditMode ? this.currentEvent.id : Date.now().toString(),
            startDate: startDate,
            endDate: endDate,
            content: content,
            color: color,
            createdAt: this.isEditMode ? this.currentEvent.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            if (this.isEditMode) {
                // 기존 알림 제거
                if (window.notificationManager) {
                    window.notificationManager.removeEventReminder(event.id);
                }
                
                await window.calendarManager.updateEvent(event);
                this.showMessage('메모가 수정되었습니다.', 'success');
            } else {
                await window.calendarManager.addEvent(event);
                this.showMessage('메모가 추가되었습니다.', 'success');
            }

            // 자동 알림 설정 (새 일정이거나 수정된 일정)
            if (window.notificationManager) {
                window.notificationManager.autoSetReminders(event);
            }

            this.hideEventModal();
            this.resetForm();
        } catch (error) {
            console.error('일정 저장 오류:', error);
            this.showMessage('메모 저장 중 오류가 발생했습니다.', 'error');
        }
    }

    // 일정 삭제 처리
    async handleEventDelete() {
        if (!this.currentEvent) return;
        
        if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
            try {
                if (window.calendarManager) {
                    window.calendarManager.deleteEvent(this.currentEvent.id);
                }
                this.showMessage('메모가 삭제되었습니다.', 'success');
                this.hideEventModal();
            } catch (error) {
                console.error('일정 삭제 오류:', error);
                this.showMessage('메모 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    // 일정 목록 모달 표시
    showEventsListModal() {
        const modal = document.getElementById('eventsListModal');
        const eventsList = document.getElementById('eventsList');
        
        if (!window.calendarManager) return;
        
        const events = window.calendarManager.getAllEvents();
        
        if (eventsList) {
            if (events.length === 0) {
                eventsList.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">등록된 메모가 없습니다.</p>';
            } else {
                eventsList.innerHTML = events.map(event => this.createEventListItem(event)).join('');
            }
        }
        
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    // 일정 목록 모달 숨기기
    hideEventsListModal() {
        const modal = document.getElementById('eventsListModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    // 일정 목록 아이템 생성
    createEventListItem(event) {
        const dateRange = window.calendarManager ? 
            window.calendarManager.formatDateRange(event.startDate, event.endDate) : 
            `${event.startDate} ~ ${event.endDate}`;
            
        return `
            <div class="event-item" style="border-left-color: ${event.color}">
                <div class="event-item-header">
                    <div class="event-item-title">${this.escapeHtml(event.content)}</div>
                    <div class="event-item-date">${dateRange}</div>
                </div>
                <div class="event-item-actions">
                    <button class="btn btn-primary" onclick="window.eventManager.editEvent('${event.id}')">수정</button>
                    <button class="btn btn-danger" onclick="window.eventManager.deleteEventFromList('${event.id}')">삭제</button>
                </div>
            </div>
        `;
    }

    // 일정 상세 모달 표시
    showEventDetail(event) {
        this.currentEvent = event;
        
        const modal = document.getElementById('eventDetailModal');
        const eventDetail = document.getElementById('eventDetail');
        
        if (eventDetail && window.calendarManager) {
            const dateRange = window.calendarManager.formatDateRange(event.startDate, event.endDate);
            
            eventDetail.innerHTML = `
                <div class="event-detail-item">
                    <div class="event-detail-label">내용</div>
                    <div class="event-detail-value">${this.escapeHtml(event.content)}</div>
                </div>
                <div class="event-detail-item">
                    <div class="event-detail-label">날짜</div>
                    <div class="event-detail-value">${dateRange}</div>
                </div>
                <div class="event-detail-item">
                    <div class="event-detail-label">색상</div>
                    <div class="event-detail-value">
                        <div style="width: 30px; height: 30px; background-color: ${event.color}; border-radius: 50%; display: inline-block;"></div>
                    </div>
                </div>
            `;
        }
        
        if (modal) {
            modal.classList.add('show');
            modal.style.display = 'flex';
        }
    }

    // 일정 상세 모달 숨기기
    hideEventDetailModal() {
        const modal = document.getElementById('eventDetailModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        this.currentEvent = null;
    }

    // 현재 일정 수정
    editCurrentEvent() {
        if (this.currentEvent) {
            this.hideEventDetailModal();
            this.showEditEventModal(this.currentEvent);
        }
    }

    // 현재 일정 삭제
    async deleteCurrentEvent() {
        if (!this.currentEvent) return;
        
        if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
            try {
                if (window.calendarManager) {
                    window.calendarManager.deleteEvent(this.currentEvent.id);
                }
                this.showMessage('메모가 삭제되었습니다.', 'success');
                this.hideEventDetailModal();
            } catch (error) {
                console.error('일정 삭제 오류:', error);
                this.showMessage('메모 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    // 목록에서 일정 수정
    editEvent(eventId) {
        if (!window.calendarManager) return;
        
        const events = window.calendarManager.getAllEvents();
        const event = events.find(e => e.id === eventId);
        
        if (event) {
            this.hideEventsListModal();
            this.showEditEventModal(event);
        }
    }

    // 목록에서 일정 삭제
    async deleteEventFromList(eventId) {
        if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
            try {
                if (window.calendarManager) {
                    window.calendarManager.deleteEvent(eventId);
                }
                this.showMessage('메모가 삭제되었습니다.', 'success');
                // 목록 새로고침
                this.showEventsListModal();
            } catch (error) {
                console.error('일정 삭제 오류:', error);
                this.showMessage('메모 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    // 날짜를 input 형식으로 포맷
    formatDateForInput(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 메시지 표시
    showMessage(message, type = 'info') {
        if (window.authManager) {
            window.authManager.showMessage(message, type);
        }
    }
}

// 전역 일정 관리자 인스턴스
window.eventManager = new EventManager();


    // 일정 공유 모달 표시
    showShareEventModal() {
        if (!this.currentEvent) {
            this.showMessage('공유할 일정을 선택해주세요.', 'warning');
            return;
        }

        const modal = document.getElementById('shareEventModal');
        if (modal && window.socialManager) {
            this.loadShareFriendsList();
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('show'), 10);
        }
    }

    // 일정 공유 모달 숨기기
    hideShareEventModal() {
        const modal = document.getElementById('shareEventModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    }

    // 공유할 친구 목록 로드
    loadShareFriendsList() {
        const container = document.getElementById('shareFriendsList');
        if (!container || !window.socialManager) return;

        container.innerHTML = '';

        if (window.socialManager.friends.length === 0) {
            container.innerHTML = '<p>친구가 없습니다. 먼저 친구를 추가해주세요.</p>';
            return;
        }

        window.socialManager.friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'share-friend-item';
            friendElement.innerHTML = `
                <span class="friend-name">${friend}</span>
                <span class="share-status">공유하기</span>
            `;
            
            friendElement.addEventListener('click', () => {
                this.shareEventWithFriend(friend);
            });

            container.appendChild(friendElement);
        });
    }

    // 친구와 일정 공유
    async shareEventWithFriend(friendUser) {
        if (!this.currentEvent || !window.socialManager) {
            this.showMessage('일정 공유 중 오류가 발생했습니다.', 'error');
            return;
        }

        try {
            await window.socialManager.shareEvent(friendUser, this.currentEvent.id);
            this.hideShareEventModal();
            this.hideEventDetailModal();
        } catch (error) {
            console.error('일정 공유 오류:', error);
            this.showMessage('일정 공유 중 오류가 발생했습니다.', 'error');
        }
    }

    // 공유된 일정 로드 및 표시
    async loadSharedEvents() {
        if (!window.socialManager || !window.authManager) return;

        try {
            const currentUser = window.authManager.getCurrentUser();
            if (!currentUser) return;

            const sharedEvents = await window.githubAPI.getSocialData(currentUser.username, 'shared_events');
            if (sharedEvents && sharedEvents.length > 0) {
                this.displaySharedEvents(sharedEvents);
            }
        } catch (error) {
            console.error('공유된 일정 로드 오류:', error);
        }
    }

    // 공유된 일정 표시
    displaySharedEvents(sharedEvents) {
        // 공유된 일정을 달력에 표시하는 로직
        sharedEvents.forEach(sharedEvent => {
            if (sharedEvent.event && window.calendarManager) {
                // 공유된 일정임을 표시하기 위해 특별한 스타일 적용
                const event = {
                    ...sharedEvent.event,
                    isShared: true,
                    sharedBy: sharedEvent.sharedBy,
                    originalId: sharedEvent.event.id,
                    id: `shared_${sharedEvent.id}` // 고유 ID 생성
                };
                
                // 달력에 공유된 일정 추가 (읽기 전용)
                window.calendarManager.addSharedEvent(event);
            }
        });
    }

    // 공유된 일정 상세 보기
    showSharedEventDetail(sharedEvent) {
        const modal = document.getElementById('eventDetailModal');
        const detailContainer = document.getElementById('eventDetail');
        
        if (!modal || !detailContainer) return;

        const startDate = new Date(sharedEvent.startDate).toLocaleDateString();
        const endDate = new Date(sharedEvent.endDate).toLocaleDateString();
        
        detailContainer.innerHTML = `
            <div class="event-detail-content">
                <div class="event-info">
                    <div class="event-color" style="background-color: ${sharedEvent.color}"></div>
                    <div class="event-text">
                        <h4>${sharedEvent.content}</h4>
                        <p><strong>기간:</strong> ${startDate} ~ ${endDate}</p>
                        <p><strong>공유자:</strong> ${sharedEvent.sharedBy}</p>
                        <p class="shared-label">📤 공유된 일정</p>
                    </div>
                </div>
            </div>
        `;

        // 공유된 일정은 수정/삭제 버튼 숨기기
        const editBtn = document.getElementById('editEventBtn');
        const deleteBtn = document.getElementById('deleteEventDetailBtn');
        const shareBtn = document.getElementById('shareEventBtn');
        
        if (editBtn) editBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (shareBtn) shareBtn.style.display = 'none';

        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

// 전역 이벤트 관리자 인스턴스
window.eventManager = new EventManager();

