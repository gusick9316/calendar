// 소셜 기능 관리 클래스
class SocialManager {
    constructor() {
        this.currentUser = null;
        this.friends = [];
        this.friendRequests = [];
        this.notifications = [];
        this.chatMessages = {};
        this.init();
    }

    // 초기화
    init() {
        this.currentUser = window.auth?.currentUser;
        if (this.currentUser) {
            this.loadSocialData();
            this.startPolling();
        }
    }

    // 소셜 데이터 로드
    async loadSocialData() {
        try {
            await Promise.all([
                this.loadFriends(),
                this.loadFriendRequests(),
                this.loadNotifications(),
                this.loadChatMessages()
            ]);
        } catch (error) {
            console.error('소셜 데이터 로드 오류:', error);
        }
    }

    // 친구 목록 로드
    async loadFriends() {
        try {
            const friendsData = await window.githubAPI.getSocialData(this.currentUser, 'friends');
            this.friends = friendsData || [];
        } catch (error) {
            console.error('친구 목록 로드 오류:', error);
            this.friends = [];
        }
    }

    // 친구 요청 로드
    async loadFriendRequests() {
        try {
            const requestsData = await window.githubAPI.getSocialData(this.currentUser, 'friend_requests');
            this.friendRequests = requestsData || [];
        } catch (error) {
            console.error('친구 요청 로드 오류:', error);
            this.friendRequests = [];
        }
    }

    // 알림 로드
    async loadNotifications() {
        try {
            const notificationsData = await window.githubAPI.getSocialData(this.currentUser, 'notifications');
            this.notifications = notificationsData || [];
        } catch (error) {
            console.error('알림 로드 오류:', error);
            this.notifications = [];
        }
    }

    // 채팅 메시지 로드
    async loadChatMessages() {
        try {
            const chatData = await window.githubAPI.getSocialData(this.currentUser, 'chat_messages');
            this.chatMessages = chatData || {};
        } catch (error) {
            console.error('채팅 메시지 로드 오류:', error);
            this.chatMessages = {};
        }
    }

    // 사용자 검색
    async searchUsers(username) {
        try {
            const users = await window.githubAPI.searchUsers(username);
            return users.filter(user => user !== this.currentUser);
        } catch (error) {
            console.error('사용자 검색 오류:', error);
            return [];
        }
    }

    // 친구 요청 보내기
    async sendFriendRequest(targetUser) {
        try {
            const requestData = {
                from: this.currentUser,
                to: targetUser,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };

            // 상대방의 친구 요청 목록에 추가
            await window.githubAPI.addFriendRequest(targetUser, requestData);
            
            // 알림 생성
            await this.createNotification(targetUser, 'friend_request', `${this.currentUser}님이 친구 요청을 보냈습니다.`);
            
            window.app.showMessage('친구 요청을 보냈습니다.', 'success');
        } catch (error) {
            console.error('친구 요청 오류:', error);
            window.app.showMessage('친구 요청 중 오류가 발생했습니다.', 'error');
        }
    }

    // 친구 요청 수락
    async acceptFriendRequest(requestId, fromUser) {
        try {
            // 양쪽 친구 목록에 추가
            await Promise.all([
                window.githubAPI.addFriend(this.currentUser, fromUser),
                window.githubAPI.addFriend(fromUser, this.currentUser)
            ]);

            // 친구 요청 제거
            await window.githubAPI.removeFriendRequest(this.currentUser, requestId);
            
            // 알림 생성
            await this.createNotification(fromUser, 'friend_accepted', `${this.currentUser}님이 친구 요청을 수락했습니다.`);
            
            // 로컬 데이터 업데이트
            this.friends.push(fromUser);
            this.friendRequests = this.friendRequests.filter(req => req.id !== requestId);
            
            window.app.showMessage('친구 요청을 수락했습니다.', 'success');
            this.updateUI();
        } catch (error) {
            console.error('친구 요청 수락 오류:', error);
            window.app.showMessage('친구 요청 수락 중 오류가 발생했습니다.', 'error');
        }
    }

    // 친구 요청 거절
    async rejectFriendRequest(requestId) {
        try {
            await window.githubAPI.removeFriendRequest(this.currentUser, requestId);
            this.friendRequests = this.friendRequests.filter(req => req.id !== requestId);
            
            window.app.showMessage('친구 요청을 거절했습니다.', 'info');
            this.updateUI();
        } catch (error) {
            console.error('친구 요청 거절 오류:', error);
            window.app.showMessage('친구 요청 거절 중 오류가 발생했습니다.', 'error');
        }
    }

    // 채팅 메시지 보내기
    async sendChatMessage(friendUser, message) {
        if (message.length > 150) {
            window.app.showMessage('메시지는 150글자를 초과할 수 없습니다.', 'error');
            return;
        }

        try {
            const messageData = {
                id: Date.now().toString(),
                from: this.currentUser,
                to: friendUser,
                message: message,
                timestamp: new Date().toISOString()
            };

            // 양쪽 채팅 기록에 추가
            await Promise.all([
                window.githubAPI.addChatMessage(this.currentUser, friendUser, messageData),
                window.githubAPI.addChatMessage(friendUser, this.currentUser, messageData)
            ]);

            // 로컬 채팅 데이터 업데이트
            if (!this.chatMessages[friendUser]) {
                this.chatMessages[friendUser] = [];
            }
            this.chatMessages[friendUser].push(messageData);

            // 알림 생성
            await this.createNotification(friendUser, 'chat_message', `${this.currentUser}: ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`);
            
            this.updateChatUI(friendUser);
        } catch (error) {
            console.error('메시지 전송 오류:', error);
            window.app.showMessage('메시지 전송 중 오류가 발생했습니다.', 'error');
        }
    }

