import { useUserStore } from '@/store';

/**
 * 页面守卫（登录态与学校选择解耦）：
 * - 学校选择独立于登录：未选学校去学校页（未登录也可先选校浏览商品）
 * - 登录校验仅用于需登录操作（下单/聊天/发布/我的等）
 */

/** 校验学校：未选学校去学校页（不要求登录） */
export const ensureSchool = (): boolean => {
    const userStore = useUserStore();
    if (!userStore.hasSchool) {
        uni.navigateTo({ url: '/pages/school/Index' });
        return false;
    }
    return true;
};

/** 校验登录：未登录去登录页 */
export const ensureLogin = (): boolean => {
    const userStore = useUserStore();
    if (!userStore.hasLogin) {
        uni.navigateTo({ url: '/pages/login/Index' });
        return false;
    }
    return true;
};

/** 需登录且需学校（交易类操作页） */
export const ensureLoginAndSchool = (): boolean => {
    if (!ensureLogin()) return false;
    if (!ensureSchool()) return false;
    return true;
};
