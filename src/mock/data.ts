import type {
    Appeal,
    ChatMessage,
    Complaint,
    Conversation,
    FeeBill,
    Goods,
    GoodsReview,
    Order,
    School,
    UserProfile,
} from '@/types';

/** 当前登录用户（mock 固定） */
export const CURRENT_USER_ID = 'u_10001';

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const now = Date.now();

/** 学校 */
export const schools: School[] = [
    { id: 's_0001', name: '华中科技大学', shortName: '华科', goodsCount: 1286 },
    { id: 's_0002', name: '武汉大学', shortName: '武大', goodsCount: 1502 },
    { id: 's_0003', name: '武汉理工大学', shortName: '武理', goodsCount: 864 },
    { id: 's_0004', name: '华中师范大学', shortName: '华师', goodsCount: 533 },
    {
        id: 's_0005',
        name: '中国地质大学（武汉）',
        shortName: '地大',
        goodsCount: 407,
    },
];

/** 用户 */
export const users: Record<string, UserProfile> = {
    u_10001: {
        id: 'u_10001',
        nickname: '皮蛋同学',
        schoolId: 's_0001',
        creditScore: 96,
        successCount: 1,
        contact: {
            phone: '13800001000',
            qq: '510001000',
            wechat: 'cycle_pd10001',
            email: 'pidan@hust.edu.cn',
        },
    },
    u_20001: {
        id: 'u_20001',
        nickname: '李同学',
        schoolId: 's_0001',
        creditScore: 92,
        successCount: 5,
        contact: {
            phone: '13800002000',
            qq: '510002000',
            wechat: 'cycle_li2001',
            email: 'li@hust.edu.cn',
        },
    },
    u_20002: {
        id: 'u_20002',
        nickname: '张同学',
        schoolId: 's_0001',
        creditScore: 98,
        successCount: 3,
        contact: {
            phone: '13800002001',
            qq: '510002001',
            wechat: 'cycle_zhang02',
            email: 'zhang@hust.edu.cn',
        },
    },
    u_20003: {
        id: 'u_20003',
        nickname: '王同学',
        schoolId: 's_0001',
        creditScore: 90,
        successCount: 8,
        contact: {
            phone: '13800002002',
            qq: '510002002',
            wechat: 'cycle_wang03',
            email: 'wang@hust.edu.cn',
        },
    },
};

const img = (prompt: string) =>
    `https://img1.baidu.com/it/u=2833721342,391006394&fm=253&fmt=auto&app=120&f=JPEG?w=1200&h=800`;

