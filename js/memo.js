// 메모 관리 클래스
class MemoManager {
    constructor() {
        this.currentMemo = null;
        this.isEditing = false;
        this.selectedColor = APP_CONFIG.colors[0];
        this.init();
    }

    // 초기화
    init() {
        this.setupEventListeners();
        this.setupColorSelection();
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 메모 모달 관련
        document.getElementById('closeMemoModal').addEventListener('click', () => {
            this.closeMemoModal();
        });

        document.getElementById('saveMemoBtn').addEventListener('click', () => {
            this.saveMemo();
        });

        document.getElementById('cancelMemoBtn').addEventListener('click', () => {
            this.closeMemoModal();
        });

        // 메모 목록 모달 관련
        document.getElementById('closeMemoListModal').addEventListener('click', () => {
            this.closeMemoListModal();
        });

        // 메모 내용 글자 수 카운터
        document.getElementById('memoText').addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
        });

        // 모달 외부 클릭 시 닫기
        document.getElementById('memoModal').addEventListener('click', (e) => {
            if (e.target.id === 'memoModal') {
                this.closeMemoModal();
            }
        });

        document.getElementById('memoListModal').addEventListener('click', (e) => {
            if (e.target.id === 'memoListModal') {
                this.closeMemoListModal();
            }
        });

        // 날짜 입력 유효성 검사
        document.getElementById('startDate').addEventListener('change', () => {
            this.validateDateRange();
        });

        document.getElementById('endDate').addEventListener('change', () => {
            this.validateDateRange();
        });
    }

    // 색상 선택 설정
    setupColorSelection() {
        const colorOptions = document.querySelectorAll('.color-option');
        
        colorOptions.forEach((option, index) => {
            option.addEventListener('click', () => {
                // 이전 선택 해제
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                
                // 새로운 색상 선택
                option.classList.add('selected');
                this.selectedColor = option.dataset.color;
            });
        });

        // 첫 번째 색상을 기본 선택
        if (colorOptions.length > 0) {
            colorOptions[0].classList.add('selected');
        }
    }

    // 메모 모달 열기
    openMemoModal(memo = null) {
        if (!authManager.isLoggedIn()) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }

        this.currentMemo = memo;
        this.isEditing = memo !== null;

        // 모달 제목 설정
        const modalTitle = document.getElementById('memoModalTitle');
        modalTitle.textContent = this.isEditing ? '메모 수정' : '메모 추가';

        // 폼 초기화 또는 데이터 로드
        if (this.isEditing) {
            this.loadMemoData(memo);
        } else {
            this.resetMemoForm();
        }

        // 모달 표시
        document.getElementById('memoModal').classList.add('active');
    }

    // 메모 데이터 로드 (수정 시)
    loadMemoData(memo) {
        document.getElementById('startDate').value = memo.startDate;
        document.getElementById('endDate').value = memo.endDate;
        document.getElementById('memoText').value = memo.content;
        
        // 색상 선택
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === memo.color) {
                option.classList.add('selected');
                this.selectedColor = memo.color;
            }
        });

        this.updateCharCount(memo.content.length);
    }

    // 메모 폼 초기화
    resetMemoForm() {
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('memoText').value = '';
        
        // 첫 번째 색상 선택
        const colorOptions = document.querySelectorAll('.color-option');
        colorOptions.forEach((option, index) => {
            option.classList.remove('selected');
            if (index === 0) {
                option.classList.add('selected');
                this.selectedColor = option.dataset.color;
            }
        });

        this.updateCharCount(0);
    }

    // 메모 모달 닫기
    closeMemoModal() {
        document.getElementById('memoModal').classList.remove('active');
        this.currentMemo = null;
        this.isEditing = false;
    }

    // 메모 저장
    async saveMemo() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const content = document.getElementById('memoText').value.trim();

        // 유효성 검사
        if (!startDate || !endDate) {
            showToast('시작 날짜와 종료 날짜를 선택해주세요.', 'error');
            return;
        }

        if (!content) {
            showToast('메모 내용을 입력해주세요.', 'error');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            showToast('시작 날짜는 종료 날짜보다 이전이어야 합니다.', 'error');
            return;
        }

        // 날짜 겹침 확인 (수정 시 현재 메모 제외)
        if (!this.isEditing && this.checkDateOverlap(startDate, endDate)) {
            showToast('선택한 날짜 범위에 이미 메모가 있습니다.', 'error');
            return;
        }

        try {
            showLoading(true);

            const user = authManager.getCurrentUser();
            
            if (this.isEditing) {
                // 메모 수정
                const memoIndex = user.memos.findIndex(m => m.id === this.currentMemo.id);
                if (memoIndex !== -1) {
                    user.memos[memoIndex] = {
                        ...user.memos[memoIndex],
                        startDate: startDate,
                        endDate: endDate,
                        content: content,
                        color: this.selectedColor,
                        updatedAt: new Date().toISOString()
                    };
                }
            } else {
                // 새 메모 추가
                const newMemo = {
                    id: this.generateMemoId(),
                    startDate: startDate,
                    endDate: endDate,
                    content: content,
                    color: this.selectedColor,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                if (!user.memos) {
                    user.memos = [];
                }
                user.memos.push(newMemo);
            }

            // GitHub에 저장
            await authManager.updateUserData();

            // 달력 새로고침
            if (window.calendarManager) {
                window.calendarManager.refresh();
            }

            this.closeMemoModal();
            showToast(this.isEditing ? '메모가 수정되었습니다.' : '메모가 추가되었습니다.', 'success');

        } catch (error) {
            console.error('메모 저장 오류:', error);
            showToast('메모 저장 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // 메모 삭제
    async deleteMemo(memoId) {
        try {
            showLoading(true);

            const user = authManager.getCurrentUser();
            const memoIndex = user.memos.findIndex(m => m.id === memoId);
            
            if (memoIndex !== -1) {
                user.memos.splice(memoIndex, 1);
                
                // GitHub에 저장
                await authManager.updateUserData();

                // 달력 새로고침
                if (window.calendarManager) {
                    window.calendarManager.refresh();
                }

                showToast('메모가 삭제되었습니다.', 'success');
            }

        } catch (error) {
            console.error('메모 삭제 오류:', error);
            showToast('메모 삭제 중 오류가 발생했습니다.', 'error');
        } finally {
            showLoading(false);
        }
    }

    // 메모 수정
    editMemo(memo) {
        this.openMemoModal(memo);
    }

    // 메모 목록 모달 열기
    openMemoListModal() {
        if (!authManager.isLoggedIn()) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }

        this.renderMemoList();
        document.getElementById('memoListModal').classList.add('active');
    }

    // 메모 목록 모달 닫기
    closeMemoListModal() {
        document.getElementById('memoListModal').classList.remove('active');
    }

    // 메모 목록 렌더링
    renderMemoList() {
        const user = authManager.getCurrentUser();
        const memoList = document.getElementById('memoList');
        
        if (!user || !user.memos || user.memos.length === 0) {
            memoList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">등록된 메모가 없습니다.</p>';
            return;
        }

        // 날짜순으로 정렬 (최신순)
        const sortedMemos = [...user.memos].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        memoList.innerHTML = '';

        sortedMemos.forEach(memo => {
            const memoItem = document.createElement('div');
            memoItem.className = 'memo-list-item';
            memoItem.style.borderLeftColor = memo.color;

            const startDate = new Date(memo.startDate).toLocaleDateString('ko-KR');
            const endDate = new Date(memo.endDate).toLocaleDateString('ko-KR');
            const dateRange = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;

            memoItem.innerHTML = `
                <h4>${memo.content}</h4>
                <p>${dateRange}</p>
                <div class="memo-actions">
                    <button class="btn btn-secondary edit-memo-btn" data-memo-id="${memo.id}">수정</button>
                    <button class="btn btn-outline delete-memo-btn" data-memo-id="${memo.id}">삭제</button>
                </div>
            `;

            // 수정 버튼 이벤트
            memoItem.querySelector('.edit-memo-btn').addEventListener('click', () => {
                this.closeMemoListModal();
                this.editMemo(memo);
            });

            // 삭제 버튼 이벤트
            memoItem.querySelector('.delete-memo-btn').addEventListener('click', () => {
                if (confirm('정말로 이 메모를 삭제하시겠습니까?')) {
                    this.deleteMemo(memo.id);
                    this.renderMemoList(); // 목록 새로고침
                }
            });

            memoList.appendChild(memoItem);
        });
    }

    // 날짜 겹침 확인
    checkDateOverlap(startDate, endDate) {
        const user = authManager.getCurrentUser();
        if (!user || !user.memos) return false;

        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);

        return user.memos.some(memo => {
            const existingStart = new Date(memo.startDate);
            const existingEnd = new Date(memo.endDate);

            // 날짜 범위가 겹치는지 확인
            return (newStart <= existingEnd && newEnd >= existingStart);
        });
    }

    // 날짜 범위 유효성 검사
    validateDateRange() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (startDate && endDate) {
            if (new Date(startDate) > new Date(endDate)) {
                document.getElementById('endDate').value = startDate;
            }
        }
    }

    // 글자 수 업데이트
    updateCharCount(count) {
        document.getElementById('charCount').textContent = count;
        
        // 글자 수 제한 색상 변경
        const charCountElement = document.getElementById('charCount');
        if (count >= APP_CONFIG.maxMemoLength * 0.9) {
            charCountElement.style.color = '#e74c3c';
        } else if (count >= APP_CONFIG.maxMemoLength * 0.7) {
            charCountElement.style.color = '#f39c12';
        } else {
            charCountElement.style.color = '#666';
        }
    }

    // 메모 ID 생성
    generateMemoId() {
        return 'memo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 메모 공유 코드 생성
    generateShareCode(memoId) {
        const user = authManager.getCurrentUser();
        return `${user.username}_${memoId}_${Date.now()}`;
    }

    // 공유 코드로 메모 가져오기
    async getMemoByShareCode(shareCode) {
        try {
            const [username, memoId] = shareCode.split('_');
            
            // 해당 사용자의 메모 찾기
            const users = await githubAPI.getAllUsers();
            const targetUser = users.find(u => u.username === username);
            
            if (!targetUser) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            const accountData = await githubAPI.getFile(`${GITHUB_CONFIG.accountsPath}/${targetUser.filename}`);
            const userData = JSON.parse(accountData.content);
            
            const memo = userData.memos.find(m => m.id === memoId);
            if (!memo) {
                throw new Error('메모를 찾을 수 없습니다.');
            }

            return {
                memo: memo,
                username: username
            };

        } catch (error) {
            console.error('공유 메모 가져오기 오류:', error);
            throw error;
        }
    }
}

// 메모 관리자 인스턴스 생성
window.memoManager = new MemoManager();

