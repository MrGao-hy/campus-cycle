import http from '@/api/request';
import { apiConfig } from '@/config/env';
import type { UserProfile } from '@/types';

export interface ILoginResult {
    token: string;
    userInfo: UserProfile;
}

/**
 * 微信授权登录
 * @param jsCode
 */
export const wxLoginApi = (jsCode: string): Promise<ILoginResult> => {
    return http.post('/auth/login', { jsCode });
};
