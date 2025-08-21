// 알림 관리 클래스
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.eventReminders = [];
        this.checkInterval = null;
        this.init();
    }

    // 초기화
    init() {
        this.loadEventReminders();
        this.startReminderCheck();
        this.requestNotificationPermission();
    }

    // 브라우저 알림 권한 요청
    async requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('알림 권한이 허용되었습니다.');
                } else {
                    console.log('알림 권한이 거부되었습니다.');
                }
            }
        } else {
            console.log('이 브라우저는 알림을 지원하지 않습니다.');
        }
    }

    // 일정 알림 설정
    setEventReminder(event, reminderTime) {
        const reminder = {
            id: `reminder_${event.id}_${Date.now()}`,
            eventId: event.id,
            eventTitle: event.content,
            eventDate: new Date(event.startDate),
            reminderTime: reminderTime, // 분 단위 (예: 30분 전 = 30)
            notificationTime: new Date(new Date(event.startDate).getTime() - (reminderTime * 60 * 1000)),
            isTriggered: false,
            createdAt: new Date()
        };

        this.eventReminders.push(reminder);
        this.saveEventReminders();
        
        console.log(`일정 알림이 설정되었습니다: ${event.content} (${reminderTime}분 전)`);
        return reminder.id;
    }

    // 일정 알림 제거
    removeEventReminder(eventId) {
        this.eventReminders = this.eventReminders.filter(reminder => 
            reminder.eventId !== eventId
        );
        this.saveEventReminders();
    }

    // 알림 확인 시작
    startReminderCheck() {
        // 1분마다 알림 확인
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 60000); // 60초

        // 즉시 한 번 확인
        this.checkReminders();
    }

    // 알림 확인 중지
    stopReminderCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    // 알림 확인
    checkReminders() {
        const now = new Date();
        
        this.eventReminders.forEach(reminder => {
            if (!reminder.isTriggered && now >= reminder.notificationTime) {
                this.triggerReminder(reminder);
                reminder.isTriggered = true;
            }
        });

        // 트리거된 알림들을 저장
        this.saveEventReminders();
        
        // 오래된 알림들 정리 (7일 이상 된 것들)
        this.cleanupOldReminders();
    }

    // 알림 트리거
    triggerReminder(reminder) {
        const timeUntilEvent = Math.round((reminder.eventDate.getTime() - new Date().getTime()) / (1000 * 60));
        const message = `${reminder.eventTitle} 일정이 ${timeUntilEvent}분 후에 시작됩니다.`;

        // 브라우저 알림
        this.showBrowserNotification(reminder.eventTitle, message);
        
        // 인앱 알림
        this.showInAppNotification(message, 'reminder');
        
        // 소셜 알림에도 추가
        if (window.socialManager) {
            const notificationData = {
                id: Date.now().toString(),
                type: 'event_reminder',
                message: message,
                from: 'system',
                timestamp: new Date().toISOString(),
                read: false
            };
            window.socialManager.notifications.unshift(notificationData);
            window.socialManager.updateNotificationBadge();
        }

        console.log(`알림 트리거: ${message}`);
    }

    // 브라우저 알림 표시
    showBrowserNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(`와즈달력 - ${title}`, {
                body: message,
                icon: '/favicon.ico', // 아이콘이 있다면
                badge: '/favicon.ico',
                tag: 'waz-calendar-reminder',
                requireInteraction: true,
                actions: [
                    {
                        action: 'view',
                        title: '일정 보기'
                    },
                    {
                        action: 'dismiss',
                        title: '닫기'
                    }
                ]
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // 10초 후 자동으로 닫기
            setTimeout(() => {
                notification.close();
            }, 10000);
        }
    }

    // 인앱 알림 표시
    showInAppNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `in-app-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">🔔</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        // 스타일 적용
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            max-width: 350px;
            animation: slideInRight 0.3s ease;
        `;

        // 닫기 버튼 이벤트
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        document.body.appendChild(notification);

        // 5초 후 자동으로 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }

    // 일정 알림 데이터 저장
    saveEventReminders() {
        try {
            const currentUser = window.authManager?.getCurrentUser();
            if (currentUser) {
                const key = `waz_calendar_reminders_${currentUser.username}`;
                localStorage.setItem(key, JSON.stringify(this.eventReminders));
            }
        } catch (error) {
            console.error('알림 데이터 저장 오류:', error);
        }
    }

    // 일정 알림 데이터 로드
    loadEventReminders() {
        try {
            const currentUser = window.authManager?.getCurrentUser();
            if (currentUser) {
                const key = `waz_calendar_reminders_${currentUser.username}`;
                const saved = localStorage.getItem(key);
                if (saved) {
                    this.eventReminders = JSON.parse(saved);
                    // 날짜 객체 복원
                    this.eventReminders.forEach(reminder => {
                        reminder.eventDate = new Date(reminder.eventDate);
                        reminder.notificationTime = new Date(reminder.notificationTime);
                        reminder.createdAt = new Date(reminder.createdAt);
                    });
                }
            }
        } catch (error) {
            console.error('알림 데이터 로드 오류:', error);
            this.eventReminders = [];
        }
    }

    // 오래된 알림 정리
    cleanupOldReminders() {
        const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
        const originalLength = this.eventReminders.length;
        
        this.eventReminders = this.eventReminders.filter(reminder => 
            reminder.createdAt > sevenDaysAgo
        );

        if (this.eventReminders.length !== originalLength) {
            this.saveEventReminders();
            console.log(`${originalLength - this.eventReminders.length}개의 오래된 알림을 정리했습니다.`);
        }
    }

    // 특정 일정의 알림 목록 가져오기
    getRemindersForEvent(eventId) {
        return this.eventReminders.filter(reminder => 
            reminder.eventId === eventId && !reminder.isTriggered
        );
    }

    // 모든 활성 알림 가져오기
    getActiveReminders() {
        const now = new Date();
        return this.eventReminders.filter(reminder => 
            !reminder.isTriggered && reminder.notificationTime > now
        );
    }

    // 알림 통계
    getReminderStats() {
        const total = this.eventReminders.length;
        const active = this.getActiveReminders().length;
        const triggered = this.eventReminders.filter(r => r.isTriggered).length;
        
        return {
            total,
            active,
            triggered
        };
    }

    // 일정 생성 시 자동 알림 설정
    autoSetReminders(event) {
        // 기본 알림: 30분 전, 1시간 전
        const defaultReminders = [30, 60]; // 분 단위
        
        defaultReminders.forEach(minutes => {
            this.setEventReminder(event, minutes);
        });
    }

    // 사용자 정의 알림 시간 설정
    setCustomReminder(event, customMinutes) {
        if (customMinutes > 0) {
            return this.setEventReminder(event, customMinutes);
        }
        return null;
    }

    // 알림 설정 UI 표시
    showReminderSettings(event) {
        const modal = document.createElement('div');
        modal.className = 'reminder-modal';
        modal.innerHTML = `
            <div class="reminder-modal-content">
                <h3>알림 설정</h3>
                <p>일정: ${event.content}</p>
                <div class="reminder-options">
                    <label>
                        <input type="checkbox" value="15"> 15분 전
                    </label>
                    <label>
                        <input type="checkbox" value="30" checked> 30분 전
                    </label>
                    <label>
                        <input type="checkbox" value="60" checked> 1시간 전
                    </label>
                    <label>
                        <input type="checkbox" value="1440"> 1일 전
                    </label>
                    <div class="custom-reminder">
                        <label>
                            <input type="checkbox" id="customReminderCheck"> 사용자 정의:
                        </label>
                        <input type="number" id="customReminderTime" min="1" placeholder="분">
                        <span>분 전</span>
                    </div>
                </div>
                <div class="reminder-actions">
                    <button id="saveReminders">저장</button>
                    <button id="cancelReminders">취소</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 이벤트 리스너 추가
        modal.querySelector('#saveReminders').addEventListener('click', () => {
            this.saveReminderSettings(event, modal);
        });

        modal.querySelector('#cancelReminders').addEventListener('click', () => {
            modal.remove();
        });
    }

    // 알림 설정 저장
    saveReminderSettings(event, modal) {
        // 기존 알림 제거
        this.removeEventReminder(event.id);

        // 선택된 알림들 설정
        const checkboxes = modal.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
            if (checkbox.id === 'customReminderCheck') {
                const customTime = modal.querySelector('#customReminderTime').value;
                if (customTime && customTime > 0) {
                    this.setEventReminder(event, parseInt(customTime));
                }
            } else {
                this.setEventReminder(event, parseInt(checkbox.value));
            }
        });

        modal.remove();
        this.showInAppNotification('알림이 설정되었습니다.', 'success');
    }

    // 정리
    cleanup() {
        this.stopReminderCheck();
        this.saveEventReminders();
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

    .in-app-notification {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .notification-icon {
        font-size: 18px;
    }

    .notification-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
    }

    .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .notification-close:hover {
        color: #666;
    }

    .reminder-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    }

    .reminder-modal-content {
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 400px;
        width: 90%;
    }

    .reminder-options {
        margin: 15px 0;
    }

    .reminder-options label {
        display: block;
        margin: 8px 0;
        cursor: pointer;
    }

    .custom-reminder {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 10px;
    }

    .custom-reminder input[type="number"] {
        width: 80px;
        padding: 4px;
        border: 1px solid #ddd;
        border-radius: 4px;
    }

    .reminder-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 15px;
    }

    .reminder-actions button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    #saveReminders {
        background: #667eea;
        color: white;
    }

    #cancelReminders {
        background: #ddd;
        color: #333;
    }
`;
document.head.appendChild(style);

// 전역 변수로 설정
window.notificationManager = null;