/** 商品 */
export const goods: Goods[] = [
    {
        id: 'g_1001',
        title: '联想小新Pro14 笔记本电脑 95新 i5 16G',
        price: 3200,
        originalPrice: 4999,
        images: [
            img(
                'used silver laptop on wooden desk in dormitory, product photo, clean background'
            ),
            img('laptop keyboard close up, product photo'),
        ],
        category: '数码',
        condition: '轻微使用',
        description:
            '大一入手，上课记笔记用，无磕碰，电池健康度 92%，含原装充电器。毕业带不走，诚心出。',
        status: 'LOCKED',
        sellerId: 'u_20001',
        schoolId: 's_0001',
        publishTime: now - 2 * DAY,
        views: 328,
        wantCount: 12,
    },
    {
        id: 'g_1002',
        title: '捷安特 ATX770 山地自行车 骑行两年',
        price: 680,
        originalPrice: 2298,
        images: [
            img(
                'second-hand mountain bike leaning on campus wall, product photo'
            ),
            img('mountain bike wheel and gear close up'),
        ],
        category: '交通',
        condition: '轻微使用',
        description:
            '校内代步神器，刚换的刹车皮，前叉有轻微掉漆，送车锁和打气筒。毕业急出。',
        status: 'ON_SALE',
        sellerId: 'u_10001',
        schoolId: 's_0001',
        publishTime: now - 3 * DAY,
        views: 215,
        wantCount: 8,
    },
    {
        id: 'g_1003',
        title: '高等数学+线性代数教材 全套9成新',
        price: 45,
        images: [
            img(
                'stack of used textbooks on study desk, soft light, product photo'
            ),
        ],
        category: '图书',
        condition: '几乎全新',
        description:
            '大一下学期课程结束，书内几乎没有笔记，全套两本一起出，可校内面交。',
        status: 'LOCKED',
        sellerId: 'u_20003',
        schoolId: 's_0001',
        publishTime: now - 1 * DAY,
        views: 96,
        wantCount: 5,
    },
    {
        id: 'g_1004',
        title: '雅马哈电子琴 PSR-E373 含琴架',
        price: 450,
        originalPrice: 1099,
        images: [
            img(
                'electronic keyboard piano with metal stand in room, product photo'
            ),
        ],
        category: '乐器',
        condition: '轻微使用',
        description:
            '社团退坑出，功能完好，含琴架和原装电源，琴键无任何问题，支持当面试弹。',
        status: 'LOCKED',
        sellerId: 'u_10001',
        schoolId: 's_0001',
        publishTime: now - 4 * DAY,
        views: 143,
        wantCount: 6,
    },
    {
        id: 'g_1005',
        title: '小米 Redmi Buds 蓝牙耳机 白色',
        price: 129,
        originalPrice: 199,
        images: [
            img(
                'white wireless earbuds in charging case on desk, product photo'
            ),
        ],
        category: '数码',
        condition: '几乎全新',
        description: '买来只用过几次，音质很好，全套包装都在，已恢复出厂设置。',
        status: 'SOLD',
        sellerId: 'u_10001',
        schoolId: 's_0001',
        publishTime: now - 8 * DAY,
        views: 187,
        wantCount: 9,
    },
    {
        id: 'g_1006',
        title: 'LED 护眼台灯 宿舍学习神器',
        price: 45,
        originalPrice: 79,
        images: [
            img(
                'white led desk lamp on study table, product photo, clean background'
            ),
        ],
        category: '生活',
        condition: '轻微使用',
        description:
            '三档调光，夹桌式设计不占地方，搬宿舍用不上了，功能一切正常。',
        status: 'SOLD',
        sellerId: 'u_10001',
        schoolId: 's_0001',
        publishTime: now - 6 * DAY,
        views: 88,
        wantCount: 3,
    },
    {
        id: 'g_1007',
        title: '斯伯丁篮球 室内外通用 7号球',
        price: 80,
        images: [
            img('basketball on outdoor court ground, sport product photo'),
        ],
        category: '运动',
        condition: '轻微使用',
        description:
            '打了一个学期，气足弹性好，表皮轻微磨损不影响使用，转专业出不打了。',
        status: 'ON_SALE',
        sellerId: 'u_20003',
        schoolId: 's_0001',
        publishTime: now - 5 * DAY,
        views: 76,
        wantCount: 4,
    },
    {
        id: 'g_1008',
        title: '全自动帐篷 2人露营 全新未拆封',
        price: 190,
        originalPrice: 299,
        images: [
            img(
                'automatic camping tent in green park, outdoor gear product photo'
            ),
        ],
        category: '户外',
        condition: '全新',
        description:
            '生日收到了两顶，全新未拆封，官方价 299，便宜出，支持验货。',
        status: 'ON_SALE',
        sellerId: 'u_20001',
        schoolId: 's_0001',
        publishTime: now - 2 * DAY,
        views: 65,
        wantCount: 2,
    },
    {
        id: 'g_1009',
        title: '松下负离子吹风机 大功率',
        price: 39,
        images: [img('modern hair dryer product photo on clean background')],
        category: '生活',
        condition: '明显使用',
        description:
            '用了两年，风力依旧很猛，宿舍限电也能用，换吹风机了低价出。',
        status: 'ON_SALE',
        sellerId: 'u_20002',
        schoolId: 's_0001',
        publishTime: now - 1 * DAY,
        views: 54,
        wantCount: 1,
    },
    {
        id: 'g_1010',
        title: 'iPad 保护壳 + 类纸膜 + 笔尖套装',
        price: 25,
        images: [
            img('tablet protective case with stylus on desk, product photo'),
        ],
        category: '数码',
        condition: '几乎全新',
        description:
            'iPad 出了，配件全新转，带笔槽可站立，类纸膜还剩两张没用。',
        status: 'ON_SALE',
        sellerId: 'u_20002',
        schoolId: 's_0001',
        publishTime: now - 12 * HOUR,
        views: 32,
        wantCount: 0,
    },
];

