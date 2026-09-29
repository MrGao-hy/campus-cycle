import { conversations, goods, orders, reviews, users, CURRENT_USER_ID } from '@/mock/data';
import { delay, findGoods, findUser, genId, getSellerUnpaidAmount, rejectDelay } from '@/mock';
import type { Goods, GoodsReview, UserProfile } from '@/types';

export interface IGoodsDetail extends Goods {
    seller: UserProfile;
    reviews: GoodsReview[];
}

/** 本校商品列表（已售出的置灰展示、不隐藏） */
export const getGoodsListApi = (params: { schoolId: string; keyword?: string; category?: string }): Promise<Goods[]> => {
    let list = goods.filter(g => g.schoolId === params.schoolId);
    if (params.category && params.category !== '推荐') {
        list = list.filter(g => g.category === params.category);
    }
    if (params.keyword) {
        const kw = params.keyword.trim();
        list = list.filter(g => g.title.includes(kw) || g.description.includes(kw));
    }
    return delay(list);
};

/** 商品详情（含卖家信息与评价） */
export const getGoodsDetailApi = async (id: string): Promise<IGoodsDetail> => {
    const item = findGoods(id);
    if (!item) {
        return rejectDelay('商品不存在或已删除');
    }
    const seller = findUser(item.sellerId) as UserProfile;
    const goodsReviews = reviews.filter(r => r.goodsId === id);
    return delay({ ...item, seller, reviews: goodsReviews }, 200);
};

/** 我发布的商品 */
export const getMyGoodsApi = (sellerId = CURRENT_USER_ID): Promise<Goods[]> => {
    return delay(goods.filter(g => g.sellerId === sellerId));
};

/** 发布商品（卖家有未结清手续费时禁止发布） */
export const publishGoodsApi = (data: {
    title: string;
    price: number;
    category: string;
    condition: string;
    description: string;
    images: string[];
}): Promise<Goods> => {
    const unpaid = getSellerUnpaidAmount(CURRENT_USER_ID);
    if (unpaid > 0) {
        return rejectDelay(`您有未结清手续费 ${unpaid} 元，结清前暂不能发布新商品`);
    }
    const item: Goods = {
        id: genId('g'),
        title: data.title,
        price: data.price,
        images: data.images,
        category: data.category,
        condition: data.condition,
        description: data.description,
        status: 'ON_SALE',
        sellerId: CURRENT_USER_ID,
        schoolId: users[CURRENT_USER_ID].schoolId,
        publishTime: Date.now(),
        views: 0,
        wantCount: 0
    };
    goods.unshift(item);
    return delay(item, 500);
};

/** 买家提交购买申请（平台创建订单：待卖家确认） */
export const applyBuyApi = (params: { goodsId: string; remark?: string }): Promise<string> => {
    const item = findGoods(params.goodsId);
    if (!item) return rejectDelay('商品不存在');
    if (item.sellerId === CURRENT_USER_ID) return rejectDelay('不能购买自己发布的商品');
    if (item.status !== 'ON_SALE') return rejectDelay(item.status === 'SOLD' ? '商品已售出' : '该商品已有订单进行中');

    const hasPending = orders.some(o => o.goodsId === item.id && o.buyerId === CURRENT_USER_ID && o.status === 'PENDING_SELLER');
    if (hasPending) return rejectDelay('您已提交过申请，请等待卖家确认');

    const orderId = genId('o');
    const ts = Date.now();
    orders.unshift({
        id: orderId,
        goodsId: item.id,
        buyerId: CURRENT_USER_ID,
        sellerId: item.sellerId,
        status: 'PENDING_SELLER',
        price: item.price,
        applyTime: ts,
        expireTime: ts + 24 * 60 * 60 * 1000,
        remark: params.remark
    });
    item.wantCount += 1;
    return delay(orderId, 500);
};

/** 买家发起站内沟通（不存在则创建会话） */
export const startConversationApi = (goodsId: string): Promise<string> => {
    const item = findGoods(goodsId);
    if (!item) return rejectDelay('商品不存在');
    const exists = conversations.find(c => c.goodsId === goodsId && (c.buyerId === CURRENT_USER_ID || c.sellerId === CURRENT_USER_ID));
    if (exists) return delay(exists.id, 100);
    const id = genId('c');
    conversations.unshift({
        id,
        goodsId,
        buyerId: item.sellerId === CURRENT_USER_ID ? '' : CURRENT_USER_ID,
        sellerId: item.sellerId,
        lastMessage: '',
        lastTime: Date.now(),
        unreadFor: {}
    });
    return delay(id, 200);
};
