import { feeBills, CURRENT_USER_ID } from '@/mock/data';
import { delay, getSellerUnpaidAmount } from '@/mock';
import type { FeeBill, FeeSummary } from '@/types';

/** 手续费账单汇总（未结清禁止发布新商品） */
export const getFeeSummaryApi = (sellerId = CURRENT_USER_ID): Promise<FeeSummary> => {
    const bills = feeBills.filter(b => b.sellerId === sellerId).sort((a, b) => b.createTime - a.createTime);
    const unpaid = bills.filter(b => b.status === 'UNPAID');
    return delay({
        unpaidAmount: Number(unpaid.reduce((s, b) => s + b.amount, 0).toFixed(2)),
        unpaidCount: unpaid.length,
        bills
    }, 200);
};

/** 账单列表 */
export const getFeeBillsApi = (sellerId = CURRENT_USER_ID): Promise<FeeBill[]> => {
    return delay(feeBills.filter(b => b.sellerId === sellerId), 200);
};

/** 支付手续费（mock） */
export const payFeeBillApi = (billId: string): Promise<void> => {
    const bill = feeBills.find(b => b.id === billId && b.sellerId === CURRENT_USER_ID);
    if (!bill) return delay(undefined, 0);
    bill.status = 'PAID';
    bill.payTime = Date.now();
    return delay(undefined, 500);
};

/** 是否允许发布新商品 */
export const checkPublishAllowedApi = (sellerId = CURRENT_USER_ID): Promise<{ allowed: boolean; unpaidAmount: number }> => {
    const unpaidAmount = getSellerUnpaidAmount(sellerId);
    return delay({ allowed: unpaidAmount <= 0, unpaidAmount }, 150);
};
