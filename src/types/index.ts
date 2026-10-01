/** 学校 */
export interface School {
    id: string;
    name: string;
    shortName: string;
    /** 在售商品数 */
    goodsCount: number;
}

/** 站内联系方式 */
export interface ContactInfo {
    phone?: string;
    qq?: string;
    wechat?: string;
    email?: string;
}

/** 联系方式展示配置（卖家确认后展示） */
export const CONTACT_ITEMS: Array<{
    key: keyof ContactInfo;
    label: string;
    icon: string;
}> = [
    { key: 'phone', label: '电话', icon: '/static/icons/telephone.png' },
    { key: 'qq', label: 'QQ', icon: '/static/icons/comment.png' },
    { key: 'wechat', label: '微信', icon: '/static/icons/message.png' },
    { key: 'email', label: '邮箱', icon: '/static/icons/send.png' },
];

/** 用户 */
export interface UserProfile {
    id: string;
    nickname: string;
    avatar?: string;
    schoolId: string;
    /** 学校名称（后端联查填充） */
    schoolName?: string;
    /** 信用分 */
    creditScore: number;
    /** 成功交易笔数（首笔免手续费判断依据） */
    successCount: number;
    contact: ContactInfo;
}

/** 用户主页（资料 + 在售商品 + 收到的评价） */
export interface UserDetail {
    profile: UserProfile;
    onSaleGoods: Goods[];
    reviews: GoodsReview[];
}

/** 商品状态 */
export type GoodsStatus = 'ON_SALE' | 'LOCKED' | 'SOLD';

export const GOODS_STATUS_TEXT: Record<GoodsStatus, string> = {
    ON_SALE: '在售',
    LOCKED: '交易进行中',
    SOLD: '已售出',
};

/** 商品 */
export interface Goods {
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
    goods: Goods;
    buyer: UserProfile;
    seller: UserProfile;
}

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
    goods: Goods;
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

/** 投诉类型 */
export const COMPLAINT_TYPES = [
    '商品与描述不符',
    '涉嫌欺诈',
    '线下交易违规',
    '沟通态度恶劣',
    '恶意超时/恶意取消',
    '其他问题',
] as const;
export type ComplaintType = (typeof COMPLAINT_TYPES)[number];

/**
 * 投诉状态流转：
 * PENDING（待受理）→ PROCESSING（处理中）→ ESTABLISHED（成立）/ NOT_ESTABLISHED（不成立）
 * PENDING → CANCELLED（投诉人主动取消）
 */
export type ComplaintStatus =
    'PENDING' | 'PROCESSING' | 'ESTABLISHED' | 'NOT_ESTABLISHED' | 'CANCELLED';

export const COMPLAINT_STATUS_TEXT: Record<ComplaintStatus, string> = {
    PENDING: '待受理',
    PROCESSING: '处理中',
    ESTABLISHED: '投诉成立',
    NOT_ESTABLISHED: '投诉不成立',
    CANCELLED: '已取消',
};

export const COMPLAINT_STATUS_TAG: Record<
    ComplaintStatus,
    {
        type: 'info' | 'primary' | 'success' | 'error' | 'warning';
        plain: boolean;
    }
> = {
    PENDING: { type: 'warning', plain: true },
    PROCESSING: { type: 'primary', plain: true },
    ESTABLISHED: { type: 'success', plain: true },
    NOT_ESTABLISHED: { type: 'error', plain: true },
    CANCELLED: { type: 'info', plain: true },
};

/** 申诉状态：被投诉人提交申诉后由平台审核 */
export type AppealStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const APPEAL_STATUS_TEXT: Record<AppealStatus, string> = {
    PENDING: '待审核',
    APPROVED: '申诉成功',
    REJECTED: '申诉驳回',
};

export const APPEAL_STATUS_TAG: Record<
    AppealStatus,
    {
        type: 'info' | 'primary' | 'success' | 'error' | 'warning';
        plain: boolean;
    }
> = {
    PENDING: { type: 'warning', plain: true },
    APPROVED: { type: 'success', plain: true },
    REJECTED: { type: 'error', plain: true },
};

/** 投诉/维权记录 */
export interface Complaint {
    id: string;
    /** 关联订单（安全中心通用举报可为空） */
    orderId?: string;
    goodsTitle?: string;
    /** 投诉人 */
    fromUserId: string;
    /** 被投诉人（通用举报可为空） */
    toUserId?: string;
    type: ComplaintType;
    content: string;
    /** 凭证图片（最多 9 张） */
    images?: string[];
    status: ComplaintStatus;
    time: number;
    /** 平台受理时间（24h 内） */
    processTime?: number;
    /** 办结时间 */
    finishTime?: number;
    /** 投诉人取消 */
    cancelTime?: number;
    cancelReason?: string;
    /** 平台处理结果说明 */
    reply?: string;
}

/** 申诉记录（被投诉人对投诉提交的申辩） */
export interface Appeal {
    id: string;
    complaintId: string;
    /** 申诉人（= 被投诉人） */
    fromUserId: string;
    content: string;
    /** 申诉凭证（最多 9 张） */
    images?: string[];
    status: AppealStatus;
    time: number;
    /** 审核完成时间 */
    finishTime?: number;
    /** 平台审核意见 */
    reply?: string;
}

/** 投诉记录联查视图 */
export interface ComplaintRow {
    complaint: Complaint;
    /** 被投诉人昵称（通用举报无） */
    peerName?: string;
    /** 投诉人昵称（被投诉视角展示） */
    fromName?: string;
    /** 该投诉下的申诉记录 */
    appeals?: Appeal[];
}

/** 申诉记录联查视图 */
export interface AppealRow {
    appeal: Appeal;
    /** 关联投诉 */
    complaint?: Complaint;
    /** 投诉人昵称 */
    complainantName?: string;
}

/** 安全提醒（商品页/订单页/消息页/安全中心通用） */
export const SAFETY_REMINDERS: string[] = [
    '不去偏僻地点、校外陌生地点、出租屋、地下车库',
    '不夜间单独交易',
    '不提前转账、不付定金给陌生人',
    '不脱离平台沟通后直接汇款',
    '保留商品照片、聊天记录、支付凭证',
    '遇到异常立即终止交易，可举报、联系学校保卫处或报警',
];

/** 购买确认页强制勾选的安全承诺 */
export const SAFETY_PROMISES: string[] = [
    '我会选择白天、校内、有人、照明良好的公共区域交易',
    '我会当面验货，确认商品无误后再支付',
    '我不会提供验证码、银行卡密码或身份证照片',
];

/** 商品分类 */
export const GOODS_CATEGORIES = [
    '推荐',
    '数码',
    '图书',
    '交通',
    '乐器',
    '运动',
    '生活',
    '户外',
];

/** 成色 */
export const GOODS_CONDITIONS = ['全新', '几乎全新', '轻微使用', '明显使用'];

/** 手续费规则：首单免费，成交价 6%，最低 1 元，最高 20 元 */
export const FEE_RULES = {
    rate: 0.06,
    min: 1,
    max: 20,
};
