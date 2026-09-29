import { useUserStore } from '@/store';

/**
 * 页面守卫：未登录去登录页，未选学校去学校选择页
 * @returns 是否已通过校验
 */
export const ensureLoginAndSchool = (): boolean => {
    const userStore = useUserStore();
    if (!userStore.hasLogin) {
        uni.reLaunch({ url: '/pages/login/Index' });
        return false;
    }
    if (!userStore.hasSchool) {
        uni.navigateTo({ url: '/pages/school/Index' });
        return false;
    }
    return true;
};
