import { useUserStore } from '@/store';

/**
 * 页面守卫（登录态与学校选择解耦）：
 * - 学校选择独立于登录：未选学校去学校页（未登录也可先选校浏览商品）
 * - 登录校验仅用于需登录操作（下单/聊天/发布/我的等）
 */

/**
 * 校验学校（只判断、不跳转）：
 * 未选学校时返回 false，由调用方决定引导方式（展示空态/顶部入口），
 * 绝不在此处 navigateTo——否则 tabBar 页 onShow 每次显示都会再次触发，
 * 从选校页返回后立即被弹回，形成无法退出的死循环。
 */
export const ensureSchool = (): boolean => {
    const userStore = useUserStore();
    return userStore.hasSchool;
};

/** 校验登录（只判断、不跳转）：未登录时返回 false，由调用方展示引导态 */
export const ensureLogin = (): boolean => {
    const userStore = useUserStore();
    return userStore.hasLogin;
};

/** 需登录且需学校（交易类操作页） */
export const ensureLoginAndSchool = (): boolean => {
    if (!ensureLogin()) return false;
    if (!ensureSchool()) return false;
    return true;
};
