import http from '@/api/request';
import type {
    GoodsReview,
    IGoods,
    IPage,
    UserProfile,
    ISearchGoods,
} from '@/types';

export interface IGoodsDetail extends IGoods {
    seller: UserProfile;
    reviews: GoodsReview[];
}

/** 本校商品列表（已售出的置灰展示、不隐藏） */
export const getGoodsListApi = (
    params: ISearchGoods
): Promise<IPage<IGoods>> => {
    return http.get('/goods/list', params);
};

/** 商品详情（含卖家信息与评价） */
export const getGoodsDetailApi = (id: string): Promise<IGoodsDetail> => {
    return http.get<IGoodsDetail>(`/goods/detail/${id}`);
};

/** 我发布的商品（后端按登录态取，sellerId 参数兼容保留） */
export const getMyGoodsApi = (_sellerId?: string): Promise<IPage<IGoods>> => {
    return http.get('/goods/mine');
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
}): Promise<IGoods> => {
    return http.post<IGoods>('/goods/publish', data);
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

/** 卖家删除商品（未售出的商品才可删除） */
export const deleteGoodsApi = (goodsId: string): Promise<void> => {
    return http.post<void>('/goods/delete', { goodsId });
};

/** 买家发起站内沟通（不存在则创建会话） */
export const startConversationApi = (goodsId: string): Promise<string> => {
    return http.post<string>('/goods/conversation/start', { goodsId });
};