/** 订单 */
export const orders: Order[] = [
    {
        // 我买：卖家已确认，联系方式可见，待线下交易
        id: 'o_1001',
        goodsId: 'g_1001',
        buyerId: 'u_10001',
        sellerId: 'u_20001',
        status: 'PENDING_OFFLINE',
        price: 3200,
        applyTime: now - 2 * HOUR,
        expireTime: now + 22 * HOUR,
        sellerConfirmTime: now - 1 * HOUR,
        remark: '同学你好，非常想要，可以周四下午交易吗？',
    },
    {
        // 我卖：张同学申请购买我的山地车，待我确认，24h 内不处理自动过期
        id: 'o_1002',
        goodsId: 'g_1002',
        buyerId: 'u_20002',
        sellerId: 'u_10001',
        status: 'PENDING_SELLER',
        price: 680,
        applyTime: now - 5 * HOUR,
        expireTime: now + 19 * HOUR,
        remark: '学长好，我预算有限 650 可以吗？可以的话明天中午食堂门口交易？',
    },
    {
        // 我买：教材，线下已见面付款，待我确认完成
        id: 'o_1003',
        goodsId: 'g_1003',
        buyerId: 'u_10001',
        sellerId: 'u_20003',
        status: 'PENDING_BUYER',
        price: 45,
        applyTime: now - 1 * DAY,
        expireTime: now + 23 * HOUR,
        sellerConfirmTime: now - 20 * HOUR,
        remark: '学长好，想要全套，随时可以交易',
    },
    {
        // 我卖：电子琴，买家已确认完成，进入 48h 申诉期
        id: 'o_1004',
        goodsId: 'g_1004',
        buyerId: 'u_20003',
        sellerId: 'u_10001',
        status: 'APPEALING',
        price: 450,
        applyTime: now - 2 * DAY,
        expireTime: now + 22 * HOUR,
        sellerConfirmTime: now - 1 * DAY,
        buyerConfirmTime: now - 2 * HOUR,
        appealEndTime: now + 46 * HOUR,
    },
    {
        // 我卖：蓝牙耳机，已完成，首单免手续费，买家已评价
        id: 'o_1005',
        goodsId: 'g_1005',
        buyerId: 'u_20002',
        sellerId: 'u_10001',
        status: 'COMPLETED',
        price: 129,
        applyTime: now - 7 * DAY,
        expireTime: now - 7 * DAY + DAY,
        sellerConfirmTime: now - 6.5 * DAY,
        buyerConfirmTime: now - 6 * DAY,
        appealEndTime: now - 6 * DAY + 2 * DAY,
        completeTime: now - 6 * DAY + 2 * DAY,
        feeBilled: true,
        review: {
            rate: 5,
            content: '卖家超nice！耳机和描述一致，交易很顺利，推荐！',
            time: now - 6 * DAY + 2 * HOUR,
        },
    },
    {
        // 我卖：台灯，已完成，已生成手续费账单 2.7 元（未支付 → 禁止发布新商品）
        id: 'o_1008',
        goodsId: 'g_1006',
        buyerId: 'u_20003',
        sellerId: 'u_10001',
        status: 'COMPLETED',
        price: 45,
        applyTime: now - 5 * DAY,
        expireTime: now - 5 * DAY + DAY,
        sellerConfirmTime: now - 4.5 * DAY,
        buyerConfirmTime: now - 4 * DAY,
        appealEndTime: now - 4 * DAY + 2 * DAY,
        completeTime: now - 4 * DAY + 2 * DAY,
        feeBilled: true,
        review: {
            rate: 4,
            content: '台灯成色不错，就是约交易等了一会，整体满意。',
            time: now - 4 * DAY + 3 * HOUR,
        },
    },
    {
        // 我买：配件，我主动取消
        id: 'o_1006',
        goodsId: 'g_1010',
        buyerId: 'u_10001',
        sellerId: 'u_20002',
        status: 'CANCELLED',
        price: 25,
        applyTime: now - 3 * DAY,
        expireTime: now - 3 * DAY + DAY,
        sellerConfirmTime: now - 3 * DAY + 2 * HOUR,
        cancelTime: now - 3 * DAY + 5 * HOUR,
        cancelReason: '买家主动取消：临时不需要了',
    },
    {
        // 我买：篮球，卖家超时未确认，自动过期，不收手续费
        id: 'o_1007',
        goodsId: 'g_1007',
        buyerId: 'u_10001',
        sellerId: 'u_20003',
        status: 'CANCELLED',
        price: 80,
        applyTime: now - 3 * DAY,
        expireTime: now - 2 * DAY,
        cancelTime: now - 2 * DAY,
        cancelReason: '卖家超时未确认，订单自动过期（不收手续费）',
    },
];

