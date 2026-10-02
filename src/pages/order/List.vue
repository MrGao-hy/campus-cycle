<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getOrderListApi } from '@/api';
import { ensureLoginAndSchool } from '@/utils/guard';
import { fmtTime } from '@/utils/format';
import {
    ORDER_STATUS_TAG,
    ORDER_STATUS_TEXT,
    type OrderRow,
    type OrderStatus,
} from '@/types';
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { useUserStore } from '@/store';

definePage({
    style: {
        navigationBarTitleText: '我的订单',
    },
});

const userStore = useUserStore();

/** 未登录/未选校引导：守卫只判断不跳转，由页面引导主动操作（避免返回死循环） */
const goGuard = () => {
    if (!userStore.hasLogin) {
        uni.navigateTo({ url: '/pages/login/Index' });
        return;
    }
    uni.navigateTo({ url: '/pages/school/Index' });
};

/** 我买到的 / 我卖出的 */
const role = ref<'buyer' | 'seller'>('buyer');
const statusIndex = ref(0);
const list = ref<OrderRow[]>([]);
// 初始 false：未登录/未选校时 onShow 直接 return，若初始 true 骨架屏永远转
const loading = ref(false);

const STATUS_TABS: Array<{ name: string; value: OrderStatus | 'ALL' }> = [
    { name: '全部', value: 'ALL' },
    { name: '待卖家确认', value: 'PENDING_SELLER' },
    { name: '待线下交易', value: 'PENDING_OFFLINE' },
    { name: '待买家确认', value: 'PENDING_BUYER' },
    { name: '申诉期', value: 'APPEALING' },
    { name: '已完成', value: 'COMPLETED' },
    { name: '已取消', value: 'CANCELLED' },
];

const loadList = async () => {
    loading.value = true;
    list.value = await getOrderListApi({
        role: role.value,
        status: STATUS_TABS[statusIndex.value].value,
    });
    loading.value = false;
};

onShow(() => {
    if (!ensureLoginAndSchool()) return;
    loadList();
});

const onRoleChange = (index: number) => {
    role.value = index === 0 ? 'buyer' : 'seller';
    loadList();
};

const onTabChange = (item: { name: string }, index: number) => {
    statusIndex.value = index;
    loadList();
};

const goDetail = (row: OrderRow) => {
    uni.navigateTo({ url: `/pages/order/Detail?id=${row.order.id}` });
};

/** 对端昵称 */
const peerName = (row: OrderRow) =>
    role.value === 'buyer' ? row.seller.nickname : row.buyer.nickname;

/** 列表卡片的状态提示（超时/申诉倒计时规则） */
const statusHint = (row: OrderRow): string => {
    if (row.order.status === 'PENDING_SELLER') {
        return role.value === 'seller'
            ? '24 小时内未处理将自动过期，不收手续费'
            : '等待卖家确认，超时订单将自动过期';
    }
    if (row.order.status === 'APPEALING') {
        return row.order.sellerObjection
            ? '卖家已提出异议，平台申诉处理中'
            : '48 小时申诉期内卖家无异议则自动完成';
    }
    if (row.order.status === 'CANCELLED' && row.order.cancelReason) {
        return row.order.cancelReason;
    }
    return '';
};
</script>

