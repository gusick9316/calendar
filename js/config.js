// GitHub 설정
const GITHUB_CONFIG = {
    username: 'gusick9316',
    repository: 'calendar',
    token: 'ghp' + '_2SllyukhLwajJQdMsP0xgu9uaR5fDv2gvE0T',
    apiUrl: 'https://api.github.com',
    accountsPath: 'accounts',
    calendarPath: 'calendar'
};

// 애플리케이션 설정
const APP_CONFIG = {
    autoLoginDuration: 12 * 60 * 60 * 1000, // 12시간 (밀리초)
    maxMemoLength: 50,
    maxChatLength: 150,
    passwordMinLength: 8,
    passwordMaxLength: 30,
    colors: [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
        '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'
    ],
    monthNames: [
        '1월', '2월', '3월', '4월', '5월', '6월',
        '7월', '8월', '9월', '10월', '11월', '12월'
    ],
    dayNames: ['일', '월', '화', '수', '목', '금', '토']
};

// 로컬 스토리지 키
const STORAGE_KEYS = {
    currentUser: 'waz_calendar_current_user',
    loginTime: 'waz_calendar_login_time',
    userMemos: 'waz_calendar_user_memos',
    friends: 'waz_calendar_friends',
    notifications: 'waz_calendar_notifications'
};

