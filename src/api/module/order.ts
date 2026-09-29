import { orders, users, CURRENT_USER_ID } from '@/mock/data';
import { completeOrder, delay, findGoods, findOrder, rejectDelay, sweepOrders } from '@/mock';
import { ORDER_STATUS_TEXT, type OrderRow, type OrderStatus } from '@/types';

const toRow = (orderId: string): OrderRow | undefined => {
    const order = findOrder(orderId);
    if (!order) return undefined;
    const goodsItem = findGoods(order.goodsId);
    const buyer = users[order.buyerId];
    const seller = users[order.sellerId];
    if (!goodsItem || !buyer || !seller) return undefined;
    return { order, goods: goodsItem, buyer, seller };
};

/** 订单列表（按角色 + 状态筛选，接口内先执行超时/申诉期自动流转） */
export const getOrderListApi = (params: { role: 'buyer' | 'seller'; status?: OrderStatus | 'ALL' }): Promise<OrderRow[]> => {
    sweepOrders();
    const uid = CURRENT_USER_ID;
    let list = orders.filter(o => (params.role === 'buyer' ? o.buyerId === uid : o.sellerId === uid));
    if (params.status && params.status !== 'ALL') {
        list = list.filter(o => o.status === params.status);
    }
    const rows = list.map(o => toRow(o.id)).filter((r): r is OrderRow => !!r);
    return delay(rows, 200);
};

/** 订单详情 */
export const getOrderDetailApi = (orderId: string): Promise<OrderRow> => {
    const row = toRow(orderId);
    if (!row) return rejectDelay('订单不存在');
    return delay(row, 200);
};

/** 卖家确认卖给该买家 → 待线下交易，展示联系方式 */
export const sellerConfirmApi = (orderId: string): Promise<void> => {
    const order = findOrder(orderId);
    if (!order) return rejectDelay('订单不存在');
    if (order.status !== 'PENDING_SELLER') return rejectDelay('当前状态不可确认');
    order.status = 'PENDING_OFFLINE';
    order.sellerConfirmTime = Date.now();
    const goodsItem = findGoods(order.goodsId);
    if (goodsItem && goodsItem.status === 'ON_SALE') {
        goodsItem.status = 'LOCKED';
    }
    return delay(undefined, 400);
};

/** 卖家拒绝申请（商品继续在售） */
export const sellerRejectApi = (orderId: string): Promise<void> => {
    const order = findOrder(orderId);
    if (!order) return rejectDelay('订单不存在');
    if (order.status !== 'PENDING_SELLER') return rejectDelay('当前状态不可操作');
    order.status = 'CANCELLED';
    order.cancelTime = Date.now();
    order.cancelReason = '卖家拒绝了该购买申请';
    return delay(undefined, 400);
};

/** 卖家标记已当面交付 → 提醒买家确认（待买家确认） */
export const sellerDeliveredApi = (orderId: string): Promise<void> => {
    const order = findOrder(orderId);
    if (!order) return rejectDelay('订单不存在');
    if (order.status !== 'PENDING_OFFLINE') return rejectDelay('当前状态不可操作');
    order.status = 'PENDING_BUYER';
    return delay(undefined, 400);
};

/** 买家确认已完成 → 进入 48 小时申诉期 */
export const buyerConfirmApi = (orderId: string): Promise<void> => {
    const order = findOrder(orderId);
    if (!order) return rejectDelay('订单不存在');
    if (order.status !== 'PENDING_OFFLINE' && order.status !== 'PENDING_BUYER') {
        return rejectDelay('当前状态不可确认');
    }
    const ts = Date.now();
    order.status = 'APPEALING';
    order.buyerConfirmTime = ts;
    order.appealEndTime = ts + 48 * 60 * 60 * 1000;
    return delay(undefined, 400);
};

/** 卖家在申诉期提出异议 → 平台申诉处理 */
export const sellerObjectionApi = (orderId: string): Promise<void> => {
    const order = findOrder(orderId);
    if (!order) return rejectDelay('订单不存在');
    if (order.status !== 'APPEALING') return rejectDelay('当前状态不可操作');
    order.sellerObjection = true;
    return delay(undefined, 400);
};

/** 取消订单（双方未交易成功均可取消，商品恢复在售） */
export const cancelOrderApi = (orderId: string, reason: string): Promise<void> => {
    const order = findOrder(orderId);
    if (!order) return rejectDelay('订单不存在');
    if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        return rejectDelay('当前状态不可取消');
    }
    order.status = 'CANCELLED';
    order.cancelTime = Date.now();
    order.cancelReason = reason;
    // 仅在从未进入线下交易阶段时释放商品；已锁定商品在申诉期结束后由平台处理
    if (order.status === 'CANCELLED' && !order.buyerConfirmTime) {
        const goodsItem = findGoods(order.goodsId);
        if (goodsItem && goodsItem.status === 'LOCKED' && !orders.some(o => o.goodsId === order.goodsId && o.id !== order.id && ['PENDING_OFFLINE', 'PENDING_BUYER', 'APPEALING'].includes(o.status))) {
            goodsItem.status = 'ON_SALE';
        }
    }
    return delay(undefined, 400);
};

/** 买家评价 */
export const submitReviewApi = (params: { orderId: string; rate: number; content: string }): Promise<void> => {
    const order = findOrder(params.orderId);
    if (!order) return rejectDelay('订单不存在');
    if (order.status !== 'COMPLETED') return rejectDelay('订单完成后才能评价');
    if (order.review) return rejectDelay('该订单已评价');
    order.review = { rate: params.rate, content: params.content, time: Date.now() };
    return delay(undefined, 500);
};

/** 订单状态描述（详情页辅助文案） */
export const getOrderStatusDesc = (status: OrderStatus, isBuyer: boolean): string => {
    const who = isBuyer ? '您' : '买家';
    switch (status) {
        case 'PENDING_SELLER':
            return isBuyer ? '等待卖家确认，24 小时内未处理订单将自动过期（不收手续费）' : `${who}已提交购买申请，请及时处理，超时未确认订单将自动过期`;
        case 'PENDING_OFFLINE':
            return '卖家已确认，可查看联系方式，请约定校内公共场所当面交易';
        case 'PENDING_BUYER':
            return '线下交易已完成，等待买家在平台确认';
        case 'APPEALING':
            return '买家已确认完成，48 小时申诉期内卖家可提出异议，无异议订单将自动完成';
        case 'COMPLETED':
            return '订单已完成，感谢使用校园循环';
        case 'CANCELLED':
            return '订单已取消';
        default:
            return ORDER_STATUS_TEXT[status];
    }
};
