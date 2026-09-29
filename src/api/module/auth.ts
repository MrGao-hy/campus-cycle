import { CURRENT_USER_ID, users } from '@/mock/data';
import { delay } from '@/mock';
import type { UserProfile } from '@/types';

export interface ILoginResult {
    token: string;
    userInfo: UserProfile;
}

/**
 * 微信登录（mock）
 * 真实流程：uni.login 获取 jsCode → 服务端 code2session 换 openid → 下发 token
 */
export const wxLoginMockApi = (): Promise<ILoginResult> => {
    return delay({ token: `mock_token_${CURRENT_USER_ID}`, userInfo: users[CURRENT_USER_ID] }, 600);
};
