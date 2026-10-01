import { appeals, complaints, CURRENT_USER_ID } from '@/mock/data';
import {
    delay,
    findGoods,
    findOrder,
    findUser,
    genId,
    rejectDelay,
} from '@/mock';
import type {
    Appeal,
    AppealRow,
    Complaint,
    ComplaintRow,
    ComplaintType,
} from '@/types';

/** 投诉联查：补充对方昵称与申诉记录 */
const toRow = (c: Complaint): ComplaintRow => ({
    complaint: c,
    peerName: c.toUserId ? findUser(c.toUserId)?.nickname : undefined,
    fromName: findUser(c.fromUserId)?.nickname,
    appeals: appeals
        .filter(a => a.complaintId === c.id)
        .sort((a, b) => b.time - a.time),
});

/** 提交投诉/维权（仅订单双方可发起订单投诉；安全中心通用举报不带订单） */
export const submitComplaintApi = (params: {
    orderId?: string;
    type: ComplaintType;
    content: string;
    images?: string[];
}): Promise<void> => {
    const uid = CURRENT_USER_ID;
    let toUserId: string | undefined;
    let goodsTitle: string | undefined;
    if (params.orderId) {
        const order = findOrder(params.orderId);
        if (!order) return rejectDelay('订单不存在');
        if (order.buyerId !== uid && order.sellerId !== uid) {
            return rejectDelay('仅订单双方可发起投诉');
        }
        toUserId = order.buyerId === uid ? order.sellerId : order.buyerId;
        goodsTitle = findGoods(order.goodsId)?.title;
    }
    complaints.unshift({
        id: genId('cpl'),
        orderId: params.orderId,
        goodsTitle,
        fromUserId: uid,
        toUserId,
        type: params.type,
        content: params.content,
        images: params.images,
        status: 'PENDING',
        time: Date.now(),
    });
    return delay(undefined, 500);
};

/** 我的投诉记录（我发起的） */
export const getMyComplaintsApi = (): Promise<ComplaintRow[]> => {
    const uid = CURRENT_USER_ID;
    const rows = complaints
        .filter(c => c.fromUserId === uid)
        .sort((a, b) => b.time - a.time)
        .map(toRow);
    return delay(rows, 200);
};

/** 收到的投诉记录（我被投诉的） */
export const getComplaintsAgainstMeApi = (): Promise<ComplaintRow[]> => {
    const uid = CURRENT_USER_ID;
    const rows = complaints
        .filter(c => c.toUserId === uid)
        .sort((a, b) => b.time - a.time)
        .map(toRow);
    return delay(rows, 200);
};

/** 我的申诉记录 */
export const getMyAppealsApi = (): Promise<AppealRow[]> => {
    const uid = CURRENT_USER_ID;
    const rows = appeals
        .filter(a => a.fromUserId === uid)
        .sort((a, b) => b.time - a.time)
        .map(a => ({
            appeal: a,
            complaint: complaints.find(c => c.id === a.complaintId),
            complainantName: complaints.find(c => c.id === a.complaintId)
                ? findUser(
                      complaints.find(c => c.id === a.complaintId)!.fromUserId
                  )?.nickname
                : undefined,
        }));
    return delay(rows, 200);
};

/** 投诉详情（投诉人/被投诉人双方视角通用） */
export const getComplaintDetailApi = (id: string): Promise<ComplaintRow> => {
    const c = complaints.find(c => c.id === id);
    if (!c) return rejectDelay('投诉记录不存在');
    return delay(toRow(c), 200);
};

/** 取消投诉（仅投诉人、待受理状态可取消） */
export const cancelComplaintApi = (
    id: string,
    reason: string
): Promise<void> => {
    const uid = CURRENT_USER_ID;
    const c = complaints.find(c => c.id === id);
    if (!c) return rejectDelay('投诉记录不存在');
    if (c.fromUserId !== uid) return rejectDelay('仅投诉人可取消');
    if (c.status !== 'PENDING') return rejectDelay('平台已受理，无法取消');
    c.status = 'CANCELLED';
    c.cancelTime = Date.now();
    c.cancelReason = reason;
    return delay(undefined, 400);
};

/** 提交申诉（仅被投诉人；待受理/处理中且尚未申诉过） */
export const submitAppealApi = (params: {
    complaintId: string;
    content: string;
    images?: string[];
}): Promise<void> => {
    const uid = CURRENT_USER_ID;
    const c = complaints.find(c => c.id === params.complaintId);
    if (!c) return rejectDelay('投诉记录不存在');
    if (c.toUserId !== uid) return rejectDelay('仅被投诉人可提交申诉');
    if (c.status !== 'PENDING' && c.status !== 'PROCESSING') {
        return rejectDelay('当前状态无法申诉');
    }
    if (appeals.some(a => a.complaintId === c.id && a.fromUserId === uid)) {
        return rejectDelay('已提交过申诉，请等待平台审核');
    }
    const appeal: Appeal = {
        id: genId('apl'),
        complaintId: c.id,
        fromUserId: uid,
        content: params.content,
        images: params.images,
        status: 'PENDING',
        time: Date.now(),
    };
    appeals.unshift(appeal);
    // 有申诉即进入平台核实处理
    if (c.status === 'PENDING') {
        c.status = 'PROCESSING';
        c.processTime = c.processTime ?? Date.now();
    }
    return delay(undefined, 500);
};
