import type { IGoods, UserProfile } from '../index';

/** 订单状态（固定六种） */
export type OrderStatus =
    | 'PENDING_SELLER'
    | 'PENDING_OFFLINE'
    | 'PENDING_BUYER'
    | 'APPEALING'
    | 'COMPLETED'
    | 'CANCELLED';

export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
    PENDING_SELLER: '待卖家确认',
    PENDING_OFFLINE: '待线下交易',
    PENDING_BUYER: '待买家确认',
    APPEALING: '申诉期',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
};

/** 订单 */
export interface Order {
    id: string;
    goodsId: string;
    buyerId: string;
    sellerId: string;
    status: OrderStatus;
    /** 成交价（申请时锁定） */
    price: number;
    /** 买家申请时间 */
    applyTime: number;
    /** 卖家处理截止时间（申请后 24h，超时自动过期不收手续费） */
    expireTime: number;
    sellerConfirmTime?: number;
    buyerConfirmTime?: number;
    /** 申诉期截止时间 = 买家确认时间 + 48h */
    appealEndTime?: number;
    /** 申诉期内卖家提出异议，进入平台申诉处理 */
    sellerObjection?: boolean;
    cancelTime?: number;
    cancelReason?: string;
    completeTime?: number;
    /** 手续费是否已随订单完成生成 */
    feeBilled?: boolean;
    /** 买家评价 */
    review?: { rate: number; content: string; time: number };
    /** 买家申请留言 */
    remark?: string;
}

/** 订单 + 关联信息（列表/详情联查视图） */
export interface OrderRow {
    order: Order;
    goods: IGoods;
    buyer: UserProfile;
    seller: UserProfile;
}

export const ORDER_STATUS_TAG: Record<
    OrderStatus,
    {
        type: 'info' | 'primary' | 'success' | 'error' | 'warning';
        plain: boolean;
    }
> = {
    PENDING_SELLER: { type: 'warning', plain: true },
    PENDING_OFFLINE: { type: 'primary', plain: true },
    PENDING_BUYER: { type: 'primary', plain: true },
    APPEALING: { type: 'error', plain: true },
    COMPLETED: { type: 'success', plain: true },
    CANCELLED: { type: 'info', plain: true },
};
