const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const LINK_STORAGE_KEY = 'ott-episode-youtube-links';

export const getEpisodeVideoKey = (tvId, seasonNumber, episodeNumber) => `${tvId}-${seasonNumber}-${episodeNumber}`;

export const parseYouTubeVideoId = (value) => {
    const input = value.trim();
    if (VIDEO_ID_PATTERN.test(input)) return input;
    try {
        const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
        const host = url.hostname.toLowerCase();
        const path = url.pathname.split('/').filter(Boolean);
        let videoId;
        if (host === 'youtu.be') videoId = path[0];
        else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(host)) {
            videoId = ['embed', 'shorts', 'live'].includes(path[0]) ? path[1] : url.searchParams.get('v');
        }
        return typeof videoId === 'string' && VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
    } catch {
        return null;
    }
};

export const readEpisodeVideoLinks = () => {
    if (typeof window === 'undefined') return {};
    try {
        const stored = JSON.parse(window.localStorage.getItem(LINK_STORAGE_KEY) || '{}');
        if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
        return Object.fromEntries(Object.entries(stored).filter(([key, videoId]) =>
            /^\d+-\d+-\d+$/.test(key) && typeof videoId === 'string' && VIDEO_ID_PATTERN.test(videoId)
        ));
    } catch {
        return {};
    }
};

export const saveEpisodeVideoLinks = (links) => {
    try {
        window.localStorage.setItem(LINK_STORAGE_KEY, JSON.stringify(links));
    } catch {
        // 저장이 제한된 브라우저에서는 현재 화면에서만 연결 유지
    }
};

export const decodeYouTubeTitle = (title = '') => title.replace(/&amp;|&quot;|&#39;|&lt;|&gt;/g, (entity) => ({
    '&amp;': '&', '&quot;': '"', '&#39;': "'", '&lt;': '<', '&gt;': '>'
})[entity]);

export const rankEpisodeVideos = (videos, seasonNumber, episode) => {
    const episodeNumber = episode.episode_number;
    const year = episode.air_date?.slice(0, 4);
    const marker = new RegExp(`\\bs\\s*0*${seasonNumber}\\s*(?:e|ep|episode)\\s*0*${episodeNumber}\\b`, 'i');
    const longMarker = new RegExp(`season\\s*0*${seasonNumber}\\s*episode\\s*0*${episodeNumber}\\b`, 'i');
    const score = (video) => {
        const title = video.name || '';
        let value = marker.test(title) || longMarker.test(title) ? 10 : 0;
        if (year && title.includes(year)) value += 5;
        else if (year && /\b(?:19|20)\d{2}\b/.test(title)) value -= 2;
        if (episode.name && title.toLowerCase().includes(episode.name.toLowerCase())) value += 10;
        return value;
    };
    return [...videos].sort((first, second) => score(second) - score(first));
};
