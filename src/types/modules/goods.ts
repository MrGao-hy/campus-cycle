import type { ISearchParam } from './api';

/** 商品状态 */
export type GoodsStatus = 'ON_SALE' | 'LOCKED' | 'SOLD' | 'OFF_SHELF';

export const GOODS_STATUS_TEXT: Record<GoodsStatus, string> = {
    ON_SALE: '在售',
    LOCKED: '交易进行中',
    SOLD: '已售出',
    OFF_SHELF: '已下架',
};

/** 商品 */
export interface IGoods {
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    /** 成色 */
    condition: string;
    description: string;
    status: GoodsStatus;
    sellerId: string;
    schoolId: string;
    publishTime: number;
    views: number;
    wantCount: number;
}

/** 商品评价 */
export interface GoodsReview {
    id: string;
    goodsId: string;
    orderId: string;
    fromUserId: string;
    fromNickname: string;
    rate: number;
    content: string;
    time: number;
}

export interface ISearchGoods extends ISearchParam {
    category?: string;
    schoolId: string;
}

