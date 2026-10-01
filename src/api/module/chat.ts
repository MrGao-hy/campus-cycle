import http from '@/api/request';
import type { ChatMessage, ConversationRow } from '@/types';

/** 会话列表（按角色联查对端用户与商品） */
export const getConversationListApi = (): Promise<ConversationRow[]> => {
    return http.get<ConversationRow[]>('/chat/conversations');
};

/** 聊天记录（进入会话即清空未读） */
export const getMessagesApi = (conversationId: string): Promise<ChatMessage[]> => {
    return http.get<ChatMessage[]>('/chat/messages', { conversationId });
};

/** 发送消息 */
export const sendMessageApi = (conversationId: string, content: string): Promise<ChatMessage> => {
    return http.post<ChatMessage>('/chat/send', { conversationId, content });
};

/** 会话内快捷发送系统安全提示（仅本人可见一条） */
export const buildSafetyTip = (): string => '【安全提醒】请在校内公共场所当面交易，当面验货后再付款，切勿提前转账或提供验证码。';

/** 兜底会话昵称（真实数据以会话列表联查为准） */
export const getPeerName = (_conversationId: string): string => '同学';
