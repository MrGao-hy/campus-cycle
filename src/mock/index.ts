import { FEE_RULES, type FeeBill, type Goods, type Order, type UserProfile } from '@/types';
import { feeBills, goods, orders, users } from './data';

/** 模拟接口延迟 */
export const delay = <T>(data: T, ms = 300): Promise<T> =>
    new Promise(resolve => {
        setTimeout(() => resolve(data), ms);
    });

/** 模拟接口失败 */
export const rejectDelay = (message: string, ms = 300): Promise<never> =>
    new Promise((_, reject) => {
        setTimeout(() => reject(new Error(message)), ms);
    });

let seed = 1000;
export const genId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seed++).toString(36)}`;

/**
 * 手续费计算：
 * - 卖家第一笔成功交易免手续费
 * - 之后按成交价 6% 收取，最低 1 元，最高 20 元
 */
export const computeFee = (dealPrice: number, isFirstTrade: boolean): { amount: number; freeReason?: string } => {
    if (isFirstTrade) {
        return { amount: 0, freeReason: '首笔成功交易免手续费' };
    }
    const raw = Number((dealPrice * FEE_RULES.rate).toFixed(2));
    const amount = Math.min(FEE_RULES.max, Math.max(FEE_RULES.min, raw));
    return { amount };
};

/** 订单状态自动流转（mock 后台定时任务）：
 * 1. 待卖家确认超时 → 自动过期取消，不收手续费
 * 2. 申诉期到期且卖家无异议 → 自动完成、商品置灰、生成手续费账单
 */
export const sweepOrders = () => {
    const ts = Date.now();
    orders.forEach(order => {
        if (order.status === 'PENDING_SELLER' && ts > order.expireTime) {
            order.status = 'CANCELLED';
            order.cancelTime = order.expireTime;
            order.cancelReason = '卖家超时未确认，订单自动过期（不收手续费）';
        }
        if (order.status === 'APPEALING' && !order.sellerObjection && order.appealEndTime && ts > order.appealEndTime) {
            completeOrder(order);
        }
    });
};

/** 订单最终完成：商品置灰（不隐藏）、生成手续费账单 */
export const completeOrder = (order: Order) => {
    const ts = Date.now();
    order.status = 'COMPLETED';
    order.completeTime = ts;
    order.appealEndTime = order.appealEndTime ?? ts;

    const seller = users[order.sellerId];
    const goodsItem = goods.find(g => g.id === order.goodsId);
    if (goodsItem) {
        // 商品置灰，不隐藏
        goodsItem.status = 'SOLD';
    }

    // 手续费只在订单最终完成后生成
    if (!order.feeBilled && seller && goodsItem) {
        const isFirst = seller.successCount === 0;
        const { amount, freeReason } = computeFee(order.price, isFirst);
        seller.successCount += 1;
        const bill: FeeBill = {
            id: genId('f'),
            orderId: order.id,
            sellerId: order.sellerId,
            goodsTitle: goodsItem.title,
            dealPrice: order.price,
            rate: FEE_RULES.rate,
            amount,
            freeReason,
            status: amount === 0 ? 'PAID' : 'UNPAID',
            createTime: ts,
            payTime: amount === 0 ? ts : undefined
        };
        feeBills.unshift(bill);
        order.feeBilled = true;
    }
};

/** 卖家是否还有未结清手续费（未结清禁止发布新商品） */
export const getSellerUnpaidAmount = (sellerId: string): number =>
    feeBills.filter(b => b.sellerId === sellerId && b.status === 'UNPAID').reduce((sum, b) => sum + b.amount, 0);

export const findGoods = (id: string): Goods | undefined => goods.find(g => g.id === id);
export const findUser = (id: string): UserProfile | undefined => users[id];
export const findOrder = (id: string): Order | undefined => {
    sweepOrders();
    return orders.find(o => o.id === id);
};
