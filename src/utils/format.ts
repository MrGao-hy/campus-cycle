import dayjs from 'dayjs';

/** 时间格式化：今天显示时分，否则显示月日 */
export const fmtTime = (ts: number): string => {
    const d = dayjs(ts);
    if (d.isSame(dayjs(), 'day')) {
        return d.format('HH:mm');
    }
    if (d.isSame(dayjs(), 'year')) {
        return d.format('MM-DD HH:mm');
    }
    return d.format('YYYY-MM-DD HH:mm');
};

/** 完整时间（订单详情用） */
export const fmtFullTime = (ts?: number): string => (ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '-');

/** 剩余时间文案：如「23小时05分」 */
export const fmtRemain = (endTs: number): string => {
    const diff = endTs - Date.now();
    if (diff <= 0) return '已到期';
    const h = Math.floor(diff / (60 * 60 * 1000));
    const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    if (h >= 24) {
        const d = Math.floor(h / 24);
        return `${d}天${h % 24}小时`;
    }
    return `${h}小时${m.toString().padStart(2, '0')}分`;
};

/** 金额显示（保留两位，去掉多余的 0） */
export const fmtAmount = (n: number): string => Number(n.toFixed(2)).toString();
