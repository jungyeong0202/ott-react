import React, { useEffect } from 'react'
import { HeroSection } from '../components/HeroSection'
import { useMovieStore } from '../store/useMovieStore'
import { MovieList } from '../components/MovieList';
import { TvList } from '../components/TvList';

export const Home = () => {
    const { onFetchPopular, onFetchTv } = useMovieStore();
    // useEffect -> home 컴포넌트가 렌더링 될 때 딱 한번만 실행해라 라는 명령어
    useEffect(() => {
        // 계속 실행하는지, 변화되는 값을 확인해서 실행하는지, 딱 한번만 실행하는지 방식이 세가지다
        onFetchPopular();
        onFetchTv();
    }, [])

    return (
        <main>
            {/* hero 100% 인기영화 첫번째 */}
            <HeroSection />
            <div className='inner'>
                {/* 시청 중 리스트 */}
                {/* 인기영화 리스트 */}
                <MovieList />
                {/* tv 리스트 */}
                <TvList />
            </div>
        </main>
    )
}
