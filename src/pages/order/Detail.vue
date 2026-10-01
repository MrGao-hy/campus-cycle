<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import SafetyTips from '@/components/SafetyTips.vue';
import {
    buyerConfirmApi,
    cancelOrderApi,
    getOrderDetailApi,
    getOrderStatusDesc,
    sellerConfirmApi,
    sellerDeliveredApi,
    sellerObjectionApi,
    sellerRejectApi,
    submitReviewApi,
} from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { fmtAmount, fmtFullTime, fmtRemain } from '@/utils/format';
import {
    CONTACT_ITEMS,
    ORDER_STATUS_TAG,
    ORDER_STATUS_TEXT,
    type ContactInfo,
    type OrderRow,
} from '@/types';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, onUnmounted, ref } from 'vue';
import dayjs from 'dayjs';

definePage({
    style: {
        navigationBarTitleText: '订单详情',
    },
});

const toast = useToast();
const userStore = useUserStore();

const orderId = ref('');
const row = ref<OrderRow | null>(null);
const loading = ref(true);
const modalShow = ref(false);
const modalType = ref<
    | 'confirm'
    | 'reject'
    | 'cancelBuyer'
    | 'cancelSeller'
    | 'objection'
    | 'buyerConfirm'
>('confirm');
const tick = ref(0);

const isBuyer = computed(
    () => row.value?.order.buyerId === userStore.userInfo?.id
);
const order = computed(() => row.value?.order);
const goods = computed(() => row.value?.goods);

/** 联系方式仅在卖家确认后展示 */
const CONTACT_VISIBLE_STATUS = [
    'PENDING_OFFLINE',
    'PENDING_BUYER',
    'APPEALING',
    'COMPLETED',
];
const contactsVisible = computed(
    () => !!order.value && CONTACT_VISIBLE_STATUS.includes(order.value.status)
);
const peerContact = computed<ContactInfo>(() =>
    isBuyer.value
        ? row.value?.seller.contact || {}
        : row.value?.buyer.contact || {}
);
const peerLabel = computed(() => (isBuyer.value ? '卖家' : '买家'));

/** 步骤条进度 */
const stepCurrent = computed(() => {
    switch (order.value?.status) {
        case 'PENDING_SELLER':
            return 1;
        case 'PENDING_OFFLINE':
            return 2;
        case 'PENDING_BUYER':
            return 3;
        case 'APPEALING':
            return order.value?.sellerObjection ? 4 : 4;
        case 'COMPLETED':
            return 5;
        case 'CANCELLED':
            return 1;
        default:
            return 0;
    }
});
const stepList = computed(() => [
    { title: '提交申请', docs: fmtFullTime(order.value?.applyTime) },
    { title: '卖家确认', docs: fmtFullTime(order.value?.sellerConfirmTime) },
    { title: '买家确认', docs: fmtFullTime(order.value?.buyerConfirmTime) },
    {
        title: order.value?.sellerObjection ? '平台申诉' : '申诉期(48h)',
        docs: order.value?.sellerObjection
            ? '卖家已提出异议'
            : fmtRemain(order.value?.appealEndTime || 0),
    },
    { title: '完成', docs: fmtFullTime(order.value?.completeTime) },
]);

/** 倒计时文案 */
const countdownText = computed(() => {
    tick.value; // 依赖 tick 触发重算
    if (!order.value) return '';
    if (order.value.status === 'PENDING_SELLER') {
        return `剩余处理时间 ${fmtRemain(order.value.expireTime)}，超时订单自动过期`;
    }
    if (order.value.status === 'APPEALING' && order.value.appealEndTime) {
        return order.value.sellerObjection
            ? '平台申诉处理中，请留意站内通知'
            : `申诉期剩余 ${fmtRemain(order.value.appealEndTime)}，到期有异议自动完成`;
    }
    return '';
});
setInterval(() => (tick.value += 1), 30 * 1000);

const load = async () => {
    if (!orderId.value) return;
    try {
        row.value = await getOrderDetailApi(orderId.value);
    } catch (e) {
        toast.error('订单不存在');
    }
    loading.value = false;
};

onLoad(options => {
    orderId.value = (options?.id as string) || '';
});
onShow(load);

const openModal = (type: typeof modalType.value) => {
    modalType.value = type;
    modalShow.value = true;
};