<template>
    <the-root-pages>
        <view class="orders">
            <!-- 未登录/未选校：引导态（守卫不强制跳转，避免返回死循环） -->
            <view
                v-if="!userStore.hasLogin || !userStore.hasSchool"
                class="orders__guard"
            >
                <view class="orders__guard-logo">
                    <hy-icon
                        :name="
                            userStore.hasLogin
                                ? '/static/icons/check.png'
                                : '/static/icons/lock.png'
                        "
                        color="#fff"
                        :size="24"
                    />
                </view>
                <text class="orders__guard-title">{{
                    userStore.hasLogin ? '先选择你的学校' : '登录后查看订单'
                }}</text>
                <text class="orders__guard-desc">{{
                    userStore.hasLogin
                        ? '选择学校后可查看本校订单'
                        : '登录后可管理你买到的和卖出的订单'
                }}</text>
                <view
                    class="orders__guard-btn"
                    hover-class="orders__guard-btn--hover"
                    :hover-stay-time="120"
                    @tap="goGuard"
                    >{{ userStore.hasLogin ? '去选择' : '去登录' }}</view
                >
            </view>
            <template v-else>
            <!-- 角色切换 + 状态筛选（吸顶，滚动时保持可见） -->
            <view class="orders__filter">
                <view class="orders__role">
                    <hy-subsection
                        :list="['我买到的', '我卖出的']"
                        :current="role === 'buyer' ? 0 : 1"
                        mode="button"
                        @change="onRoleChange"
                    ></hy-subsection>
                </view>

                <!-- 状态筛选 -->
                <hy-tabs
                    :list="STATUS_TABS"
                    :current="statusIndex"
                    key-name="name"
                    :scrollable="true"
                    :is-swiper="false"
                    @change="onTabChange"
                ></hy-tabs>
            </view>

            <!-- 订单列表 -->
            <view v-if="loading" class="orders__loading">
                <hy-skeleton
                    theme="paragraph"
                    :row-col="[1, 1, 1]"
                    animation="gradient"
                ></hy-skeleton>
            </view>
            <view v-else-if="list.length" class="orders__list">
                <view
                    v-for="row in list"
                    :key="row.order.id"
                    class="orders__card"
                    hover-class="orders__card--hover"
                    :hover-stay-time="120"
                    @tap="goDetail(row)"
                >
                    <view class="orders__head">
                        <text class="orders__no"
                            >订单号 {{ row.order.id }}</text
                        >
                        <hy-tag
                            :label="ORDER_STATUS_TEXT[row.order.status]"
                            :type="ORDER_STATUS_TAG[row.order.status].type"
                            :plain="ORDER_STATUS_TAG[row.order.status].plain"
                            size="small"
                        />
                    </view>
                    <view class="orders__body">
                        <hy-image
                            :src="row.goods.images[0]"
                            width="140rpx"
                            height="140rpx"
                            radius="10rpx"
                        />
                        <view class="orders__info">
                            <view class="orders__goods-title">{{
                                row.goods.title
                            }}</view>
                            <view class="orders__peer"
                                >{{ role === 'buyer' ? '卖家' : '买家' }}：{{
                                    peerName(row)
                                }}</view
                            >
                            <hy-price
                                :text="String(row.order.price)"
                                :size="17"
                            />
                        </view>
                    </view>
                    <view v-if="statusHint(row)" class="orders__hint">
                        <hy-icon
                            :name="
                                row.order.status === 'APPEALING' &&
                                row.order.sellerObjection
                                    ? 'warning-fill'
                                    : 'time'
                            "
                            :color="
                                row.order.status === 'CANCELLED'
                                    ? 'var(--hy-text-color--3, #929295)'
                                    : 'var(--warning, #f9ae3d)'
                            "
                            :size="13"
                        />
                        <text>{{ statusHint(row) }}</text>
                    </view>
                    <view class="orders__foot">
                        <text class="orders__time"
                            >申请于 {{ fmtTime(row.order.applyTime) }}</text
                        >
                        <text class="orders__link">查看详情 ›</text>
                    </view>
                </view>
            </view>
            <hy-empty v-else mode="order" description="暂无相关订单"></hy-empty>
            </template>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.orders {
    min-height: 100vh;
    padding-bottom: 40rpx;

    &__filter {
        position: sticky;
        top: 0;
        z-index: 50;
        background: var(--hy-background-color, #f5f6f8);
        padding-bottom: 4rpx;
    }

    &__role {
        padding: 24rpx 24rpx 12rpx;
    }

    &__loading {
        padding: 24rpx;
        animation: orders-fade-up 0.45s ease 0.06s both;
    }

    &__list {
        padding: 24rpx;
        animation: orders-fade-up 0.45s ease 0.06s both;
    }

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin-bottom: 20rpx;
        transition: transform 0.15s ease;
    }

    /* 未登录/未选校引导态 */
    &__guard {
        margin: 100rpx 48rpx 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        &-logo {
            width: 96rpx;
            height: 96rpx;
            border-radius: 28rpx;
            background: linear-gradient(135deg, #3d7eff, #6fa8ff);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 12rpx 32rpx rgba(61, 126, 255, 0.3);
        }

        &-title {
            margin-top: 32rpx;
            font-size: 34rpx;
            font-weight: 600;
            color: #1f2329;
        }

        &-desc {
            margin-top: 12rpx;
            font-size: 26rpx;
            color: #8a9099;
            line-height: 1.6;
        }

        &-btn {
            margin-top: 40rpx;
            padding: 0 56rpx;
            height: 80rpx;
            border-radius: 40rpx;
            background: var(--primary, #3d7eff);
            color: #ffffff;
            font-size: 30rpx;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10rpx 24rpx rgba(61, 126, 255, 0.28);

            &--hover {
                opacity: 0.85;
            }
        }
    }

    &__card--hover {
        transform: scale(0.98);
    }

    &__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16rpx;
        border-bottom: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));
    }

    &__no {
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__body {
        display: flex;
        gap: 20rpx;
        padding: 20rpx 0;
    }

    &__info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
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

    &__peer {
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__hint {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--warning, #f9ae3d);
        background: var(--warning-light, rgba(249, 174, 61, 0.1));
        border-radius: 8rpx;
        padding: 10rpx 16rpx;
    }

    &__foot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16rpx;
    }

    &__time {
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__link {
        font-size: 24rpx;
        color: var(--primary, #3d7eff);
    }
}

@keyframes orders-fade-up {
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
