import http from '@/api/request';
import type { ILoginResult } from './auth';
import type { UserDetail, UserProfile } from '@/types';

/**
 * 微信登录接口（与 wxLoginMockApi 同源，保留兼容导出）
 * @param jsCode 登录凭证（小程序端为 uni.login 获取的真实 code）
 */
export const wxLoginApi = (jsCode: string): Promise<ILoginResult> => {
    return http.post<ILoginResult>('/auth/login', { jsCode });
};

/** 更新个人资料（微信授权头像昵称） */
export const updateProfileApi = (data: { nickname?: string; avatar?: string }): Promise<UserProfile> => {
    return http.post<UserProfile>('/user/profile', data);
};

/** 用户主页（资料 + 在售商品 + 收到的评价） */
export const getUserDetailApi = (userId: string): Promise<UserDetail> => {
    return http.get<UserDetail>(`/user/detail/${userId}`);
};
