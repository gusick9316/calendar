// GitHub API 클래스
class GitHubAPI {
    constructor() {
        this.baseUrl = GITHUB_CONFIG.apiUrl;
        this.username = GITHUB_CONFIG.username;
        this.repository = GITHUB_CONFIG.repository;
        this.token = GITHUB_CONFIG.token;
    }

    // API 요청 헤더
    getHeaders() {
        return {
            'Authorization': `token ${this.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        };
    }

    // 파일 존재 여부 확인
    async fileExists(path) {
        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${this.username}/${this.repository}/contents/${path}`,
                {
                    method: 'GET',
                    headers: this.getHeaders()
                }
            );
            return response.ok;
        } catch (error) {
            console.error('파일 존재 확인 오류:', error);
            return false;
        }
    }

    // 파일 내용 가져오기
    async getFile(path) {
        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${this.username}/${this.repository}/contents/${path}`,
                {
                    method: 'GET',
                    headers: this.getHeaders()
                }
            );

            if (!response.ok) {
                throw new Error(`파일을 가져올 수 없습니다: ${response.status}`);
            }

            const data = await response.json();
            const content = atob(data.content);
            return {
                content: content,
                sha: data.sha
            };
        } catch (error) {
            console.error('파일 가져오기 오류:', error);
            throw error;
        }
    }

    // 파일 생성 또는 업데이트
    async createOrUpdateFile(path, content, message, sha = null) {
        try {
            const body = {
                message: message,
                content: btoa(unescape(encodeURIComponent(content)))
            };

            if (sha) {
                body.sha = sha;
            }

            const response = await fetch(
                `${this.baseUrl}/repos/${this.username}/${this.repository}/contents/${path}`,
                {
                    method: 'PUT',
                    headers: this.getHeaders(),
                    body: JSON.stringify(body)
                }
            );

            if (!response.ok) {
                throw new Error(`파일 저장 실패: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('파일 저장 오류:', error);
            throw error;
        }
    }

    // 파일 삭제
    async deleteFile(path, message, sha) {
        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${this.username}/${this.repository}/contents/${path}`,
                {
                    method: 'DELETE',
                    headers: this.getHeaders(),
                    body: JSON.stringify({
                        message: message,
                        sha: sha
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`파일 삭제 실패: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('파일 삭제 오류:', error);
            throw error;
        }
    }

    // 디렉토리 내용 가져오기
    async getDirectoryContents(path) {
        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${this.username}/${this.repository}/contents/${path}`,
                {
                    method: 'GET',
                    headers: this.getHeaders()
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    return [];
                }
                throw new Error(`디렉토리 내용을 가져올 수 없습니다: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('디렉토리 내용 가져오기 오류:', error);
            return [];
        }
    }

    // 사용자 계정 생성
    async createUserAccount(username, password) {
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
                         (now.getMonth() + 1).toString().padStart(2, '0') +
                         now.getDate().toString().padStart(2, '0') +
                         now.getHours().toString().padStart(2, '0') +
                         now.getMinutes().toString().padStart(2, '0') +
                         now.getSeconds().toString().padStart(2, '0');

        const filename = `${timestamp}.json`;
        const path = `${GITHUB_CONFIG.accountsPath}/${filename}`;

        const accountData = {
            username: username,
            password: password,
            createdAt: now.toISOString(),
            memos: [],
            friends: [],
            notifications: []
        };

        await this.createOrUpdateFile(
            path,
            JSON.stringify(accountData, null, 2),
            `새 사용자 계정 생성: ${username}`
        );

        return filename;
    }

    // 사용자 계정 확인
    async verifyUserAccount(username, password) {
        try {
            const accounts = await this.getDirectoryContents(GITHUB_CONFIG.accountsPath);
            
            for (const account of accounts) {
                if (account.type === 'file' && account.name.endsWith('.json')) {
                    const fileData = await this.getFile(account.path);
                    const accountData = JSON.parse(fileData.content);
                    
                    if (accountData.username === username && accountData.password === password) {
                        return {
                            filename: account.name,
                            data: accountData,
                            sha: fileData.sha
                        };
                    }
                }
            }
            
            return null;
        } catch (error) {
            console.error('사용자 계정 확인 오류:', error);
            throw error;
        }
    }

    // 사용자명 중복 확인
    async checkUsernameExists(username) {
        try {
            const accounts = await this.getDirectoryContents(GITHUB_CONFIG.accountsPath);
            
            for (const account of accounts) {
                if (account.type === 'file' && account.name.endsWith('.json')) {
                    const fileData = await this.getFile(account.path);
                    const accountData = JSON.parse(fileData.content);
                    
                    if (accountData.username === username) {
                        return true;
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.error('사용자명 중복 확인 오류:', error);
            throw error;
        }
    }

    // 사용자 데이터 업데이트
    async updateUserData(filename, userData) {
        try {
            const path = `${GITHUB_CONFIG.accountsPath}/${filename}`;
            const fileData = await this.getFile(path);
            
            await this.createOrUpdateFile(
                path,
                JSON.stringify(userData, null, 2),
                `사용자 데이터 업데이트: ${userData.username}`,
                fileData.sha
            );
        } catch (error) {
            console.error('사용자 데이터 업데이트 오류:', error);
            throw error;
        }
    }

    // 월별 배경 이미지 가져오기
    async getMonthlyBackgroundImages(month) {
        try {
            const monthStr = month.toString().padStart(2, '0');
            const path = `${GITHUB_CONFIG.calendarPath}/${monthStr}`;
            const contents = await this.getDirectoryContents(path);
            
            const images = contents.filter(item => 
                item.type === 'file' && 
                /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name)
            );
            
            return images.map(img => img.download_url);
        } catch (error) {
            console.error('배경 이미지 가져오기 오류:', error);
            return [];
        }
    }

    // 모든 사용자 목록 가져오기 (친구 검색용)
    async getAllUsers() {
        try {
            const accounts = await this.getDirectoryContents(GITHUB_CONFIG.accountsPath);
            const users = [];
            
            for (const account of accounts) {
                if (account.type === 'file' && account.name.endsWith('.json')) {
                    const fileData = await this.getFile(account.path);
                    const accountData = JSON.parse(fileData.content);
                    users.push({
                        username: accountData.username,
                        filename: account.name
                    });
                }
            }
            
            return users;
        } catch (error) {
            console.error('사용자 목록 가져오기 오류:', error);
            return [];
        }
    }
}

// GitHub API 인스턴스 생성
const githubAPI = new GitHubAPI();

