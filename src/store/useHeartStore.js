import { create } from "zustand";
import { auth, db } from "../firebase/firebase";
import { useAuthStore } from "./useAuth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export const useHeartStore = create((set, get) => ({
    // 찜리스트를 저장 할 배열
    heart: [],
    isToggling: false,
    // 찜리스트를 배열에 저장할 메서드
    onAddHeart: async (item) => {
        const user = auth.currentUser;
        if (!user || !db) return;
        const currentMember = useAuthStore.getState().currentMember;
        if (!currentMember) return;
        try {
            const heartItem = {
                id: item.id,
                //item안에 title 항목이 있는지 체크해서 있으면 title을 사용하고 없으면 name을 사용
                title: "title" in item ? item.title : item.name,
                poster_path: item.poster_path
            }
            //firebase 안에 저장
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                //이전에 저장된 자료를 가져와서
                const prevHeart =
                    userDoc.data()?.familyMembers?.[currentMember]?.likes || [];

                const filtered = prevHeart.filter((h) => h.id !== item.id)
                //내가 찜한 항목이랑 일치하지 않는것만 ㅏ추가로 넣기
                const newHeart = [heartItem, ...filtered]
                await updateDoc(userDocRef, { [`familyMembers.${currentMember}.likes`]: newHeart })
                if (auth.currentUser?.uid === user.uid && useAuthStore.getState().currentMember === currentMember) {
                    set({ heart: newHeart })
                }
            }

        } catch (err) {
            console.log("찜오류", err.message)
        }
    },
    // 저장된 찜리스트 불러오기
    onLoadHeart: async () => {
        const user = auth.currentUser;
        const currentMember = useAuthStore.getState().currentMember;
        if (!user || !currentMember || !db) {
            set({ heart: [] });
            return false;
        }
        set({ heart: [] });
        try {
            //firebase 사용자계정
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (auth.currentUser?.uid !== user.uid || useAuthStore.getState().currentMember !== currentMember) return false;

            if (userDoc.exists()) {
                const likes = userDoc.data()?.familyMembers?.[currentMember]?.likes || []
                set({ heart: likes })
            }
            return true;
        } catch (err) {
            console.log("찜리스트 불러오기 오류", err)
            return false;
        }
    },
    // 토글
    onToggleHeart: async (item) => {
        const user = auth.currentUser;
        const currentMember = useAuthStore.getState().currentMember;
        if (!user || !currentMember || !db || get().isToggling) return;
        set({ isToggling: true });

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) return;

            const likes = userDoc.data()?.familyMembers?.[currentMember]?.likes || [];
            const heartItem = {
                id: item.id,
                title: "title" in item ? item.title : item.name,
                poster_path: item.poster_path
            };
            // 토글에서 직접 추가·해제하고, 찜리스트의 제거 버튼은 onRemoveHeart를 사용합니다.
            const newHeart = likes.some((h) => h.id === item.id)
                ? likes.filter((h) => h.id !== item.id)
                : [heartItem, ...likes];

            if (auth.currentUser?.uid !== user.uid || useAuthStore.getState().currentMember !== currentMember) return;
            await updateDoc(userDocRef, { [`familyMembers.${currentMember}.likes`]: newHeart });
            if (auth.currentUser?.uid === user.uid && useAuthStore.getState().currentMember === currentMember) {
                set({ heart: newHeart });
            }
        } catch (err) {
            console.log("하트 토글 오류", err);
        } finally {
            set({ isToggling: false });
        }
    },
    // 삭제
    onRemoveHeart: async (id) => {
        const user = auth.currentUser;
        if (!user || !db) return;
        const currentMember = useAuthStore.getState().currentMember;
        if (!currentMember) return;
        try {
            //firebase 사용자계정
            const userDocRef = doc(db,"users",user.uid);
            const userDoc = await getDoc(userDocRef);
            if(userDoc.exists()){
                const likes = userDoc.data()?.familyMembers?.[currentMember]?.likes || []
                const filtered = likes.filter((h)=>h.id !== id);
                await updateDoc(userDocRef,{[`familyMembers.${currentMember}.likes`]:filtered})
                if (auth.currentUser?.uid === user.uid && useAuthStore.getState().currentMember === currentMember) {
                    set({heart:filtered})
                    alert("찜삭제");
                }
            }   
        }catch(err){
            console.log("찜삭제 오류", err)
        }
    },
    // 하트의 상태를 변경해줄 메서드
    onIsHeart: (id) => {
        // some 데이터가 배열의 객체로 있는지를 체크해서 true/false를 반환한다
        return get().heart.some((h) => h.id === id)
    }
}))
