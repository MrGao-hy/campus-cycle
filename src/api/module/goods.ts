import http from '@/api/request';
import type { Goods, GoodsReview, PageResult, UserProfile } from '@/types';

/** 首页分页每页条数（后端 Nacos campus.goods.page-size 默认 20，保持一致） */
export const GOODS_PAGE_SIZE = 20;

export interface IGoodsDetail extends Goods {
    seller: UserProfile;
    reviews: GoodsReview[];
}

/**
 * 本校商品列表（分页；已售出的置灰展示、不隐藏）。
 * 不传 schoolId：后端从登录用户绑定的学校取（登录时绑定学校）。
 * 未登录调用返回 401，由前端引导登录。
 */
export const getGoodsListApi = (params: {
    keyword?: string;
    category?: string;
    /** 页码，从 1 开始 */
    pageNum?: number;
    /** 每页条数，传 0/缺省时后端取 Nacos 中的 campus.goods.page-size */
    pageSize?: number;
}): Promise<PageResult<Goods>> => {
    return http.get<PageResult<Goods>>('/goods/list', params);
};

/** 商品详情（含卖家信息与评价） */
export const getGoodsDetailApi = (id: string): Promise<IGoodsDetail> => {
    return http.get<IGoodsDetail>(`/goods/detail/${id}`);
};

/** 我发布的商品（后端按登录态取） */
export const getMyGoodsApi = (): Promise<Goods[]> => {
    return http.get<Goods[]>('/goods/mine');
};

/** 发布商品（卖家有未结清手续费时禁止发布） */
export const publishGoodsApi = (data: {
    title: string;
    price: number;
    /** 原价（选填，用于展示划线价） */
    originalPrice?: number;
    category: string;
    condition: string;
    description: string;
    images: string[];
}): Promise<Goods> => {
    return http.post<Goods>('/goods/publish', data);
};

/** 买家提交购买申请（平台创建订单：待卖家确认） */
export const applyBuyApi = (params: {
    goodsId: string;
    remark?: string;
}): Promise<string> => {
    return http.post<string>('/goods/apply', params);
};

/** 卖家下架商品（仅自己在售商品可下架，下架后买家不可见） */
export const offShelfGoodsApi = (goodsId: string): Promise<void> => {
    return http.post<void>('/goods/off-shelf', { goodsId });
};

/** 卖家重新上架（已下架商品恢复在售） */
export const onShelfGoodsApi = (goodsId: string): Promise<void> => {
    return http.post<void>('/goods/on-shelf', { goodsId });
};

/** 卖家删除商品（未售出的商品才可删除） */
export const deleteGoodsApi = (goodsId: string): Promise<void> => {
    return http.post<void>('/goods/delete', { goodsId });
};

/** 买家发起站内沟通（不存在则创建会话） */
export const startConversationApi = (goodsId: string): Promise<string> => {
    return http.post<string>('/goods/conversation/start', { goodsId });
};
