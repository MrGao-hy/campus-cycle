import http from '@/api/request';
import { ORDER_STATUS_TEXT, type OrderRow, type OrderStatus } from '@/types';

/** 订单列表（按角色 + 状态筛选，后端查询前兜底执行超时/申诉期自动流转） */
export const getOrderListApi = (params: { role: 'buyer' | 'seller'; status?: OrderStatus | 'ALL' }): Promise<OrderRow[]> => {
    return http.get<OrderRow[]>('/order/list', params);
};

/** 订单详情 */
export const getOrderDetailApi = (orderId: string): Promise<OrderRow> => {
    return http.get<OrderRow>(`/order/detail/${orderId}`);
};

/** 卖家确认卖给该买家 → 待线下交易，展示联系方式 */
export const sellerConfirmApi = (orderId: string): Promise<void> => {
    return http.post<void>('/order/seller-confirm', { orderId });
};

/** 卖家拒绝申请（商品继续在售） */
export const sellerRejectApi = (orderId: string): Promise<void> => {
    return http.post<void>('/order/seller-reject', { orderId });
};

/** 卖家标记已当面交付 → 提醒买家确认（待买家确认） */
export const sellerDeliveredApi = (orderId: string): Promise<void> => {
    return http.post<void>('/order/seller-delivered', { orderId });
};

/** 买家确认已完成 → 进入 48 小时申诉期 */
export const buyerConfirmApi = (orderId: string): Promise<void> => {
    return http.post<void>('/order/buyer-confirm', { orderId });
};

/** 卖家在申诉期提出异议 → 平台申诉处理 */
export const sellerObjectionApi = (orderId: string): Promise<void> => {
    return http.post<void>('/order/seller-objection', { orderId });
};

/** 取消订单（双方未交易成功均可取消，商品恢复在售） */
export const cancelOrderApi = (orderId: string, reason: string): Promise<void> => {
    return http.post<void>('/order/cancel', { orderId, reason });
};

/** 买家评价 */
export const submitReviewApi = (params: { orderId: string; rate: number; content: string }): Promise<void> => {
    return http.post<void>('/order/review', params);
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
