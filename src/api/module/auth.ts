import http from '@/api/request';
import { apiConfig } from '@/config/env';
import type { UserProfile } from '@/types';

export interface ILoginResult {
    token: string;
    userInfo: UserProfile;
}

/** 本地稳定匿名标识：mock 模式下保证同一设备登录同一账号（微信 code 每次都会变） */
const getAnonId = (): string => {
    const KEY = 'anon_login_id';
    let id = uni.getStorageSync(KEY) as string;
    if (!id) {
        id = `anon_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
        uni.setStorageSync(KEY, id);
    }
    return id;
};

/**
 * 获取微信登录凭证：
 * - mock 模式（本地联调）：返回本地稳定匿名标识，后端按固定 openid 建号，登录态/资料持久
 * - 真实模式：uni.login 静默获取真实 code（后端 code2session 换 openid）
 * - H5/App 演示环境：固定返回演示 jsCode（后端 mock 模式下为「皮蛋同学」）
 */
const getLoginCode = (): Promise<string> => {
    // #ifdef MP-WEIXIN
    if (apiConfig.wxMock) {
        return Promise.resolve(getAnonId());
    }
    return new Promise((resolve, reject) => {
        uni.login({
            provider: 'weixin',
            success: res => {
                if (res.code) {
                    resolve(res.code);
                } else {
                    reject(new Error('微信登录失败，请重试'));
                }
            },
            fail: () => reject(new Error('微信登录失败，请重试')),
        });
    });
    // #endif
    // #ifndef MP-WEIXIN
    // H5/App：演示账号（后端 mock 模式下为「皮蛋同学」，含历史订单/账单/未读消息等数据）
    return Promise.resolve('10001');
    // #endif
};

/**
 * 微信授权登录：
 * - 后端 mock 模式（campus.wx.mock=true，默认）：任意 jsCode 均可登录
 * - 真实模式：配置 WX_APPID/WX_SECRET 且 WX_MOCK=false 后，code2session 换 openid，同一微信账号稳定登录
 */
export const wxLoginMockApi = (): Promise<ILoginResult> => {
    return getLoginCode().then(jsCode =>
        http.post<ILoginResult>('/auth/login', { jsCode })
    );
};
