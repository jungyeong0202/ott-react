import { useEffect, useRef } from 'react'

let apiPromise;
const loadYouTubeApi = () => {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
        const previousReady = window.onYouTubeIframeAPIReady;
        const timeout = window.setTimeout(() => {
            apiPromise = null;
            reject(new Error('YouTube 플레이어를 불러오지 못했습니다.'));
        }, 15000);
        window.onYouTubeIframeAPIReady = () => {
            window.clearTimeout(timeout);
            resolve(window.YT);
            if (typeof previousReady === 'function') previousReady();
        };
        if (!document.getElementById('ott-youtube-api')) {
            const script = document.createElement('script');
            script.id = 'ott-youtube-api';
            script.src = 'https://www.youtube.com/iframe_api';
            script.onerror = () => {
                window.clearTimeout(timeout);
                script.remove();
                apiPromise = null;
                reject(new Error('YouTube 플레이어를 불러오지 못했습니다.'));
            };
            document.head.appendChild(script);
        }
    });
    return apiPromise;
};

export const YouTubePlayer = ({ videoId, title, onError }) => {
    const containerRef = useRef(null);
    useEffect(() => {
        let active = true;
        let player;
        const container = containerRef.current;
        loadYouTubeApi().then((YT) => {
            if (!active) return;
            const mount = document.createElement('div');
            container.appendChild(mount);
            player = new YT.Player(mount, {
                width: '100%', height: '100%', videoId,
                playerVars: { autoplay: 1, mute: 1, playsinline: 1, rel: 0, origin: window.location.origin },
                events: {
                    onReady: (event) => {
                        if (!active) return;
                        event.target.getIframe().title = title;
                        event.target.getIframe().referrerPolicy = 'strict-origin-when-cross-origin';
                        event.target.mute();
                        event.target.playVideo();
                    },
                    onError: (event) => {
                        if (!active) return;
                        const message = [101, 150].includes(event.data)
                            ? '업로더가 외부 재생을 허용하지 않은 영상입니다. 다른 영상을 선택하거나 YouTube에서 열어 주세요.'
                            : '이 영상을 재생할 수 없습니다. 다른 영상을 선택하거나 YouTube에서 열어 주세요.';
                        onError(videoId, message);
                    }
                }
            });
        }).catch(() => {
            if (active) onError(videoId, 'YouTube 플레이어를 불러오지 못했습니다. YouTube에서 영상을 열어 주세요.');
        });
        return () => {
            active = false;
            player?.destroy();
            container.replaceChildren();
        };
    }, [videoId, title, onError]);

    return <div ref={containerRef} className='w-full h-full [&_iframe]:w-full [&_iframe]:h-full' />;
}
