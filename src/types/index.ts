export * from './modules/api';
export * from './modules/goods';
export * from './modules/user';
export * from './modules/order';
export * from './modules/complaint'
export * from './modules/conversation';

/** 学校 */
export interface School {
    id: string;
    name: string;
    shortName: string;
    /** 在售商品数 */
    goodsCount: number;
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
    '其他',
];

/** 成色 */
export const GOODS_CONDITIONS = ['全新', '几乎全新', '轻微使用', '明显使用'];

/** 手续费规则：首单免费，成交价 6%，最低 1 元，最高 20 元 */
export const FEE_RULES = {
    rate: 0.06,
    min: 1,
    max: 20,
};
