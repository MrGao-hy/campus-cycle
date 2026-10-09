import http from '@/api/request';
<<<<<<< HEAD
import type { UserProfile } from '@/types';
=======
import type { ILoginResult } from './auth';
import type { UserDetail, UserProfile } from '@/types';
>>>>>>> 2562045febb196af83898a277883bc08a96b5b9b

/** 更新个人资料（微信授权头像昵称） */
export const updateProfileApi = (data: {
    nickname?: string;
    avatar?: string;
}): Promise<UserProfile> => {
    return http.post<UserProfile>('/user/profile', data);
};

/** 用户主页（资料 + 在售商品 + 收到的评价） */
export const getUserDetailApi = (userId: string): Promise<UserDetail> => {
    return http.get<UserDetail>(`/user/detail/${userId}`);
};