const onModalConfirm = async () => {
    if (!order.value) return;
    try {
        switch (modalType.value) {
            case 'confirm':
                await sellerConfirmApi(order.value.id);
                toast.success('已确认，联系方式已对买家展示');
                break;
            case 'reject':
                await sellerRejectApi(order.value.id);
                toast.info('已拒绝申请，商品继续在售');
                break;
            case 'cancelBuyer':
                await cancelOrderApi(order.value.id, '买家主动取消');
                toast.info('订单已取消');
                break;
            case 'cancelSeller':
                await cancelOrderApi(
                    order.value.id,
                    '卖家取消订单（未交易成功）'
                );
                toast.info('订单已取消，商品恢复在售');
                break;
            case 'objection':
                await sellerObjectionApi(order.value.id);
                toast.info('已提交异议，进入平台申诉处理');
                break;
            case 'buyerConfirm':
                await buyerConfirmApi(order.value.id);
                toast.success('已确认完成，进入 48 小时申诉期');
                break;
        }
        load();
    } catch (e) {
        toast.error((e as Error).message || '操作失败');
    }
};

/** 投诉与维权 */
const goComplaint = () => {
    uni.navigateTo({ url: `/pages/complaint/Index?orderId=${orderId.value}` });
};

const doDelivered = async () => {
    try {
        await sellerDeliveredApi(order.value!.id);
        toast.success('已提醒买家确认');
        load();
    } catch (e) {
        toast.error((e as Error).message || '操作失败');
    }
};

const copyText = (text: string) => {
    uni.setClipboardData({
        data: text,
        success: () => toast.success('已复制'),
    });
};

const goChat = () => {
    uni.navigateTo({ url: `/pages/chat/Detail?goodsId=${goods.value?.id}` });
};

const goReview = () => {
    uni.navigateTo({ url: `/pages/order/Review?orderId=${orderId.value}` });
};

const goFee = () => {
    uni.navigateTo({ url: '/pages/fee/Index' });
};

const goGoods = () => {
    uni.navigateTo({ url: `/pages/goods/Detail?id=${goods.value?.id}` });
};

const callPhone = (phone: string) => {
    uni.makePhoneCall({ phoneNumber: phone, fail: () => {} });
};

/** 买家便捷确认收货评价（完成页内快速评价） */
const reviewRate = ref(5);
const reviewContent = ref('');
const doReviewInline = async () => {
    try {
        await submitReviewApi({
            orderId: orderId.value,
            rate: reviewRate.value,
            content: reviewContent.value || '交易顺利，好评！',
        });
        toast.success('评价成功');
        load();
    } catch (e) {
        toast.error((e as Error).message || '评价失败');
    }
};

const fmtDate = (ts: number) => dayjs(ts).format('YYYY-MM-DD HH:mm');
</script>

