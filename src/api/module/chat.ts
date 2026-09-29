import { conversations, messages, users, CURRENT_USER_ID } from '@/mock/data';
import { delay, findGoods, findUser, genId } from '@/mock';
import type { ChatMessage, ConversationRow } from '@/types';

const AUTO_REPLIES = [
    '好的，没问题～',
    '可以的同学，到时候见！',
    '嗯嗯，我们约在校内人多的地方交易哈',
    '收到，我确认一下就回复你',
    '东西还在的，随时可以交易'
];

/** 会话列表（按角色联查对端用户与商品） */
export const getConversationListApi = (): Promise<ConversationRow[]> => {
    const rows = conversations
        .filter(c => c.buyerId === CURRENT_USER_ID || c.sellerId === CURRENT_USER_ID)
        .sort((a, b) => b.lastTime - a.lastTime)
        .map(c => {
            const peerId = c.buyerId === CURRENT_USER_ID ? c.sellerId : c.buyerId;
            const peer = findUser(peerId) as ReturnType<typeof findUser>;
            const goodsItem = findGoods(c.goodsId);
            if (!peer || !goodsItem) return undefined;
            return {
                conversation: c,
                goods: goodsItem,
                peer,
                unread: c.unreadFor[CURRENT_USER_ID] || 0
            } as ConversationRow;
        })
        .filter((r): r is ConversationRow => !!r);
    return delay(rows, 200);
};

/** 聊天记录（进入会话即清空未读） */
export const getMessagesApi = (conversationId: string): Promise<ChatMessage[]> => {
    const c = conversations.find(i => i.id === conversationId);
    if (c) c.unreadFor[CURRENT_USER_ID] = 0;
    return delay(messages.filter(m => m.conversationId === conversationId), 150);
};

/** 发送消息（mock 对方自动回复） */
export const sendMessageApi = (conversationId: string, content: string): Promise<ChatMessage> => {
    const msg: ChatMessage = {
        id: genId('m'),
        conversationId,
        fromUserId: CURRENT_USER_ID,
        content,
        time: Date.now()
    };
    messages.push(msg);
    const c = conversations.find(i => i.id === conversationId);
    if (c) {
        c.lastMessage = content;
        c.lastTime = msg.time;
    }
    // 模拟对方回复
    setTimeout(() => {
        const conv = conversations.find(i => i.id === conversationId);
        if (!conv) return;
        const peerId = conv.buyerId === CURRENT_USER_ID ? conv.sellerId : conv.buyerId;
        const reply: ChatMessage = {
            id: genId('m'),
            conversationId,
            fromUserId: peerId,
            content: AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)],
            time: Date.now()
        };
        messages.push(reply);
        conv.lastMessage = reply.content;
        conv.lastTime = reply.time;
    }, 1200);
    return delay(msg, 100);
};

/** 会话内快捷发送系统安全提示（仅本人可见一条） */
export const buildSafetyTip = (): string => '【安全提醒】请在校内公共场所当面交易，当面验货后再付款，切勿提前转账或提供验证码。';

export const getPeerName = (conversationId: string): string => {
    const c = conversations.find(i => i.id === conversationId);
    if (!c) return '会话';
    const peerId = c.buyerId === CURRENT_USER_ID ? c.sellerId : c.buyerId;
    return users[peerId]?.nickname ?? '同学';
};
