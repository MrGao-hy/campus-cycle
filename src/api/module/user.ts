import http from '@/api/request';
import type { UserProfile } from '@/types';

/** 更新个人资料（微信授权头像昵称） */
export const updateProfileApi = (data: {
    nickname?: string;
    avatar?: string;
}): Promise<UserProfile> => {
    return http.post<UserProfile>('/user/profile', data);
};
