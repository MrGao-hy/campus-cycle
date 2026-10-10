import type { IGoods, GoodsReview } from '../index';

export type ContactInfo = {
    contactPhone?: string;
    contactQq?: string;
    contactWechat?: string;
    contactEmail?: string;
};

/** 联系方式展示配置（卖家确认后展示） */
export const CONTACT_ITEMS: Array<{
    key: keyof ContactInfo;
    label: string;
    icon: string;
}> = [
    { key: 'contactPhone', label: '电话', icon: '/static/icons/telephone.png' },
    { key: 'contactQq', label: 'QQ', icon: '/static/icons/comment.png' },
    { key: 'contactWechat', label: '微信', icon: '/static/icons/message.png' },
    { key: 'contactEmail', label: '邮箱', icon: '/static/icons/send.png' },
];

/** 用户 */
export interface UserProfile {
    id: string;
    nickname: string;
    avatar?: string;
    schoolId: string;
    /** 学校名称（后端联查填充） */
    schoolName?: string;
    /** 信用分 */
    creditScore: number;
    /** 成功交易笔数（首笔免手续费判断依据） */
    successCount: number;
    contact: ContactInfo;
}

export interface EditUserProfile extends ContactInfo {
    nickname: string;
    avatar?: string;
}

/** 用户主页（资料 + 名下商品 + 收到的评价） */
export interface UserDetail {
    profile: UserProfile;
    /** 名下所有商品（含在售/交易中/已售出/已下架，不含已删除） */
    goods: IGoods[];
    reviews: GoodsReview[];
}
