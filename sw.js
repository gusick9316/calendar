// 와즈달력 서비스 워커
const CACHE_NAME = 'waz-calendar-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/config.js',
    '/js/github-api.js',
    '/js/auth.js',
    '/js/calendar.js',
    '/js/memo.js',
    '/js/friends.js',
    '/js/chat.js',
    '/js/app.js'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
    console.log('서비스 워커 설치 중...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('캐시 열기 성공');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('모든 파일 캐시 완료');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('캐시 실패:', error);
            })
    );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
    console.log('서비스 워커 활성화 중...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('이전 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('서비스 워커 활성화 완료');
            return self.clients.claim();
        })
    );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', (event) => {
    // GitHub API 요청은 캐시하지 않음
    if (event.request.url.includes('api.github.com')) {
        return;
    }

    // GET 요청만 캐시
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에서 찾은 경우
                if (response) {
                    console.log('캐시에서 응답:', event.request.url);
                    return response;
                }

                // 네트워크에서 가져오기
                return fetch(event.request)
                    .then((response) => {
                        // 유효한 응답인지 확인
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 응답 복사 (스트림은 한 번만 사용 가능)
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.error('네트워크 요청 실패:', error);
                        
                        // 오프라인 상태에서 HTML 요청 시 캐시된 index.html 반환
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// 메시지 이벤트 (앱에서 서비스 워커로 메시지 전송 시)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 백그라운드 동기화 (향후 확장용)
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('백그라운드 동기화 실행');
        // 향후 오프라인 데이터 동기화 로직 추가
    }
});

// 푸시 알림 (향후 확장용)
self.addEventListener('push', (event) => {
    console.log('푸시 알림 수신:', event);
    
    const options = {
        body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
        icon: '/images/icon-192x192.png',
        badge: '/images/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '확인',
                icon: '/images/checkmark.png'
            },
            {
                action: 'close',
                title: '닫기',
                icon: '/images/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('와즈달력', options)
    );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
    console.log('알림 클릭:', event);
    
    event.notification.close();

    if (event.action === 'explore') {
        // 앱 열기
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // 알림만 닫기
        console.log('알림 닫기');
    }
});

console.log('와즈달력 서비스 워커 로드 완료');