/** 会话 */
export const conversations: Conversation[] = [
    {
        id: 'c_1001',
        goodsId: 'g_1001',
        buyerId: 'u_10001',
        sellerId: 'u_20001',
        lastMessage: '好的，明天上午10点图书馆一楼大厅见～',
        lastTime: now - 30 * MIN,
        unreadFor: { u_10001: 1 },
    },
    {
        id: 'c_1002',
        goodsId: 'g_1002',
        buyerId: 'u_20002',
        sellerId: 'u_10001',
        lastMessage: '同学，650 可以的话我马上提交购买申请！',
        lastTime: now - 5 * HOUR,
        unreadFor: { u_10001: 2 },
    },
    {
        id: 'c_1003',
        goodsId: 'g_1003',
        buyerId: 'u_10001',
        sellerId: 'u_20003',
        lastMessage: '教材已经给你啦，记得在平台确认完成哦',
        lastTime: now - 20 * HOUR,
        unreadFor: {},
    },
];

export const messages: ChatMessage[] = [
    {
        id: 'm_1001',
        conversationId: 'c_1001',
        fromUserId: 'u_10001',
        content: '同学你好，笔记本还在吗？电池健康度多少呀？',
        time: now - 2 * HOUR + 10 * MIN,
    },
    {
        id: 'm_1002',
        conversationId: 'c_1001',
        fromUserId: 'u_20001',
        content: '在的在的，92%，几乎全天带电用没问题',
        time: now - 2 * HOUR,
    },
    {
        id: 'm_1003',
        conversationId: 'c_1001',
        fromUserId: 'u_10001',
        content: '3200 可以刀吗？当面验机没问题我就要了',
        time: now - 1 * HOUR - 20 * MIN,
    },
    {
        id: 'm_1004',
        conversationId: 'c_1001',
        fromUserId: 'u_20001',
        content: '诚心要 3150 吧，含原装充电器，我们校内公共场所当面验',
        time: now - 1 * HOUR,
    },
    {
        id: 'm_1005',
        conversationId: 'c_1001',
        fromUserId: 'u_10001',
        content: '成交！我提交购买申请了，确认一下哈',
        time: now - 50 * MIN,
    },
    {
        id: 'm_1006',
        conversationId: 'c_1001',
        fromUserId: 'u_20001',
        content: '已确认！明天上午10点图书馆一楼大厅见～',
        time: now - 30 * MIN,
    },
    {
        id: 'm_2001',
        conversationId: 'c_1002',
        fromUserId: 'u_20002',
        content: '学长你好，山地车还在吗？',
        time: now - 6 * HOUR,
    },
    {
        id: 'm_2002',
        conversationId: 'c_1002',
        fromUserId: 'u_10001',
        content: '在的，刚换的刹车皮，随时可以看车',
        time: now - 5.5 * HOUR,
    },
    {
        id: 'm_2003',
        conversationId: 'c_1002',
        fromUserId: 'u_20002',
        content: '同学，650 可以的话我马上提交购买申请！',
        time: now - 5 * HOUR,
    },
    {
        id: 'm_3001',
        conversationId: 'c_1003',
        fromUserId: 'u_10001',
        content: '学长好，高数和线代都要，什么时候方便？',
        time: now - 1 * DAY,
    },
    {
        id: 'm_3002',
        conversationId: 'c_1003',
        fromUserId: 'u_20003',
        content: '今天晚上东体育场看台下面怎么样？人多灯也亮',
        time: now - 22 * HOUR,
    },
    {
        id: 'm_3003',
        conversationId: 'c_1003',
        fromUserId: 'u_10001',
        content: '可以，一会儿见！当面验书付款～',
        time: now - 21 * HOUR,
    },
    {
        id: 'm_3004',
        conversationId: 'c_1003',
        fromUserId: 'u_20003',
        content: '教材已经给你啦，记得在平台确认完成哦',
        time: now - 20 * HOUR,
    },
];

