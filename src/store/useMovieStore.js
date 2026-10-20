import { create } from "zustand";

// TMDB키를 변수로 저장하기
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
// 유튜브 API 키 환경변수 불러오기
const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export const useMovieStore = create((set, get) => ({
    // 인기영화를 저장할 배열
    popMovies: [],

    // 인기영화를 불러올 메서드
    onFetchPopular: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`);
        // console.log(res);
        const data = await res.json();
        // console.log(data);
        set({ popMovies: data.results })
    },

    // 영화의 비디오를 저장할 변수
    popVideo: {},
    // 영화의 비디오를 불러오는 메서드
    onFetchVideo: async (id) => {
        // 기존에 불러온 영상이 있는지를 체크해서 있으면 그만 불러오기
        const { popVideo } = get();
        if (popVideo[id]) return;

        const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/videos?&api_key=${TMDB_KEY}&language=ko-KR`);
        // console.log("비디오", res);
        const data = await res.json();
        // console.log("비디오 데이터", data);
        set((state) => ({
            popVideo: {
                ...state.popVideo,
                [id]: data.results
            }
        }))
    },

    // ------------티비시리즈(인기) ---------------
    // 인기 티비프로그램을 저장할 배열
    tvs: [],
    // 인기 티비프로그램의 영상을 저장할 오브젝트
    tvVideo: {},
    // 인기 티비프로그램을 불러올 메서드
    onFetchTv: async () => {
        const res = await fetch(`https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_KEY}&language=ko-KR&page=1`);
        const data = await res.json();
        console.log("인기티비", data);
        set({ tvs: data.results });
    },
    // 인기 티비프로그램 영상을 불러올 메서드
    onFetchTvVideo: async (id) => {
        const { tvVideo } = get();
        if (tvVideo[id]) return;

        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/videos?&api_key=${TMDB_KEY}&language=en-US`);

        const data = await res.json();
        set((state) => ({
            tvVideo: {
                ...state.tvVideo,
                [id]: data.results
            }
        }))
    },
    // 시즌
    // [추가] TV 시리즈 상세 정보를 저장할 오브젝트
    tvDetails: {},
    // 시즌 상세 정보를 불러올 메서드
    onFetchTvDetail: async (id) => {
        const { tvDetails } = get();
        if (tvDetails[id]) return;

        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();
        set((state) => ({
            tvDetails: {
                ...state.tvDetails,
                [id]: data
            }
        }))
    },

    // 시즌별 에피소드
    episodes: {},
    onFetchEpisode: async (id, seasonNumber) => {
        const key = `${id}_${seasonNumber}`;
        const { episodes } = get();
        if (episodes[key]) return;

        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${seasonNumber}?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();

        if (!res.ok) throw new Error("시즌 정보를 불러오지 못했습니다.");

        // 중요: TMDB 시즌 에피소드 API의 결과 배열은 data.episodes 입니다.
        set((state) => ({
            episodes: {
                ...state.episodes,
                [key]: data.episodes || []
            }
        }))
    },

    // 에피소드별 비디오 정보 (TMDB 1차 조회 후 실패 시 YouTube Data API Fallback)
    episodeVideos: {},
    onFetchEpisodeVideo: async (tvId, seasonNumber, episodeNumber, tvTitle = "") => {
        const key = `${tvId}_${seasonNumber}_${episodeNumber}`;
        const { episodeVideos } = get();

        // 이미 저장된 비디오 데이터가 존재하는 경우 재요청 안함
        if (episodeVideos[key] && episodeVideos[key].length > 0) return;

        try {
            // 1. TMDB 에피소드 비디오 API 호출 (한국어)
            let res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/videos?api_key=${TMDB_KEY}&language=ko-KR`);
            let data = await res.json();
            let videoList = data.results || [];

            // 2. 한국어 비디오가 없으면 영어로 fallback 재요청
            if (videoList.length === 0) {
                res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/videos?api_key=${TMDB_KEY}&language=en-US`);
                data = await res.json();
                videoList = data.results || [];
            }

            // 3. TMDB에 영상이 여전히 없는 경우 -> YouTube Data API 직접 검색
            if (videoList.length === 0 && YOUTUBE_KEY && tvTitle) {
                const searchQuery = `${tvTitle} 시즌 ${seasonNumber} ${episodeNumber}화`;
                const ytRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&key=${YOUTUBE_KEY}`
                );
                const ytData = await ytRes.json();
                const videoId = ytData.items?.[0]?.id?.videoId;

                if (videoId) {
                    videoList = [{ key: videoId, site: 'YouTube', type: 'Clip' }];
                }
            }

            // 상태 업데이트
            set((state) => ({
                episodeVideos: {
                    ...state.episodeVideos,
                    [key]: videoList
                }
            }));
        } catch (error) {
            console.error("에피소드 비디오 조회 실패:", error);
        }
    },
    // 등장인물(캐스트) 정보를 저장할 오브젝트
    tvCredits: {},
    onFetchTvCredits: async (id) => {
        const { tvCredits } = get();
        if (tvCredits[id]) return;

        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/credits?api_key=${TMDB_KEY}&language=ko-KR`);
        const data = await res.json();

        set((state) => ({
            tvCredits: {
                ...state.tvCredits,
                [id]: data.cast || []
            }
        }));
    },
    // 관련(비슷한) TV 프로그램을 저장할 오브젝트
    tvSimilar: {},
    onFetchTvSimilar: async (id) => {
        const { tvSimilar } = get();
        if (tvSimilar[id]) return;

        const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/similar?api_key=${TMDB_KEY}&language=ko-KR&page=1`);
        const data = await res.json();

        set((state) => ({
            tvSimilar: {
                ...state.tvSimilar,
                [id]: data.results || []
            }
        }));
    },
}))