<template>
    <the-root-pages>
        <view v-if="row && order && goods" class="od">
            <!-- 状态头部 -->
            <view
                class="od__header"
                :class="`od__header--${order.status.toLowerCase()}`"
            >
                <view class="od__status-row">
                    <text class="od__status">{{
                        ORDER_STATUS_TEXT[order.status]
                    }}</text>
                    <text v-if="order.sellerObjection" class="od__status-sub"
                        >平台申诉处理中</text
                    >
                </view>
                <text class="od__desc">{{
                    getOrderStatusDesc(order.status, isBuyer)
                }}</text>
                <text v-if="countdownText" class="od__countdown">{{
                    countdownText
                }}</text>
                <view
                    v-if="order.status === 'CANCELLED' && order.cancelReason"
                    class="od__cancel-reason"
                    >取消原因：{{ order.cancelReason }}</view
                >
            </view>

            <!-- 步骤条 -->
            <view v-if="order.status !== 'CANCELLED'" class="od__steps">
                <hy-steps
                    :list="stepList"
                    :current="stepCurrent"
                    direction="row"
                    :dot="false"
                    icon-size="14"
                ></hy-steps>
            </view>

            <!-- 商品卡片 -->
            <view
                class="od__goods"
                hover-class="od__goods--hover"
                :hover-stay-time="120"
                @tap="goGoods"
            >
                <hy-image
                    :src="goods.images[0]"
                    width="140rpx"
                    height="140rpx"
                    radius="10rpx"
                />
                <view class="od__goods-info">
                    <view class="od__goods-title">{{ goods.title }}</view>
                    <hy-price :text="String(order.price)" :size="18" />
                </view>
                <hy-icon
                    name="right"
                    color="var(--hy-text-color--3, #929295)"
                    :size="14"
                ></hy-icon>
            </view>
            <!-- 联系方式（卖家确认后展示） -->
            <view class="od__card">
                <view class="od__card-title">{{ peerLabel }}联系方式</view>
                <template v-if="contactsVisible">
                    <view v-for="item in CONTACT_ITEMS" :key="item.key">
                        <view v-if="peerContact[item.key]" class="od__contact">
                            <view class="od__contact-icon">
                                <hy-icon
                                    :name="item.icon"
                                    color="var(--primary, #3d7eff)"
                                    :size="18"
                                />
                            </view>
                            <text class="od__contact-label">{{
                                item.label
                            }}</text>
                            <text class="od__contact-value">{{
                                peerContact[item.key]
                            }}</text>
                            <hy-button
                                v-if="item.key === 'phone'"
                                text="拨打"
                                type="primary"
                                size="mini"
                                plain
                                shape="circle"
                                @click="callPhone(peerContact[item.key]!)"
                            ></hy-button>
                            <hy-button
                                text="复制"
                                size="mini"
                                plain
                                shape="circle"
                                @click="copyText(peerContact[item.key]!)"
                            ></hy-button>
                        </view>
                    </view>
                </template>
                <view v-else class="od__contact-locked">
                    <hy-icon
                        name="lock"
                        color="var(--hy-text-color--3, #929295)"
                        :size="16"
                    />
                    <text
                        >卖家确认购买申请后展示联系方式（电话 / QQ / 微信 /
                        邮箱）</text
                    >
                </view>
            </view>

            <!-- 订单信息 -->
            <view class="od__card">
                <view class="od__card-title">订单信息</view>
                <view class="od__info-row" @tap="copyText(order.id)">
                    <text class="od__info-label">订单编号</text>
                    <text class="od__info-value"
                        >{{ order.id }}（点击复制）</text
                    >
                </view>
                <view class="od__info-row">
                    <text class="od__info-label">{{
                        isBuyer ? '卖家' : '买家'
                    }}</text>
                    <text class="od__info-value">{{
                        isBuyer ? row.seller.nickname : row.buyer.nickname
                    }}</text>
                </view>
                <view class="od__info-row">
                    <text class="od__info-label">成交价格</text>
                    <text class="od__info-value"
                        >￥{{ fmtAmount(order.price) }}（线下当面支付）</text
                    >
                </view>
                <view class="od__info-row">
                    <text class="od__info-label">手续费</text>
                    <text class="od__info-value">
                        {{
                            isBuyer
                                ? '买家免费，手续费由卖家承担'
                                : order.completeTime
                                  ? '订单完成后生成账单，见下方'
                                  : '订单完成后生成账单'
                        }}
                    </text>
                </view>
                <view v-if="order.remark" class="od__info-row">
                    <text class="od__info-label">申请留言</text>
                    <text class="od__info-value">{{ order.remark }}</text>
                </view>
                <view v-if="order.sellerConfirmTime" class="od__info-row">
                    <text class="od__info-label">卖家确认时间</text>
                    <text class="od__info-value">{{
                        fmtDate(order.sellerConfirmTime)
                    }}</text>
                </view>
                <view v-if="order.buyerConfirmTime" class="od__info-row">
                    <text class="od__info-label">买家确认时间</text>
                    <text class="od__info-value">{{
                        fmtDate(order.buyerConfirmTime)
                    }}</text>
                </view>
            </view>

            <!-- 投诉与维权入口 -->
            <view
                class="od__rights"
                hover-class="od__rights--hover"
                :hover-stay-time="120"
                @tap="goComplaint"
            >
                <view class="od__rights-icon">
                    <hy-icon
                        name="warning"
                        color="var(--hy-error, #f56c6c)"
                        :size="18"
                    />
                </view>
                <view class="od__rights-info">
                    <view class="od__rights-title">投诉与维权</view>
                    <text class="od__rights-sub"
                        >遇到欺诈、描述不符或线下违规，可发起投诉</text
                    >
                </view>
                <hy-icon
                    name="right"
                    color="var(--hy-text-color--placeholder, #c0c4cc)"
                    :size="14"
                />
            </view>

            <!-- 卖家手续费账单 -->
            <view
                v-if="!isBuyer && order.status === 'COMPLETED'"
                class="od__card od__fee-card"
            >
                <view class="od__card-title">手续费账单</view>
                <template v-if="order.feeBilled">
                    <view class="od__info-row">
                        <text class="od__info-label">账单状态</text>
                        <text class="od__info-value"
                            >已生成（6% 费率，最低 1 元最高 20 元）</text
                        >
                    </view>
                    <hy-button
                        text="查看手续费账单"
                        type="warning"
                        size="small"
                        plain
                        :custom-style="{ marginTop: '16rpx' }"
                        @click="goFee"
                    ></hy-button>
                </template>
            </view>

            <!-- 买家评价展示 -->
            <view v-if="order.review" class="od__card">
                <view class="od__card-title">买家评价</view>
                <hy-rate
                    :model-value="order.review.rate"
                    readonly
                    :size="14"
                    active-color="#FFB300"
                ></hy-rate>
                <view class="od__review-content">{{
                    order.review.content
                }}</view>
            </view>

            <!-- 买家快速评价 -->
            <view
                v-if="isBuyer && order.status === 'COMPLETED' && !order.review"
                class="od__card"
            >
                <view class="od__card-title">评价本次交易</view>
                <hy-rate
                    v-model="reviewRate"
                    :size="22"
                    active-color="#FFB300"
                ></hy-rate>
                <hy-textarea
                    v-model="reviewContent"
                    placeholder="说说这次的交易体验吧（选填）"
                    :maxlength="100"
                    count
                    auto-height
                    border="surround"
                    :custom-style="{ marginTop: '16rpx' }"
                ></hy-textarea>
                <hy-button
                    text="提交评价"
                    type="primary"
                    shape="circle"
                    :custom-style="{ marginTop: '20rpx' }"
                    @click="doReviewInline"
                ></hy-button>
            </view>

            <!-- 交易安全提醒（订单页强制展示） -->
            <view class="od__safety">
                <safety-tips :compact="true"></safety-tips>
            </view>

            <!-- 线下交易确认提醒 -->
            <view
                v-if="order.status === 'PENDING_OFFLINE'"
                class="od__remind od__remind--primary"
            >
                <hy-icon
                    name="notice"
                    color="var(--primary, #3d7eff)"
                    :size="16"
                />
                <text
                    >线下交易完成后，请买家及时在平台确认订单；确认后如遇纠纷，可在
                    48 小时申诉期内发起投诉维权</text
                >
            </view>

            <!-- 交易完成打分提醒 -->
            <view
                v-if="isBuyer && order.status === 'COMPLETED' && !order.review"
                class="od__remind od__remind--warn"
            >
                <hy-icon
                    name="remind"
                    color="var(--warning, #f9ae3d)"
                    :size="16"
                />
                <text
                    >交易已完成，别忘了在上方给对方打个分，你的评价能帮助更多同学放心交易</text
                >
            </view>

            <!-- 操作区 -->
            <view class="od__actions">
                <!-- 待卖家确认 -->
                <template v-if="order.status === 'PENDING_SELLER'">
                    <template v-if="!isBuyer">
                        <hy-button
                            text="拒绝申请"
                            shape="circle"
                            plain
                            type="error"
                            :custom-style="{ flex: 1 }"
                            @click="openModal('reject')"
                        ></hy-button>
                        <hy-button
                            text="确认卖给 TA"
                            shape="circle"
                            type="primary"
                            :custom-style="{ flex: 1 }"
                            @click="openModal('confirm')"
                        ></hy-button>
                    </template>
                    <template v-else>
                        <hy-button
                            text="联系卖家"
                            shape="circle"
                            plain
                            type="primary"
                            :custom-style="{ flex: 1 }"
                            @click="goChat"
                        ></hy-button>
                        <hy-button
                            text="取消申请"
                            shape="circle"
                            plain
                            type="info"
                            :custom-style="{ flex: 1 }"
                            @click="openModal('cancelBuyer')"
                        ></hy-button>
                    </template>
                </template>

                <!-- 待线下交易 -->
                <template v-else-if="order.status === 'PENDING_OFFLINE'">
                    <hy-button
                        text="站内沟通"
                        shape="circle"
                        plain
                        type="primary"
                        :custom-style="{ flex: 1 }"
                        @click="goChat"
                    ></hy-button>
                    <hy-button
                        v-if="!isBuyer"
                        text="我已当面交付"
                        shape="circle"
                        type="success"
                        :custom-style="{ flex: 1 }"
                        @click="doDelivered"
                    ></hy-button>
                    <hy-button
                        v-if="isBuyer"
                        text="确认已完成"
                        shape="circle"
                        type="primary"
                        :custom-style="{ flex: 1 }"
                        @click="openModal('buyerConfirm')"
                    ></hy-button>
                    <hy-button
                        text="取消订单"
                        shape="circle"
                        plain
                        type="info"
                        @click="
                            openModal(isBuyer ? 'cancelBuyer' : 'cancelSeller')
                        "
                    ></hy-button>
                </template>

                <!-- 待买家确认 -->
                <template v-else-if="order.status === 'PENDING_BUYER'">
                    <hy-button
                        v-if="isBuyer"
                        text="确认已完成"
                        shape="circle"
                        type="primary"
                        :custom-style="{ flex: 1 }"
                        @click="openModal('buyerConfirm')"
                    ></hy-button>
                    <template v-else>
                        <hy-button
                            text="提醒买家确认"
                            plain
                            type="primary"
                            shape="circle"
                            :custom-style="{ flex: 1 }"
                            @click="goChat"
                        ></hy-button>
                        <hy-button
                            text="取消订单"
                            plain
                            type="info"
                            shape="circle"
                            @click="openModal('cancelSeller')"
                        ></hy-button>
                    </template>
                </template>

                <!-- 申诉期 -->
                <template v-else-if="order.status === 'APPEALING'">
                    <hy-button
                        text="站内沟通"
                        shape="circle"
                        plain
                        type="primary"
                        :custom-style="{ flex: 1 }"
                        @click="goChat"
                    ></hy-button>
                    <hy-button
                        v-if="!isBuyer && !order.sellerObjection"
                        text="对本订单有异议"
                        shape="circle"
                        type="error"
                        :custom-style="{ flex: 1 }"
                        @click="openModal('objection')"
                    ></hy-button>
                </template>

                <!-- 已完成 -->
                <template v-else-if="order.status === 'COMPLETED'">
                    <hy-button
                        v-if="isBuyer && order.review"
                        text="再看一下商品"
                        plain
                        type="primary"
                        shape="circle"
                        :custom-style="{ flex: 1 }"
                        @click="goGoods"
                    ></hy-button>
                </template>
            </view>

            <!-- 确认弹窗 -->
            <hy-modal
                v-model="modalShow"
                :title="
                    modalType === 'objection'
                        ? '提交异议'
                        : modalType === 'confirm'
                          ? '确认交易'
                          : modalType === 'buyerConfirm'
                            ? '确认完成交易'
                            : '取消交易'
                "
                :content="
                    modalType === 'confirm'
                        ? '确认后将向买家展示您的联系方式（电话/QQ/微信/邮箱），请约定校内公共场所当面交易。'
                        : modalType === 'reject'
                          ? '拒绝后订单取消，商品继续在售。'
                          : modalType === 'objection'
                            ? '提交后订单将进入平台申诉处理，由平台客服介入核实，确认提交？'
                            : modalType === 'buyerConfirm'
                              ? '请确认已当面完成交易并验货无误。确认后订单进入 48 小时申诉期，期间如遇纠纷可发起投诉维权。'
                              : '双方未交易成功可取消订单，商品将恢复在售。确认取消？'
                "
                :confirm-text="
                    modalType === 'buyerConfirm' ? '确认完成' : '确定'
                "
                show-cancel-button
                @confirm="onModalConfirm"
            ></hy-modal>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.od {
    min-height: 100vh;
    padding-bottom: 200rpx;

    &__header {
        @include hy-gradient-header(135deg);
        padding: 40rpx 32rpx 56rpx;
        color: #fff;
    }

    &__status-row {
        display: flex;
        align-items: baseline;
        gap: 16rpx;
    }

    &__status {
        font-size: 40rpx;
        font-weight: 700;
    }

    &__status-sub {
        font-size: 26rpx;
        opacity: 0.9;
    }

    &__desc {
        display: block;
        margin-top: 12rpx;
        font-size: 25rpx;
        opacity: 0.92;
        line-height: 1.6;
    }

    &__countdown {
        display: block;
        margin-top: 8rpx;
        font-size: 24rpx;
        color: #ffe3b3;
    }

    &__cancel-reason {
        margin-top: 12rpx;
        font-size: 24rpx;
        opacity: 0.9;
    }

    &__steps {
        @include hy-card(20rpx);
        margin: -28rpx 24rpx 0;
        padding: 32rpx 12rpx;
        position: relative;
        animation: od-fade-up 0.45s ease 0.05s both;
    }

    &__goods {
        @include hy-card(20rpx);
        display: flex;
        align-items: center;
        gap: 20rpx;
        padding: 24rpx;
        margin: 20rpx 24rpx 0;
        transition: transform 0.15s ease;
        animation: od-fade-up 0.45s ease 0.1s both;
    }

    &__goods--hover {
        transform: scale(0.98);
    }

    &__goods-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 10rpx;
    }

    &__goods-title {
        font-size: 28rpx;
        font-weight: 500;
        color: var(--hy-text-color, #000000);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        overflow: hidden;
    }

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin: 20rpx 24rpx 0;
        animation: od-fade-up 0.45s ease 0.15s both;
    }

    &__fee-card {
        border: 1rpx solid var(--warning, #f9ae3d);
        background: var(--warning-light, rgba(249, 174, 61, 0.06));
    }

    &__card-title {
        font-size: 29rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 16rpx;
    }

    &__contact {
        display: flex;
        align-items: center;
        gap: 16rpx;
        padding: 16rpx 0;
        border-bottom: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));

        &:last-child {
            border-bottom: none;
        }
    }

    &__contact-icon {
        @include hy-icon-badge(56rpx, 16rpx);
    }

    &__contact-label {
        font-size: 26rpx;
        color: var(--hy-text-color--3, #929295);
        width: 80rpx;
    }

    &__contact-value {
        flex: 1;
        font-size: 27rpx;
        color: var(--hy-text-color, #000000);
    }

    &__contact-locked {
        display: flex;
        align-items: center;
        gap: 10rpx;
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
        background: var(--hy-background, #f8f8f8);
        border-radius: 12rpx;
        padding: 20rpx 24rpx;
        line-height: 1.5;
    }

    &__info-row {
        display: flex;
        justify-content: space-between;
        gap: 20rpx;
        padding: 10rpx 0;
    }

    &__info-label {
        font-size: 25rpx;
        color: var(--hy-text-color--3, #929295);
        flex-shrink: 0;
    }

    &__info-value {
        font-size: 25rpx;
        color: var(--hy-text-color--2, #46464a);
        text-align: right;
    }

    &__review-content {
        margin-top: 12rpx;
        font-size: 26rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
    }

    &__safety {
        margin: 20rpx 24rpx 0;
    }

    &__remind {
        display: flex;
        align-items: flex-start;
        gap: 12rpx;
        margin: 20rpx 24rpx 0;
        padding: 20rpx 24rpx;
        border-radius: 16rpx;
        font-size: 24rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;

        &--primary {
            background: var(--primary-light, rgba(61, 126, 255, 0.08));
        }

        &--warn {
            background: var(--warning-light, rgba(249, 174, 61, 0.1));
        }
    }

    &__rights {
        @include hy-card(20rpx);
        display: flex;
        align-items: center;
        gap: 20rpx;
        margin: 20rpx 24rpx 0;
        padding: 24rpx;
        transition: transform 0.15s ease;
    }

    &__rights--hover {
        transform: scale(0.98);
    }

    &__rights-icon {
        @include hy-icon-badge(64rpx, 18rpx);
        background: var(--hy-error--light, rgba(245, 108, 108, 0.1));
    }

    &__rights-info {
        flex: 1;
        min-width: 0;
    }

    &__rights-title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 4rpx;
    }

    &__rights-sub {
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__actions {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        gap: 20rpx;
        padding: 16rpx 24rpx;
        @include hy-safe-bottom(16rpx);
        background: var(--hy-background--container, #ffffff);
        box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
    }
}

@keyframes od-fade-up {
    from {
        opacity: 0;
        transform: translateY(24rpx);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
