import { useCallback, useEffect, useRef, useState } from 'react'
import { useMovieStore } from '../store/useMovieStore'
import { getEpisodeVideoKey, rankEpisodeVideos } from '../utils/youtube'
import { YouTubePlayer } from './YouTubePlayer'

export const EpisodeVideoPopup = ({ tvId, tvName, tvOriginalName, seasonNumber, episode, seriesTrailer, onClose }) => {
    const onFetchEpisodeVideo = useMovieStore((state) => state.onFetchEpisodeVideo);
    const onSearchYouTube = useMovieStore((state) => state.onSearchYouTube);
    const onConnectEpisodeYouTube = useMovieStore((state) => state.onConnectEpisodeYouTube);
    const episodeNumber = episode.episode_number;
    const cacheKey = getEpisodeVideoKey(tvId, seasonNumber, episodeNumber);
    const savedVideoId = useMovieStore((state) => state.episodeVideoLinks[cacheKey]);
    const seasonLabel = seasonNumber === 0 ? '스페셜' : `시즌 ${seasonNumber}`;
    const defaultQuery = `${tvOriginalName || tvName} S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`;
    const [result, setResult] = useState(null);
    const [attempt, setAttempt] = useState(0);
    const [showSeriesTrailer, setShowSeriesTrailer] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(() => savedVideoId
        ? { key: savedVideoId, name: '연결한 YouTube 영상', source: 'linked' } : null);
    const [skipInitialSearch] = useState(() => Boolean(savedVideoId));
    const [searchQuery, setSearchQuery] = useState(defaultQuery);
    const [searchResult, setSearchResult] = useState(null);
    const [searchBusy, setSearchBusy] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [linkError, setLinkError] = useState('');
    const [playbackError, setPlaybackError] = useState(null);
    const searchRequestRef = useRef(0);
    const closeButtonRef = useRef(null);
    const dialogRef = useRef(null);

    // 회차에 등록된 영상이 없으면 YouTube 검색으로 보완하기
    useEffect(() => {
        let active = true;
        const loadVideos = async () => {
            let videos = [];
            let searchVideos = [];
            let error = '';
            if (!skipInitialSearch) {
                try {
                    videos = (await onFetchEpisodeVideo(tvId, seasonNumber, episodeNumber))
                        .filter((video) => video.site === 'YouTube' && video.key);
                } catch {
                    // 회차 조회가 실패해도 YouTube 검색은 계속하기
                }
                if (!videos.length) {
                    try {
                        searchVideos = await onSearchYouTube(defaultQuery);
                    } catch (searchError) {
                        error = searchError.message;
                    }
                }
            }
            if (active) setResult({ attempt, videos, searchVideos, error });
        };
        loadVideos();
        return () => { active = false; };
    }, [tvId, seasonNumber, episodeNumber, skipInitialSearch, attempt, defaultQuery, onFetchEpisodeVideo, onSearchYouTube]);

    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
            if (event.key === 'Tab') {
                const controls = dialogRef.current?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), iframe');
                if (!controls?.length) return;
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            searchRequestRef.current += 1;
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        };
    }, [onClose]);

    const currentResult = result?.attempt === attempt ? result : null;
    const playableVideos = currentResult?.videos;
    const episodeVideo = playableVideos?.find((video) => video.iso_639_1 === 'ko')
        || playableVideos?.find((video) => video.type === 'Clip')
        || playableVideos?.find((video) => video.type === 'Trailer' || video.type === 'Teaser')
        || playableVideos?.[0];
    const candidates = rankEpisodeVideos(searchResult?.videos ?? currentResult?.searchVideos ?? [], seasonNumber, episode);
    const video = selectedVideo || (showSeriesTrailer ? seriesTrailer : episodeVideo || candidates[0]);
    const activePlaybackError = playbackError && video && playbackError.key === video.key ? playbackError.message : '';
    const searchError = searchResult?.error || currentResult?.error;
    const sourceLabel = showSeriesTrailer ? '시리즈 예고편'
        : video?.source === 'search' ? 'YouTube 검색 영상'
            : video?.source === 'linked' ? '연결한 YouTube 영상' : '에피소드 영상';
    const handlePlaybackError = useCallback((key, message) => setPlaybackError({ key, message }), []);

    const handleSelectVideo = (candidate) => {
        onConnectEpisodeYouTube(tvId, seasonNumber, episodeNumber, candidate.key);
        setSelectedVideo(candidate);
        setShowSeriesTrailer(false);
        setPlaybackError(null);
    };
    const handleConnectLink = (event) => {
        event.preventDefault();
        try {
            const key = onConnectEpisodeYouTube(tvId, seasonNumber, episodeNumber, videoUrl);
            setSelectedVideo({ key, name: '연결한 YouTube 영상', source: 'linked' });
            setShowSeriesTrailer(false);
            setPlaybackError(null);
            setLinkError('');
        } catch (error) {
            setLinkError(error.message);
        }
    };
    const handleSearch = async (event) => {
        event.preventDefault();
        const requestId = ++searchRequestRef.current;
        setSearchBusy(true);
        try {
            const videos = await onSearchYouTube(searchQuery);
            if (requestId !== searchRequestRef.current) return;
            setSearchResult({ videos, error: '' });
            setSelectedVideo(null);
            setShowSeriesTrailer(false);
            setPlaybackError(null);
        } catch (error) {
            if (requestId === searchRequestRef.current) setSearchResult({ videos: [], error: error.message });
        } finally {
            if (requestId === searchRequestRef.current) setSearchBusy(false);
        }
    };

    return (
        <div ref={dialogRef} role='dialog' aria-modal='true' aria-labelledby='episode-player-title'
            className='fixed inset-0 z-10000 bg-black text-white flex flex-col'>
            <div className='flex items-start justify-between gap-5 p-5 border-b border-white/20'>
                <div>
                    <h2 id='episode-player-title' className='text-xl font-bold'>{tvName} · {seasonLabel} · {episodeNumber}화</h2>
                    <p className='mt-1 text-white/70'>{episode.name || '에피소드'}</p>
                    {video && <p className='mt-2 text-sm text-white/70'>{sourceLabel} · {video.name || '영상'}</p>}
                </div>
                <button ref={closeButtonRef} type='button' onClick={onClose}
                    className='shrink-0 bg-white text-black px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'>닫기</button>
            </div>
            <div className='flex-1 min-h-0 flex flex-col lg:flex-row'>
                <div className='flex-1 min-w-0 min-h-[240px] lg:min-h-0 relative'>
                    {video ? (
                        <YouTubePlayer key={`${video.key}-${attempt}`} videoId={video.key}
                            title={`${tvName} ${seasonLabel} ${episodeNumber}화 ${video.name || '영상'}`} onError={handlePlaybackError} />
                    ) : (
                        <div className='h-full flex flex-col items-center justify-center gap-5 p-5 text-center'>
                            <p role={searchError ? 'alert' : 'status'}>
                                {!currentResult ? '회차 영상을 찾는 중...' : searchError || '검색된 영상이 없습니다. 검색어를 바꾸거나 YouTube 링크를 연결해 주세요.'}
                            </p>
                            {searchError && <button type='button' onClick={() => setAttempt((value) => value + 1)} className='border border-white px-4 py-2'>다시 시도</button>}
                        </div>
                    )}
                    {activePlaybackError && (
                        <div className='absolute inset-0 bg-black flex flex-col items-center justify-center gap-5 p-5 text-center'>
                            <p role='alert' className='max-w-xl'>{activePlaybackError}</p>
                            <a href={`https://www.youtube.com/watch?v=${video.key}`} target='_blank' rel='noopener noreferrer'
                                className='bg-white text-black px-4 py-2'>YouTube에서 열기</a>
                        </div>
                    )}
                </div>
                <aside className='w-full lg:w-96 shrink-0 overflow-y-auto max-h-[45vh] lg:max-h-none p-5 border-t lg:border-t-0 lg:border-l border-white/20'>
                    <form onSubmit={handleSearch}>
                        <label htmlFor='episode-youtube-query' className='block font-bold mb-3'>YouTube 영상 검색</label>
                        <input id='episode-youtube-query' value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
                            className='w-full bg-white/10 border border-white/30 p-3 text-white' maxLength={200} required />
                        <button type='submit' disabled={searchBusy} className='w-full mt-3 bg-white text-black px-4 py-2 disabled:opacity-50'>
                            {searchBusy ? '검색 중...' : '검색하기'}
                        </button>
                    </form>
                    {searchError && <p role='status' className='mt-3 text-sm text-white/70'>{searchError}</p>}
                    <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`} target='_blank' rel='noopener noreferrer'
                        className='inline-block mt-3 underline text-sm'>YouTube에서 직접 찾기</a>
                    {candidates.length > 0 && (
                        <ul className='mt-5 space-y-3' aria-label='YouTube 검색 결과'>
                            {candidates.map((candidate) => (
                                <li key={candidate.key}>
                                    <button type='button' onClick={() => handleSelectVideo(candidate)} aria-label={`${candidate.name} 재생`}
                                        aria-pressed={video?.key === candidate.key}
                                        className={`w-full flex gap-3 p-2 text-left border ${video?.key === candidate.key ? 'border-white bg-white/10' : 'border-transparent hover:bg-white/10'} focus-visible:outline-2 focus-visible:outline-white`}>
                                        {candidate.thumbnail && <img src={candidate.thumbnail} alt='' className='w-24 aspect-video object-cover self-start' />}
                                        <span className='min-w-0'>
                                            <span className='block text-sm line-clamp-3'>{candidate.name}</span>
                                            <span className='block mt-1 text-xs text-white/60'>{candidate.channel}</span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    <form onSubmit={handleConnectLink} className='mt-6 pt-5 border-t border-white/20'>
                        <label htmlFor='episode-youtube-url' className='block font-bold mb-3'>YouTube 링크 연결</label>
                        <input id='episode-youtube-url' value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)}
                            placeholder='https://www.youtube.com/watch?v=…' className='w-full bg-white/10 border border-white/30 p-3 text-white'
                            maxLength={2048} required />
                        <button type='submit' className='w-full mt-3 border border-white px-4 py-2'>연결하고 재생</button>
                        {linkError && <p role='alert' className='mt-3 text-sm'>{linkError}</p>}
                    </form>
                    {seriesTrailer && <button type='button' onClick={() => {
                        setSelectedVideo(null);
                        setShowSeriesTrailer(true);
                        setPlaybackError(null);
                    }} className='w-full mt-5 border border-white/40 px-4 py-2'>시리즈 예고편 보기</button>}
                </aside>
            </div>
        </div>
    );
}
