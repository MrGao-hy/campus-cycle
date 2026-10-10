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
