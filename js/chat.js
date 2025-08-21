// 채팅 관리 클래스
class ChatManager {
    constructor() {
        this.currentChatUser = null;
        this.chatMessages = [];
        this.init();
    }

    // 초기화
    init() {
        this.setupEventListeners();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 채팅 모달 관련
        document.getElementById('closeChatModal').addEventListener('click', () => {
            this.closeChatModal();
        });

        document.getElementById('sendMessageBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // 모달 외부 클릭 시 닫기
        document.getElementById('chatModal').addEventListener('click', (e) => {
            if (e.target.id === 'chatModal') {
                this.closeChatModal();
            }
        });

        // 채팅 입력 글자 수 제한
        document.getElementById('chatInput').addEventListener('input', (e) => {
            const maxLength = APP_CONFIG.maxChatLength;
            if (e.target.value.length > maxLength) {
                e.target.value = e.target.value.substring(0, maxLength);
            }
        });
    }

    // 채팅 모달 열기
    async openChatModal(username) {
        if (!authManager.isLoggedIn()) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }

        this.currentChatUser = username;
        
        // 모달 제목 설정
        document.getElementById('chatTitle').textContent = `${username}님과의 채팅`;
        
        // 채팅 메시지 로드
        await this.loadChatMessages();
        
        // 모달 표시
        document.getElementById('chatModal').classList.add('active');
        
        // 입력 필드 포커스
        document.getElementById('chatInput').focus();
    }

    // 채팅 모달 닫기
    closeChatModal() {
        document.getElementById('chatModal').classList.remove('active');
        this.currentChatUser = null;
        this.chatMessages = [];
        document.getElementById('chatInput').value = '';
    }

    // 채팅 메시지 로드
    async loadChatMessages() {
        try {
            showLoading(true);
            
            const currentUser = authManager.getCurrentUser();
            const chatId = this.generateChatId(currentUser.username, this.currentChatUser);
            
            // GitHub에서 채팅 데이터 가져오기
            const chatPath = `chats/${chatId}.json`;
            const chatExists = await githubAPI.fileExists(chatPath);
            
            if (chatExists) {
                const chatData = await githubAPI.getFile(chatPath);
                this.chatMessages = JSON.parse(chatData.content).messages || [];
            } else {
                this.chatMessages = [];
            }
            
            this.renderChatMessages();

        } catch (error) {
            console.error('채팅 메시지 로드 오류:', error);
            this.chatMessages = [];
            this.renderChatMessages();
        } finally {
            showLoading(false);
        }
    }

