import http from '@/api/request';
import type { FeeBill, FeeSummary } from '@/types';

/** 手续费账单汇总（未结清禁止发布新商品） */
export const getFeeSummaryApi = (): Promise<FeeSummary> => {
    return http.get<FeeSummary>('/fee/summary');
};

/** 账单列表 */
export const getFeeBillsApi = (): Promise<FeeBill[]> => {
    return http.get<FeeBill[]>('/fee/bills');
};

/** 支付手续费 */
export const payFeeBillApi = (billId: string): Promise<void> => {
    return http.post<void>('/fee/pay', { billId });
};

/** 是否允许发布新商品 */
export const checkPublishAllowedApi = (): Promise<{ allowed: boolean; unpaidAmount: number }> => {
    return http.get<{ allowed: boolean; unpaidAmount: number }>('/fee/check-publish');
};
