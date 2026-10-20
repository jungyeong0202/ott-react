import { create } from "zustand";
import { auth, db, googleProvider } from "../firebase/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAuthErrorMessage } from "../utils/auth";

const createUserInfo = (user) => ({
    uid: user.uid,
    email: user.email,
    name: user.displayName,
    photoURL: user.photoURL,
    phone: user.phoneNumber,
    familyMembers: {
        아빠: { likes: [], watchHistory: [] },
        엄마: { likes: [], watchHistory: [] },
        아들: { likes: [], watchHistory: [] },
        딸: { likes: [], watchHistory: [] },
    },
});

const loadUserInfo = async (firebaseUser) => {
    const userInfo = createUserInfo(firebaseUser);

    // Firestore를 사용하지 않아도 구글 계정으로 로그인할 수 있습니다.
    if (!db) return { user: userInfo, error: null };

    try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return { user: { ...userInfo, ...userDoc.data(), uid: firebaseUser.uid }, error: null };
        }

        await setDoc(userRef, userInfo);
        return { user: userInfo, error: null };
    } catch {
        return {
            user: userInfo,
            error: "로그인은 완료됐지만 저장된 사용자 정보를 불러오지 못했습니다.",
        };
    }
};

export const useAuthStore = create((set, get) => ({
    user: null,
    currentMember: null,
    isLoading: false,
    isInitializing: true,
    error: null,

    // 새로고침하거나 다른 탭에서 로그인 상태를 바꿔도 화면에 반영합니다.
    initializeAuth: () => {
        let active = true;
        let version = 0;
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            const currentVersion = ++version;

            if (!firebaseUser) {
                if (active) set({ user: null, currentMember: null, isInitializing: false });
                return;
            }

            // 직접 로그인하는 동안에는 onGoogleLogin에서 사용자 정보를 불러옵니다.
            if (get().isLoading) return;

            const result = await loadUserInfo(firebaseUser);
            if (!active || currentVersion !== version || get().isLoading || auth.currentUser?.uid !== firebaseUser.uid) return;

            set((state) => ({
                ...result,
                currentMember: state.user?.uid === firebaseUser.uid ? state.currentMember : null,
                isInitializing: false,
            }));
        }, (error) => {
            if (active) set({ isInitializing: false, error: getAuthErrorMessage(error) });
        });

        return () => {
            active = false;
            unsubscribe();
        };
    },

    onSetMember: (member) => set({ currentMember: member }),

    onGoogleLogin: async () => {
        if (get().isLoading || get().isInitializing) return null;
        set({ isLoading: true, error: null });

        try {
            const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
            const result = await loadUserInfo(firebaseUser);
            if (auth.currentUser?.uid !== firebaseUser.uid) return null;

            set({ ...result, currentMember: null });
            return result.user;
        } catch (error) {
            set({ error: getAuthErrorMessage(error) });
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    onLogout: async () => {
        if (get().isLoading || get().isInitializing) return false;
        set({ isLoading: true, error: null });

        try {
            await signOut(auth);
            set({ user: null, currentMember: null });
            return true;
        } catch (error) {
            set({ error: getAuthErrorMessage(error) });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },
}));