    // 메시지 전송
    async sendMessage() {
        const messageInput = document.getElementById('chatInput');
        const messageText = messageInput.value.trim();
        
        if (!messageText) {
            return;
        }

        if (messageText.length > APP_CONFIG.maxChatLength) {
            showToast(`메시지는 ${APP_CONFIG.maxChatLength}자 이내로 입력해주세요.`, 'error');
            return;
        }

        try {
            showLoading(true);
            
            const currentUser = authManager.getCurrentUser();
            const message = {
                id: this.generateMessageId(),
                from: currentUser.username,
                to: this.currentChatUser,
                content: messageText,
                timestamp: new Date().toISOString(),
                type: 'text'
            };

            // 메시지 추가
            this.chatMessages.push(message);
            
            // GitHub에 저장
            await this.saveChatMessages();
            
            // 화면 업데이트
            this.renderChatMessages();
            messageInput.value = '';
            
            // 상대방에게 알림 전송
            await this.sendChatNotification(message);

        } catch (error) {
            console.error('메시지 전송 오류:', error);
            showToast('메시지 전송 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // 일정 공유 메시지 전송
    async shareSchedule(memoId) {
        if (!this.currentChatUser) {
            showToast('채팅 상대를 선택해주세요.', 'error');
            return;
        }

        try {
            showLoading(true);
            
            const currentUser = authManager.getCurrentUser();
            const memo = currentUser.memos.find(m => m.id === memoId);
            
            if (!memo) {
                showToast('공유할 일정을 찾을 수 없습니다.', 'error');
                return;
            }

            const shareCode = window.memoManager.generateShareCode(memoId);
            const message = {
                id: this.generateMessageId(),
                from: currentUser.username,
                to: this.currentChatUser,
                content: `일정을 공유했습니다: ${memo.content}`,
                timestamp: new Date().toISOString(),
                type: 'schedule_share',
                shareCode: shareCode,
                memo: memo
            };

            this.chatMessages.push(message);
            await this.saveChatMessages();
            this.renderChatMessages();
            
            showToast('일정이 공유되었습니다.', 'success');

        } catch (error) {
            console.error('일정 공유 오류:', error);
            showToast('일정 공유 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // 채팅 메시지 렌더링
    renderChatMessages() {
        const chatMessages = document.getElementById('chatMessages');
        const currentUser = authManager.getCurrentUser();
        
        chatMessages.innerHTML = '';
        
        if (this.chatMessages.length === 0) {
            chatMessages.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">아직 메시지가 없습니다.</p>';
            return;
        }

        this.chatMessages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${message.from === currentUser.username ? 'sent' : 'received'}`;
            
            const timestamp = new Date(message.timestamp).toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            if (message.type === 'schedule_share') {
                messageElement.innerHTML = `
                    <div class="message-content">
                        <div class="schedule-share">
                            <div class="schedule-info">
                                <strong>${message.memo.content}</strong>
                                <p>${new Date(message.memo.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(message.memo.endDate).toLocaleDateString('ko-KR')}</p>
                            </div>
                            ${message.from !== currentUser.username ? '<button class="btn btn-secondary view-schedule-btn">일정 보기</button>' : ''}
                        </div>
                        <small class="message-time">${timestamp}</small>
                    </div>
                `;

                // 일정 보기 버튼 이벤트
                const viewBtn = messageElement.querySelector('.view-schedule-btn');
                if (viewBtn) {
                    viewBtn.addEventListener('click', () => {
                        this.viewSharedSchedule(message.memo);
                    });
                }
            } else {
                messageElement.innerHTML = `
                    <div class="message-content">
                        <p>${this.escapeHtml(message.content)}</p>
                        <small class="message-time">${timestamp}</small>
                    </div>
                `;
            }

            chatMessages.appendChild(messageElement);
        });

        // 스크롤을 맨 아래로
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 공유된 일정 보기
    viewSharedSchedule(memo) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>공유된 일정</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="shared-schedule-details">
                        <h4>${memo.content}</h4>
                        <p><strong>기간:</strong> ${new Date(memo.startDate).toLocaleDateString('ko-KR')} ~ ${new Date(memo.endDate).toLocaleDateString('ko-KR')}</p>
                        <div class="color-preview" style="background-color: ${memo.color}; width: 30px; height: 30px; border-radius: 50%; margin: 10px 0;"></div>
                        <p><strong>생성일:</strong> ${new Date(memo.createdAt).toLocaleString('ko-KR')}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal-btn">닫기</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 닫기 이벤트
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('.close-btn').addEventListener('click', closeModal);
        modal.querySelector('.close-modal-btn').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // 채팅 메시지 저장
    async saveChatMessages() {
        try {
            const currentUser = authManager.getCurrentUser();
            const chatId = this.generateChatId(currentUser.username, this.currentChatUser);
            const chatPath = `chats/${chatId}.json`;
            
            const chatData = {
                participants: [currentUser.username, this.currentChatUser].sort(),
                messages: this.chatMessages,
                lastUpdated: new Date().toISOString()
            };

            const chatExists = await githubAPI.fileExists(chatPath);
            let sha = null;
            
            if (chatExists) {
                const existingData = await githubAPI.getFile(chatPath);
                sha = existingData.sha;
            }

            await githubAPI.createOrUpdateFile(
                chatPath,
                JSON.stringify(chatData, null, 2),
                `채팅 메시지 업데이트: ${currentUser.username} - ${this.currentChatUser}`,
                sha
            );

        } catch (error) {
            console.error('채팅 메시지 저장 오류:', error);
            throw error;
        }
    }

    // 채팅 알림 전송
    async sendChatNotification(message) {
        try {
            const users = await githubAPI.getAllUsers();
            const targetUser = users.find(u => u.username === this.currentChatUser);
            
            if (!targetUser) return;

            const targetAccountData = await githubAPI.getFile(`${GITHUB_CONFIG.accountsPath}/${targetUser.filename}`);
            const targetUserData = JSON.parse(targetAccountData.content);
            
            if (!targetUserData.notifications) {
                targetUserData.notifications = [];
            }

            const notification = {
                id: this.generateNotificationId(),
                type: 'chat_message',
                from: message.from,
                message: `${message.from}님이 메시지를 보냈습니다: ${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}`,
                createdAt: new Date().toISOString(),
                read: false
            };

            targetUserData.notifications.push(notification);
            await githubAPI.updateUserData(targetUser.filename, targetUserData);

        } catch (error) {
            console.error('채팅 알림 전송 오류:', error);
        }
    }

    // 채팅 ID 생성 (두 사용자명을 알파벳 순으로 정렬하여 일관성 유지)
    generateChatId(user1, user2) {
        const participants = [user1, user2].sort();
        return `${participants[0]}_${participants[1]}`;
    }

    // 메시지 ID 생성
    generateMessageId() {
        return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 알림 ID 생성
    generateNotificationId() {
        return 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 채팅 목록 가져오기 (친구 목록에서 사용)
    async getChatList() {
        try {
            const currentUser = authManager.getCurrentUser();
            if (!currentUser || !currentUser.friends) return [];

            const chatList = [];
            
            for (const friend of currentUser.friends) {
                const chatId = this.generateChatId(currentUser.username, friend.username);
                const chatPath = `chats/${chatId}.json`;
                
                const chatExists = await githubAPI.fileExists(chatPath);
                if (chatExists) {
                    const chatData = await githubAPI.getFile(chatPath);
                    const chat = JSON.parse(chatData.content);
                    
                    const lastMessage = chat.messages[chat.messages.length - 1];
                    chatList.push({
                        username: friend.username,
                        lastMessage: lastMessage,
                        lastUpdated: chat.lastUpdated
                    });
                }
            }

            // 최근 메시지 순으로 정렬
            return chatList.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

        } catch (error) {
            console.error('채팅 목록 가져오기 오류:', error);
            return [];
        }
    }
}

// 채팅 관리자 인스턴스 생성
window.chatManager = new ChatManager();

