import type { IGoods, UserProfile } from '../index';

/** 会话 */
export interface Conversation {
    id: string;
    goodsId: string;
    buyerId: string;
    sellerId: string;
    lastMessage: string;
    lastTime: number;
    /** 各自维度未读数 */
    unreadFor: Record<string, number>;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    fromUserId: string;
    content: string;
    time: number;
}

export interface ConversationRow {
    conversation: Conversation;
    goods: IGoods;
    peer: UserProfile;
    unread: number;
}

/** 手续费账单 */
export interface FeeBill {
    id: string;
    orderId: string;
    sellerId: string;
    goodsTitle: string;
    dealPrice: number;
    /** 费率 0.06 */
    rate: number;
    /** 应收金额（首单为 0） */
    amount: number;
    /** 免手续费原因 */
    freeReason?: string;
    status: 'UNPAID' | 'PAID';
    createTime: number;
    payTime?: number;
}

export interface FeeSummary {
    unpaidAmount: number;
    unpaidCount: number;
    bills: FeeBill[];
}
