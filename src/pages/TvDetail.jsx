import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useMovieStore } from '../store/useMovieStore';

export const TvDetail = () => {
    const { id } = useParams();
    const tvId = Number(id);

    const {
        tvs,
        tvVideo,
        tvDetails,
        episodes,
        episodeVideos,
        tvCredits,
        tvSimilar,
        onFetchTvVideo,
        onFetchTvDetail,
        onFetchEpisode,
        onFetchEpisodeVideo,
        onFetchTvCredits,
        onFetchTvSimilar
    } = useMovieStore();

    const [showPopup, setShowPopup] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [activeVideoTarget, setActiveVideoTarget] = useState('main');

    const tv = tvs.find((t) => t.id === tvId);
    const detail = tvDetails[tvId];
    const castList = tvCredits[tvId] || [];
    const similarList = tvSimilar[tvId] || [];

    const handleMainPopup = () => {
        setActiveVideoTarget('main');
        setShowPopup(true);
    };

    const handleEpisodePopup = (seasonNum, epNum, e) => {
        e.stopPropagation();
        const tvName = tv?.name || detail?.name || "";
        setActiveVideoTarget({ seasonNumber: seasonNum, episodeNumber: epNum });
        onFetchEpisodeVideo(tvId, seasonNum, epNum, tvName);
        setShowPopup(true);
    };

    const handleClose = () => {
        setShowPopup(false);
    };

    // 데이터 호출 (id가 바뀔 때마다 실행되도록 처리)
    useEffect(() => {
        if (tvId) {
            onFetchTvVideo(tvId);
            onFetchTvDetail(tvId);
            onFetchTvCredits(tvId);
            onFetchTvSimilar(tvId); // 관련 콘텐츠 호출
        }
    }, [tvId, onFetchTvVideo, onFetchTvDetail, onFetchTvCredits, onFetchTvSimilar]);

    useEffect(() => {
        if (detail && detail.seasons && detail.seasons.length > 0) {
            const firstValidSeason = detail.seasons.find(s => s.season_number > 0) || detail.seasons[0];
            setSelectedSeason(firstValidSeason.season_number);
        }
    }, [detail]);

    useEffect(() => {
        if (tvId && selectedSeason !== undefined) {
            onFetchEpisode(tvId, selectedSeason);
        }
    }, [tvId, selectedSeason, onFetchEpisode]);

    const mainVideoList = tvVideo[tvId];
    const mainTrailer = mainVideoList?.find((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));

    let currentTrailer = mainTrailer;
    if (activeVideoTarget !== 'main') {
        const { seasonNumber, episodeNumber } = activeVideoTarget;
        const epKey = `${tvId}_${seasonNumber}_${episodeNumber}`;
        const epVidList = episodeVideos[epKey];
        const foundEpTrailer = epVidList?.find((v) => v.site === "YouTube");

        if (foundEpTrailer) {
            currentTrailer = foundEpTrailer;
        }
    }

    const currentEpisodes = episodes[`${tvId}_${selectedSeason}`] || [];

    return (
        <section className='sub-page pt-30 pb-20'>
            {/* 상단 상세 정보 영역 */}
            <div className="inner flex gap-15">
                <div className='w-2/6'>
                    <img className='w-full rounded-lg shadow-lg' src={`https://image.tmdb.org/t/p/original${tv?.poster_path || detail?.poster_path}`} alt="" />
                </div>
                <div className='w-4/6'>
                    <h2 className='text-5xl font-bold mb-4'>{tv?.name || detail?.name}</h2>
                    <p className='text-lg font-semibold text-gray-600 mb-6'>평점: {tv?.vote_average?.toFixed(1) || detail?.vote_average?.toFixed(1)}</p>
                    <p className='my-6 text-gray-700 leading-relaxed'>{tv?.overview || detail?.overview}</p>

                    <div className='flex gap-5'>
                        <button className='bg-black text-white px-6 py-3 rounded font-bold hover:bg-gray-800 transition'
                            onClick={handleMainPopup}>재생하기</button>
                        <button className='border border-gray-400 px-6 py-3 rounded font-bold hover:bg-gray-100 transition'>찜하기</button>
                    </div>
                </div>
            </div>

            {/* 시즌 탭 버튼 목록 */}
            <div className="inner mt-20">
                <h3 className='text-3xl font-bold mb-6'>에피소드</h3>
                {detail?.seasons && (
                    <div className='flex gap-3 mb-8 overflow-x-auto pb-2'>
                        {detail.seasons.map((season) => (
                            <button
                                key={season.id}
                                onClick={() => setSelectedSeason(season.season_number)}
                                className={`px-5 py-2.5 rounded-full font-medium transition whitespace-nowrap ${selectedSeason === season.season_number
                                    ? 'bg-black text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {season.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* 에피소드 카드 형태 슬라이드 (가로 스크롤 카드 리스트) */}
                <div className='flex gap-6 overflow-x-auto pb-6 scrollbar-hide'>
                    {currentEpisodes.length > 0 ? (
                        currentEpisodes.map((ep) => (
                            <div
                                key={ep.id}
                                className='min-w-[300px] max-w-[300px] bg-white border rounded-xl shadow-sm flex flex-col justify-between flex-shrink-0 overflow-hidden'
                            >
                                <div>
                                    <div className='w-full h-44 bg-gray-200 relative'>
                                        {ep.still_path ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w500${ep.still_path}`}
                                                alt={ep.name}
                                                className='w-full h-full object-cover'
                                            />
                                        ) : (
                                            <div className='w-full h-full flex items-center justify-center text-xs text-gray-500'>이미지 없음</div>
                                        )}
                                        <span className='absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded'>
                                            {ep.runtime ? `${ep.runtime}분` : ''}
                                        </span>
                                    </div>
                                    <div className='p-4'>
                                        <h4 className='font-bold text-lg mb-1 truncate'>{ep.episode_number}. {ep.name}</h4>
                                        <p className='text-xs text-gray-600 line-clamp-3 leading-relaxed'>
                                            {ep.overview || "등록된 에피소드 줄거리가 없습니다."}
                                        </p>
                                    </div>
                                </div>
                                <div className='p-4 pt-0'>
                                    <button
                                        onClick={(e) => handleEpisodePopup(selectedSeason, ep.episode_number, e)}
                                        className='w-full bg-black text-white py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition flex items-center justify-center gap-1.5'
                                    >
                                        <span>▶</span> 재생하기
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className='text-gray-500 py-10 text-center w-full'>해당 시즌의 에피소드 정보를 불러오는 중이거나 없습니다.</p>
                    )}
                </div>
            </div>

            {/* 등장인물 (캐스트) 섹션 */}
            <div className="inner mt-16">
                <h3 className='text-3xl font-bold mt-6 mb-6'>주요 등장인물</h3>
                <div className='flex gap-5 overflow-x-auto pb-4 scrollbar-hide'>
                    {castList.length > 0 ? (
                        castList.map((actor) => (
                            <div key={actor.id} className='min-w-[130px] max-w-[130px] flex-shrink-0 text-center'>
                                <div className='w-[130px] h-[160px] bg-gray-200 rounded-lg overflow-hidden mb-2 shadow-sm'>
                                    {actor.profile_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                                            alt={actor.name}
                                            className='w-full h-full object-cover'
                                        />
                                    ) : (
                                        <div className='w-full h-full flex items-center justify-center text-xs text-gray-400'>사진 없음</div>
                                    )}
                                </div>
                                <h4 className='font-bold text-sm truncate'>{actor.name}</h4>
                                <p className='text-xs text-gray-500 truncate'>{actor.character}</p>
                            </div>
                        ))
                    ) : (
                        <p className='text-gray-500 text-sm'>등장인물 정보가 없습니다.</p>
                    )}
                </div>
            </div>

            {/* 관련 콘텐츠 (비슷한 작품) 섹션 */}
            <div className="inner mt-16">
                <h3 className='text-3xl font-bold mt-6 mb-6'>관련 콘텐츠 (비슷한 작품)</h3>
                <div className='flex gap-5 overflow-x-auto pb-4 scrollbar-hide'>
                    {similarList.length > 0 ? (
                        similarList.map((item) => (
                            <Link
                                to={`/tv/${item.id}`}
                                key={item.id}
                                className='min-w-[160px] max-w-[160px] flex-shrink-0 group'
                            >
                                <div className='w-[160px] h-[230px] bg-gray-200 rounded-lg overflow-hidden mb-2 shadow-sm'>
                                    {item.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                                            alt={item.name}
                                            className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
                                        />
                                    ) : (
                                        <div className='w-full h-full flex items-center justify-center text-xs text-gray-400'>이미지 없음</div>
                                    )}
                                </div>
                                <h4 className='font-bold text-sm truncate group-hover:text-blue-600 transition'>{item.name}</h4>
                                <p className='text-xs text-gray-500'>평점: {item.vote_average?.toFixed(1)}</p>
                            </Link>
                        ))
                    ) : (
                        <p className='text-gray-500 text-sm'>관련 콘텐츠 정보가 없습니다.</p>
                    )}
                </div>
            </div>

            {/* 영상 재생 팝업 */}
            {showPopup && (
                <div className='fixed inset-0 bg-black/90 w-full h-full top-0 left-0 z-[100000] flex items-center justify-center'>
                    <button className='absolute right-8 top-8 bg-white/80 hover:bg-white px-4 py-2 rounded font-bold z-10'
                        onClick={handleClose}>닫기</button>
                    {currentTrailer ? (
                        <iframe className='w-full h-full' src={`https://www.youtube.com/embed/${currentTrailer.key}?autoplay=1&mute=1`} frameBorder="0" title="trailer" allowFullScreen></iframe>
                    ) : (
                        <p className='text-white text-xl'>재생할 수 있는 영상이 없습니다.</p>
                    )}
                </div>
            )}
        </section>
    )
}