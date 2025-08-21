// 친구 관리 클래스
class FriendsManager {
    constructor() {
        this.init();
    }

    // 초기화
    init() {
        this.setupEventListeners();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 친구 모달 관련
        document.getElementById('closeFriendsModal').addEventListener('click', () => {
            this.closeFriendsModal();
        });

        document.getElementById('searchFriendBtn').addEventListener('click', () => {
            this.searchFriend();
        });

        document.getElementById('friendSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchFriend();
            }
        });

        // 알림 모달 관련
        document.getElementById('closeNotificationsModal').addEventListener('click', () => {
            this.closeNotificationsModal();
        });

        // 모달 외부 클릭 시 닫기
        document.getElementById('friendsModal').addEventListener('click', (e) => {
            if (e.target.id === 'friendsModal') {
                this.closeFriendsModal();
            }
        });

        document.getElementById('notificationsModal').addEventListener('click', (e) => {
            if (e.target.id === 'notificationsModal') {
                this.closeNotificationsModal();
            }
        });
    }

    // 친구 모달 열기
    openFriendsModal() {
        if (!authManager.isLoggedIn()) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }

        this.renderFriendsList();
        document.getElementById('friendsModal').classList.add('active');
    }

    // 친구 모달 닫기
    closeFriendsModal() {
        document.getElementById('friendsModal').classList.remove('active');
        document.getElementById('friendSearch').value = '';
    }

    // 알림 모달 열기
    openNotificationsModal() {
        if (!authManager.isLoggedIn()) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }

        this.renderNotificationsList();
        document.getElementById('notificationsModal').classList.add('active');
    }

    // 알림 모달 닫기
    closeNotificationsModal() {
        document.getElementById('notificationsModal').classList.remove('active');
    }

    // 친구 검색
    async searchFriend() {
        const searchTerm = document.getElementById('friendSearch').value.trim();
        
        if (!searchTerm) {
            showToast('검색할 사용자명을 입력해주세요.', 'error');
            return;
        }

        const currentUser = authManager.getCurrentUser();
        if (searchTerm === currentUser.username) {
            showToast('자신을 친구로 추가할 수 없습니다.', 'error');
            return;
        }

        try {
            showLoading(true);
            
            const users = await githubAPI.getAllUsers();
            const targetUser = users.find(u => u.username === searchTerm);
            
            if (!targetUser) {
                showToast('해당 사용자를 찾을 수 없습니다.', 'error');
                return;
            }

            // 이미 친구인지 확인
            if (this.isFriend(searchTerm)) {
                showToast('이미 친구로 등록된 사용자입니다.', 'error');
                return;
            }

            // 이미 친구 요청을 보냈는지 확인
            if (this.hasPendingRequest(searchTerm)) {
                showToast('이미 친구 요청을 보낸 사용자입니다.', 'error');
                return;
            }

            // 친구 요청 보내기
            await this.sendFriendRequest(targetUser);
            showToast('친구 요청을 보냈습니다.', 'success');
            
            document.getElementById('friendSearch').value = '';

        } catch (error) {
            console.error('친구 검색 오류:', error);
            showToast('친구 검색 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // 친구 요청 보내기
    async sendFriendRequest(targetUser) {
        try {
            const currentUser = authManager.getCurrentUser();
            
            // 대상 사용자의 데이터 가져오기
            const targetAccountData = await githubAPI.getFile(`${GITHUB_CONFIG.accountsPath}/${targetUser.filename}`);
            const targetUserData = JSON.parse(targetAccountData.content);
            
            // 알림 추가
            if (!targetUserData.notifications) {
                targetUserData.notifications = [];
            }

            const notification = {
                id: this.generateNotificationId(),
                type: 'friend_request',
                from: currentUser.username,
                message: `${currentUser.username}님이 친구 요청을 보냈습니다.`,
                createdAt: new Date().toISOString(),
                read: false
            };

            targetUserData.notifications.push(notification);

            // 대상 사용자 데이터 업데이트
            await githubAPI.updateUserData(targetUser.filename, targetUserData);

        } catch (error) {
            console.error('친구 요청 보내기 오류:', error);
            throw error;
        }
    }

    // 친구 요청 수락
    async acceptFriendRequest(notificationId, fromUsername) {
        try {
            showLoading(true);
            
            const currentUser = authManager.getCurrentUser();
            
            // 현재 사용자의 친구 목록에 추가
            if (!currentUser.friends) {
                currentUser.friends = [];
            }
            
            currentUser.friends.push({
                username: fromUsername,
                addedAt: new Date().toISOString()
            });

            // 알림 제거
            currentUser.notifications = currentUser.notifications.filter(n => n.id !== notificationId);

            // 현재 사용자 데이터 업데이트
            await authManager.updateUserData();

            // 요청을 보낸 사용자의 친구 목록에도 추가
            const users = await githubAPI.getAllUsers();
            const fromUser = users.find(u => u.username === fromUsername);
            
            if (fromUser) {
                const fromAccountData = await githubAPI.getFile(`${GITHUB_CONFIG.accountsPath}/${fromUser.filename}`);
                const fromUserData = JSON.parse(fromAccountData.content);
                
                if (!fromUserData.friends) {
                    fromUserData.friends = [];
                }
                
                fromUserData.friends.push({
                    username: currentUser.username,
                    addedAt: new Date().toISOString()
                });

                // 수락 알림 추가
                if (!fromUserData.notifications) {
                    fromUserData.notifications = [];
                }

                fromUserData.notifications.push({
                    id: this.generateNotificationId(),
                    type: 'friend_accepted',
                    from: currentUser.username,
                    message: `${currentUser.username}님이 친구 요청을 수락했습니다.`,
                    createdAt: new Date().toISOString(),
                    read: false
                });

                await githubAPI.updateUserData(fromUser.filename, fromUserData);
            }

            this.renderNotificationsList();
            this.renderFriendsList();
            showToast('친구 요청을 수락했습니다.', 'success');

        } catch (error) {
            console.error('친구 요청 수락 오류:', error);
            showToast('친구 요청 수락 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // 친구 요청 거절
    async rejectFriendRequest(notificationId) {
        try {
            const currentUser = authManager.getCurrentUser();
            
            // 알림 제거
            currentUser.notifications = currentUser.notifications.filter(n => n.id !== notificationId);
            
            await authManager.updateUserData();
            
            this.renderNotificationsList();
            showToast('친구 요청을 거절했습니다.', 'success');

        } catch (error) {
            console.error('친구 요청 거절 오류:', error);
            showToast('친구 요청 거절 중 오류가 발생했습니다.', 'error');
        }
    }

    // 친구 목록 렌더링
    renderFriendsList() {
        const currentUser = authManager.getCurrentUser();
        const friendsList = document.getElementById('friendsList');
        
        if (!currentUser || !currentUser.friends || currentUser.friends.length === 0) {
            friendsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">등록된 친구가 없습니다.</p>';
            return;
        }

        friendsList.innerHTML = '';

        currentUser.friends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item';

            friendItem.innerHTML = `
                <div class="friend-info">${friend.username}</div>
                <div>
                    <button class="btn btn-secondary chat-btn" data-username="${friend.username}">채팅</button>
                    <button class="btn btn-outline remove-friend-btn" data-username="${friend.username}">삭제</button>
                </div>
            `;

            // 채팅 버튼 이벤트
            friendItem.querySelector('.chat-btn').addEventListener('click', () => {
                this.closeFriendsModal();
                if (window.chatManager) {
                    window.chatManager.openChatModal(friend.username);
                }
            });

            // 친구 삭제 버튼 이벤트
            friendItem.querySelector('.remove-friend-btn').addEventListener('click', () => {
                if (confirm(`정말로 ${friend.username}님을 친구에서 삭제하시겠습니까?`)) {
                    this.removeFriend(friend.username);
                }
            });

            friendsList.appendChild(friendItem);
        });
    }

    // 알림 목록 렌더링
    renderNotificationsList() {
        const currentUser = authManager.getCurrentUser();
        const notificationsList = document.getElementById('notificationsList');
        
        if (!currentUser || !currentUser.notifications || currentUser.notifications.length === 0) {
            notificationsList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">새로운 알림이 없습니다.</p>';
            return;
        }

        // 최신순으로 정렬
        const sortedNotifications = [...currentUser.notifications].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        notificationsList.innerHTML = '';

        sortedNotifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item ${notification.read ? 'read' : 'unread'}`;

            const createdAt = new Date(notification.createdAt).toLocaleString('ko-KR');

            if (notification.type === 'friend_request') {
                notificationItem.innerHTML = `
                    <div class="notification-content">
                        <p>${notification.message}</p>
                        <small>${createdAt}</small>
                    </div>
                    <div class="notification-actions">
                        <button class="btn btn-primary accept-btn" data-id="${notification.id}" data-from="${notification.from}">수락</button>
                        <button class="btn btn-outline reject-btn" data-id="${notification.id}">거절</button>
                    </div>
                `;

                // 수락 버튼 이벤트
                notificationItem.querySelector('.accept-btn').addEventListener('click', () => {
                    this.acceptFriendRequest(notification.id, notification.from);
                });

                // 거절 버튼 이벤트
                notificationItem.querySelector('.reject-btn').addEventListener('click', () => {
                    this.rejectFriendRequest(notification.id);
                });

            } else {
                notificationItem.innerHTML = `
                    <div class="notification-content">
                        <p>${notification.message}</p>
                        <small>${createdAt}</small>
                    </div>
                    <div class="notification-actions">
                        <button class="btn btn-outline mark-read-btn" data-id="${notification.id}">확인</button>
                    </div>
                `;

                // 확인 버튼 이벤트
                notificationItem.querySelector('.mark-read-btn').addEventListener('click', () => {
                    this.markNotificationAsRead(notification.id);
                });
            }

            notificationsList.appendChild(notificationItem);
        });
    }

    // 알림 읽음 처리
    async markNotificationAsRead(notificationId) {
        try {
            const currentUser = authManager.getCurrentUser();
            const notification = currentUser.notifications.find(n => n.id === notificationId);
            
            if (notification) {
                notification.read = true;
                await authManager.updateUserData();
                this.renderNotificationsList();
            }

        } catch (error) {
            console.error('알림 읽음 처리 오류:', error);
        }
    }

    // 친구 삭제
    async removeFriend(username) {
        try {
            showLoading(true);
            
            const currentUser = authManager.getCurrentUser();
            
            // 현재 사용자의 친구 목록에서 제거
            currentUser.friends = currentUser.friends.filter(f => f.username !== username);
            await authManager.updateUserData();

            // 상대방의 친구 목록에서도 제거
            const users = await githubAPI.getAllUsers();
            const targetUser = users.find(u => u.username === username);
            
            if (targetUser) {
                const targetAccountData = await githubAPI.getFile(`${GITHUB_CONFIG.accountsPath}/${targetUser.filename}`);
                const targetUserData = JSON.parse(targetAccountData.content);
                
                if (targetUserData.friends) {
                    targetUserData.friends = targetUserData.friends.filter(f => f.username !== currentUser.username);
                    await githubAPI.updateUserData(targetUser.filename, targetUserData);
                }
            }

            this.renderFriendsList();
            showToast('친구가 삭제되었습니다.', 'success');

        } catch (error) {
            console.error('친구 삭제 오류:', error);
            showToast('친구 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // 친구 여부 확인
    isFriend(username) {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser || !currentUser.friends) return false;
        
        return currentUser.friends.some(f => f.username === username);
    }

    // 대기 중인 친구 요청 확인
    hasPendingRequest(username) {
        // 실제로는 대상 사용자의 알림을 확인해야 하지만,
        // 간단히 하기 위해 여기서는 false 반환
        return false;
    }

    // 알림 ID 생성
    generateNotificationId() {
        return 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 읽지 않은 알림 개수 가져오기
    getUnreadNotificationsCount() {
        const currentUser = authManager.getCurrentUser();
        if (!currentUser || !currentUser.notifications) return 0;
        
        return currentUser.notifications.filter(n => !n.read).length;
    }

    // 알림 배지 업데이트
    updateNotificationBadge() {
        const count = this.getUnreadNotificationsCount();
        const notificationsBtn = document.getElementById('notificationsBtn');
        
        // 기존 배지 제거
        const existingBadge = notificationsBtn.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // 새 배지 추가
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.textContent = count > 99 ? '99+' : count.toString();
            badge.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: #e74c3c;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            
            notificationsBtn.style.position = 'relative';
            notificationsBtn.appendChild(badge);
        }
    }
}

// 친구 관리자 인스턴스 생성
window.friendsManager = new FriendsManager();