/** 评价 */
export const reviews: GoodsReview[] = [
    {
        id: 'r_1001',
        goodsId: 'g_1005',
        orderId: 'o_1005',
        fromUserId: 'u_20002',
        fromNickname: '张同学',
        rate: 5,
        content: '卖家超nice！耳机和描述一致，交易很顺利，推荐！',
        time: now - 6 * DAY + 2 * HOUR,
    },
    {
        id: 'r_1002',
        goodsId: 'g_1006',
        orderId: 'o_1008',
        fromUserId: 'u_20003',
        fromNickname: '王同学',
        rate: 4,
        content: '台灯成色不错，就是约交易等了一会，整体满意。',
        time: now - 4 * DAY + 3 * HOUR,
    },
];

/** 手续费账单（卖家维度） */
export const feeBills: FeeBill[] = [
    {
        id: 'f_1001',
        orderId: 'o_1005',
        sellerId: 'u_10001',
        goodsTitle: '小米 Redmi Buds 蓝牙耳机 白色',
        dealPrice: 129,
        rate: 0.06,
        amount: 0,
        freeReason: '首笔成功交易免手续费',
        status: 'PAID',
        createTime: now - 6 * DAY + 2 * DAY,
        payTime: now - 6 * DAY + 2 * DAY,
    },
    {
        id: 'f_1002',
        orderId: 'o_1008',
        sellerId: 'u_10001',
        goodsTitle: 'LED 护眼台灯 宿舍学习神器',
        dealPrice: 45,
        rate: 0.06,
        amount: 2.7,
        status: 'UNPAID',
        createTime: now - 4 * DAY + 2 * DAY,
    },
];

