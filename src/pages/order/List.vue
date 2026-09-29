<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getOrderListApi } from '@/api';
import { ensureLoginAndSchool } from '@/utils/guard';
import { fmtTime } from '@/utils/format';
import { ORDER_STATUS_TAG, ORDER_STATUS_TEXT, type OrderRow, type OrderStatus } from '@/types';
import { usePageShare } from '@/hooks/useShare';
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '我的订单'
    }
});

/** 我买到的 / 我卖出的 */
const role = ref<'buyer' | 'seller'>('buyer');
const statusIndex = ref(0);
const list = ref<OrderRow[]>([]);
const loading = ref(true);

const STATUS_TABS: Array<{ name: string; value: OrderStatus | 'ALL' }> = [
    { name: '全部', value: 'ALL' },
    { name: '待卖家确认', value: 'PENDING_SELLER' },
    { name: '待线下交易', value: 'PENDING_OFFLINE' },
    { name: '待买家确认', value: 'PENDING_BUYER' },
    { name: '申诉期', value: 'APPEALING' },
    { name: '已完成', value: 'COMPLETED' },
    { name: '已取消', value: 'CANCELLED' }
];

const loadList = async () => {
    loading.value = true;
    list.value = await getOrderListApi({ role: role.value, status: STATUS_TABS[statusIndex.value].value });
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
const peerName = (row: OrderRow) => (role.value === 'buyer' ? row.seller.nickname : row.buyer.nickname);

/** 列表卡片的状态提示（超时/申诉倒计时规则） */
const statusHint = (row: OrderRow): string => {
    if (row.order.status === 'PENDING_SELLER') {
        return role.value === 'seller' ? '24 小时内未处理将自动过期，不收手续费' : '等待卖家确认，超时订单将自动过期';
    }
    if (row.order.status === 'APPEALING') {
        return row.order.sellerObjection ? '卖家已提出异议，平台申诉处理中' : '48 小时申诉期内卖家无异议则自动完成';
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
            <!-- 角色切换 -->
            <view class="orders__role">
                <hy-subsection :list="['我买到的', '我卖出的']" :current="role === 'buyer' ? 0 : 1" mode="button" @change="onRoleChange"></hy-subsection>
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

            <!-- 订单列表 -->
            <view v-if="loading" class="orders__loading">
                <hy-skeleton theme="paragraph" :row-col="[1, 1, 1]" animation="gradient"></hy-skeleton>
            </view>
            <view v-else-if="list.length" class="orders__list">
                <view v-for="row in list" :key="row.order.id" class="orders__card" @tap="goDetail(row)">
                    <view class="orders__head">
                        <text class="orders__no">订单号 {{ row.order.id }}</text>
                        <hy-tag
                            :label="ORDER_STATUS_TEXT[row.order.status]"
                            :type="ORDER_STATUS_TAG[row.order.status].type"
                            :plain="ORDER_STATUS_TAG[row.order.status].plain"
                            size="small"
                        />
                    </view>
                    <view class="orders__body">
                        <hy-image :src="row.goods.images[0]" width="140rpx" height="140rpx" radius="10rpx" />
                        <view class="orders__info">
                            <view class="orders__goods-title">{{ row.goods.title }}</view>
                            <view class="orders__peer">{{ role === 'buyer' ? '卖家' : '买家' }}：{{ peerName(row) }}</view>
                            <hy-price :text="String(row.order.price)" :size="17" />
                        </view>
                    </view>
                    <view v-if="statusHint(row)" class="orders__hint">
                        <hy-icon
                            :name="row.order.status === 'APPEALING' && row.order.sellerObjection ? 'warning-fill' : 'time'"
                            :color="row.order.status === 'CANCELLED' ? 'var(--hy-info-color)' : 'var(--hy-warning-color)'"
                            :size="13"
                        />
                        <text>{{ statusHint(row) }}</text>
                    </view>
                    <view class="orders__foot">
                        <text class="orders__time">申请于 {{ fmtTime(row.order.applyTime) }}</text>
                        <text class="orders__link">查看详情 ›</text>
                    </view>
                </view>
            </view>
            <hy-empty v-else mode="order" description="暂无相关订单"></hy-empty>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.orders {
    min-height: 100vh;
    padding-bottom: 40rpx;

    &__role {
        padding: 24rpx 24rpx 12rpx;
    }

    &__loading {
        padding: 24rpx;
    }

    &__list {
        padding: 24rpx;
    }

    &__card {
        background: var(--hy-bg-color, #fff);
        border-radius: 16rpx;
        padding: 24rpx;
        margin-bottom: 20rpx;
    }

    &__head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16rpx;
        border-bottom: 1rpx solid var(--hy-border-color, #f0f0f0);
    }

    &__no {
        font-size: 24rpx;
        color: var(--hy-info-color, #909193);
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
        color: var(--hy-main-color, #303133);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 1;
        overflow: hidden;
    }

    &__peer {
        font-size: 24rpx;
        color: var(--hy-info-color, #909193);
    }

    &__hint {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--hy-warning-color, #f9ae3d);
        background: var(--hy-warning-light, rgba(249, 174, 61, 0.08));
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
        color: var(--hy-info-color, #909193);
    }

    &__link {
        font-size: 24rpx;
        color: var(--hy-primary-color, #3d7eff);
    }
}
</style>
