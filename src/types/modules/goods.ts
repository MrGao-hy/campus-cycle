import type { ISearchParam } from "./api";

/** 商品状态 */
export type GoodsStatus = 'ON_SALE' | 'LOCKED' | 'SOLD' | 'OFF_SHELF';

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

export interface ISearchGoods extends ISearchParam {
    category?: string;
    schoolId: string;
}