/** 投诉/维权记录 */
export const complaints: Complaint[] = [
    {
        // 我发起：已成立（订单投诉）
        id: 'cpl_1001',
        orderId: 'o_1007',
        goodsTitle: '斯伯丁篮球 室内外通用 7号球',
        fromUserId: 'u_10001',
        toUserId: 'u_20003',
        type: '恶意超时/恶意取消',
        content: '卖家提交申请后一直不处理，消息也不回复，怀疑恶意占货。',
        status: 'ESTABLISHED',
        time: now - 2 * DAY,
        processTime: now - 2 * DAY + 5 * HOUR,
        finishTime: now - 1 * DAY,
        reply: '已核实：卖家超时未响应且无合理解释，投诉成立。已扣除其信用分 2 分并记录在案，感谢反馈。',
    },
    {
        // 我发起：处理中（已受理，待平台核实）
        id: 'cpl_1002',
        orderId: 'o_1001',
        goodsTitle: '联想小新Pro14 笔记本电脑 95新 i5 16G',
        fromUserId: 'u_10001',
        toUserId: 'u_20001',
        type: '商品与描述不符',
        content:
            '商品描述写电池健康度 92%，但卖家聊天里承认实际只有 78%，与描述明显不符，要求按实描述重新协商。',
        images: [
            img('laptop battery health report screenshot on screen'),
            img('chat history screenshot on phone screen'),
        ],
        status: 'PROCESSING',
        time: now - 10 * HOUR,
        processTime: now - 4 * HOUR,
    },
    {
        // 我发起：待受理（安全中心通用举报，可演示取消投诉）
        id: 'cpl_1003',
        fromUserId: 'u_10001',
        toUserId: 'u_20002',
        type: '涉嫌欺诈',
        content:
            '该用户在聊天中多次诱导我脱离平台线下转账付定金，怀疑涉嫌欺诈，请平台核查。',
        images: [img('chat history screenshot on phone screen')],
        status: 'PENDING',
        time: now - 3 * HOUR,
    },
    {
        // 我发起：不成立（证据不足）
        id: 'cpl_1004',
        fromUserId: 'u_10001',
        toUserId: 'u_20003',
        type: '沟通态度恶劣',
        content: '交易时对方语气不耐烦，言辞有点冲，感觉态度恶劣。',
        status: 'NOT_ESTABLISHED',
        time: now - 5 * DAY,
        processTime: now - 5 * DAY + 6 * HOUR,
        finishTime: now - 4 * DAY,
        reply: '经核查双方聊天记录，对方言语未构成辱骂或人身攻击，属正常沟通分歧，投诉不成立。建议交易中保持友好协商。',
    },
    {
        // 我发起：已取消（投诉人主动撤销）
        id: 'cpl_1005',
        fromUserId: 'u_10001',
        toUserId: 'u_20001',
        type: '线下交易违规',
        content: '约定地点临时变更到校外，感觉不安全。',
        status: 'CANCELLED',
        time: now - 4 * DAY,
        cancelTime: now - 4 * DAY + 2 * HOUR,
        cancelReason: '双方已私下沟通和解，不需要平台介入了',
    },
    {
        // 我收到的：投诉成立，我申诉被驳回
        id: 'cpl_1006',
        orderId: 'o_1004',
        goodsTitle: '雅马哈电子琴 PSR-E373 含琴架',
        fromUserId: 'u_20003',
        toUserId: 'u_10001',
        type: '商品与描述不符',
        content:
            '电子琴描述说"功能完好"，但当面验琴时发现有两个琴键音不准，卖家事先没有说明。',
        status: 'ESTABLISHED',
        time: now - 1 * DAY - 6 * HOUR,
        processTime: now - 1 * DAY,
        finishTime: now - 8 * HOUR,
        reply: '已核实：琴键音准问题客观存在且卖家未提前说明，投诉成立。建议双方协商部分退款；卖家信用分已扣 2 分。',
    },
    {
        // 我收到的：待受理（可演示提交申诉）
        id: 'cpl_1007',
        fromUserId: 'u_20002',
        toUserId: 'u_10001',
        type: '沟通态度恶劣',
        content:
            '谈价格的时候对方一直爱答不理，回消息很慢还语气很差，感觉被糊弄。',
        status: 'PENDING',
        time: now - 6 * HOUR,
    },
];

/** 申诉记录（被投诉人提交） */
export const appeals: Appeal[] = [
    {
        // 我对 cpl_1006 的申诉：被平台驳回
        id: 'apl_1001',
        complaintId: 'cpl_1006',
        fromUserId: 'u_10001',
        content:
            '发布时商品功能一切正常，琴键音准是运输途中磕碰导致，我在交付时已当面说明，且买家现场试弹后确认收的货。',
        images: [img('chat history screenshot on phone screen')],
        status: 'REJECTED',
        time: now - 1 * DAY + 2 * HOUR,
        finishTime: now - 8 * HOUR,
        reply: '申诉材料不足以证明交付时已明确告知音准问题，聊天记录中无相关说明，维持原处理结果。',
    },
];
