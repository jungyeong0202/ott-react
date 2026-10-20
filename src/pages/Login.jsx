import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuth';

export const Login = () => {
    const navigate = useNavigate();
    // 전역변수
    const { user, onGoogleLogin, isLoading, isInitializing, error } = useAuthStore();

    if (user && !isLoading) return <Navigate to="/selectMember" replace />;

    const handleGoogleLogin = async () => {
        const user = await onGoogleLogin();
        if (user) {
            navigate("/selectMember");
        }
    }
    return (
        <section className='sub-page pt-25'>
            <div className="inner">
                <h2 className='section-title text-3xl font-bold'>Login</h2>
                <p><button type="button" onClick={handleGoogleLogin} disabled={isLoading || isInitializing} className='border py-2 px-4 m-2 rounded-full bg-gray-200 font-bold cursor-pointer disabled:opacity-50 disabled:cursor-wait'>{isInitializing ? '로그인 상태 확인 중…' : isLoading ? '구글 로그인 중…' : '구글 로그인'}</button></p>
                {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
            </div>
        </section>
    )
}
