import http from '@/api/request';
import type { EditUserProfile, UserDetail, UserProfile } from '@/types';

/** 更新个人资料（微信授权头像昵称 / 联系方式） */
export const updateProfileApi = (
    data: EditUserProfile
): Promise<UserProfile> => {
    return http.post<UserProfile>('/user/profile', data);
};

/** 用户主页（资料 + 在售商品 + 收到的评价） */
export const getUserDetailApi = (userId: string): Promise<UserDetail> => {
    return http.get<UserDetail>(`/user/detail/${userId}`);
};
