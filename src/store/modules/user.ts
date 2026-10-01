import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { School, UserProfile } from '@/types';

/** 用户登录态、所选学校（持久化） */
export const useUserStore = defineStore(
    'hy-user',
    () => {
        const token = ref('');
        const userInfo = ref<UserProfile | null>(null);
        const school = ref<School | null>(null);

        const hasLogin = computed(() => !!token.value);
        const hasSchool = computed(() => !!school.value);

        const setLogin = (tokenVal: string, userInfoVal: UserProfile) => {
            token.value = tokenVal;
            userInfo.value = userInfoVal;
            // 请求层统一从 storage 读取 token，登录成功必须同步写入
            uni.setStorageSync('member_token', tokenVal);
        };

        const setSchool = (schoolVal: School) => {
            school.value = schoolVal;
            if (userInfo.value) {
                userInfo.value.schoolId = schoolVal.id;
            }
        };

        const logout = () => {
            token.value = '';
            userInfo.value = null;
            school.value = null;
            uni.removeStorageSync('member_token');
        };

        return { token, userInfo, school, hasLogin, hasSchool, setLogin, setSchool, logout };
    },
    { persist: true }
);