    // 일정 공유
    async shareEvent(friendUser, eventId) {
        try {
            const event = window.calendar.events.find(e => e.id === eventId);
            if (!event) {
                window.app.showMessage('공유할 일정을 찾을 수 없습니다.', 'error');
                return;
            }

            const shareData = {
                id: Date.now().toString(),
                eventId: eventId,
                event: event,
                sharedBy: this.currentUser,
                sharedTo: friendUser,
                timestamp: new Date().toISOString()
            };

            await window.githubAPI.shareEvent(friendUser, shareData);
            
            // 알림 생성
            await this.createNotification(friendUser, 'event_shared', `${this.currentUser}님이 일정을 공유했습니다: ${event.content}`);
            
            window.app.showMessage('일정을 공유했습니다.', 'success');
        } catch (error) {
            console.error('일정 공유 오류:', error);
            window.app.showMessage('일정 공유 중 오류가 발생했습니다.', 'error');
        }
    }

    // 알림 생성
    async createNotification(targetUser, type, message) {
        try {
            const notificationData = {
                id: Date.now().toString(),
                type: type,
                message: message,
                from: this.currentUser,
                timestamp: new Date().toISOString(),
                read: false
            };

            await window.githubAPI.addNotification(targetUser, notificationData);
        } catch (error) {
            console.error('알림 생성 오류:', error);
        }
    }

    // 폴링 시작 (실시간 업데이트 시뮬레이션)
    startPolling() {
        // 30초마다 새로운 데이터 확인
        setInterval(async () => {
            await this.loadSocialData();
            this.updateUI();
        }, 30000);
    }

    // UI 업데이트
    updateUI() {
        this.updateNotificationBadge();
        this.updateFriendsList();
        this.updateFriendRequests();
    }

    // 알림 배지 업데이트
    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length + 
                           this.friendRequests.length;
        
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = unreadCount > 0 ? unreadCount : '';
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    // 친구 목록 UI 업데이트
    updateFriendsList() {
        const friendsList = document.querySelector('.friends-list');
        if (friendsList) {
            friendsList.innerHTML = '';
            this.friends.forEach(friend => {
                const friendElement = this.createFriendElement(friend);
                friendsList.appendChild(friendElement);
            });
        }
    }

    // 친구 요청 UI 업데이트
    updateFriendRequests() {
        const requestsList = document.querySelector('.friend-requests-list');
        if (requestsList) {
            requestsList.innerHTML = '';
            this.friendRequests.forEach(request => {
                const requestElement = this.createFriendRequestElement(request);
                requestsList.appendChild(requestElement);
            });
        }
    }

    // 채팅 UI 업데이트
    updateChatUI(friendUser) {
        const chatContainer = document.querySelector(`.chat-messages[data-friend="${friendUser}"]`);
        if (chatContainer) {
            chatContainer.innerHTML = '';
            const messages = this.chatMessages[friendUser] || [];
            messages.forEach(message => {
                const messageElement = this.createChatMessageElement(message);
                chatContainer.appendChild(messageElement);
            });
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // 친구 요소 생성
    createFriendElement(friend) {
        const div = document.createElement('div');
        div.className = 'friend-item';
        div.innerHTML = `
            <span class="friend-name">${friend}</span>
            <button class="chat-btn" onclick="socialManager.openChat('${friend}')">채팅</button>
        `;
        return div;
    }

    // 친구 요청 요소 생성
    createFriendRequestElement(request) {
        const div = document.createElement('div');
        div.className = 'friend-request-item';
        div.innerHTML = `
            <span class="request-from">${request.from}</span>
            <div class="request-actions">
                <button class="accept-btn" onclick="socialManager.acceptFriendRequest('${request.id}', '${request.from}')">수락</button>
                <button class="reject-btn" onclick="socialManager.rejectFriendRequest('${request.id}')">거절</button>
            </div>
        `;
        return div;
    }

    // 채팅 메시지 요소 생성
    createChatMessageElement(message) {
        const div = document.createElement('div');
        div.className = `chat-message ${message.from === this.currentUser ? 'sent' : 'received'}`;
        div.innerHTML = `
            <div class="message-content">${message.message}</div>
            <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
        `;
        return div;
    }

    // 채팅 창 열기
    openChat(friendUser) {
        // 채팅 모달 표시 로직
        const modal = document.getElementById('chatModal');
        if (modal) {
            modal.style.display = 'block';
            modal.setAttribute('data-friend', friendUser);
            document.querySelector('.chat-friend-name').textContent = friendUser;
            this.updateChatUI(friendUser);
        }
    }
}

// 전역 변수로 설정
window.socialManager = null;

