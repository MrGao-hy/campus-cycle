<script setup lang="ts">
import type { Goods } from '@/types';

interface IProps {
    goods: Goods;
}

defineProps<IProps>();
defineEmits<{ click: [] }>();

defineOptions({
    options: {
        // 微信小程序端虚拟化组件宿主节点：
        // 否则 flex 列表中的宽度百分比参照宿主节点（宽度 auto），导致两列卡片宽度不一致
        virtualHost: true,
        styleIsolation: 'shared',
    },
});
</script>

<template>
    <view
        class="goods-card"
        :class="{ 'goods-card--sold': goods.status === 'SOLD' }"
        @tap="$emit('click')"
    >
        <view class="goods-card__cover">
            <hy-image
                :src="goods.images[0]"
                width="100%"
                height="320rpx"
                radius="12rpx 12rpx 0 0"
            />
            <view v-if="goods.status !== 'ON_SALE'" class="goods-card__mask">
                <hy-tag
                    :label="goods.status === 'SOLD' ? '已售出' : '交易中'"
                    type="info"
                    bg-color="rgba(0,0,0,0.35)"
                />
            </view>
        </view>
        <view class="goods-card__body">
            <view class="goods-card__title">{{ goods.title }}</view>
            <view class="goods-card__meta">
                <hy-tag
                    :label="goods.condition"
                    type="primary"
                    plain
                    size="mini"
                />
                <text class="goods-card__want"
                    >{{ goods.wantCount }}人想要</text
                >
            </view>
            <view class="goods-card__price-row">
                <hy-price :text="String(goods.price)" :size="18" />
                <text v-if="goods.originalPrice" class="goods-card__origin"
                    >￥{{ goods.originalPrice }}</text
                >
            </view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.goods-card {
    width: calc(50% - 12rpx);
    box-sizing: border-box;
    background: var(--hy-background--container, #ffffff);
    border-radius: 12rpx;
    overflow: hidden;
    margin-bottom: 24rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);

    &--sold {
        opacity: 0.55;
    }

    &__cover {
        position: relative;
    }

    &__mask {
        position: absolute;
        top: 12rpx;
        right: 12rpx;
    }

    &__body {
        padding: 16rpx 20rpx 20rpx;
    }

    &__title {
        font-size: 28rpx;
        color: var(--hy-text-color, #000000);
        line-height: 1.4;
        height: 78rpx;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
    }

    &__meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 12rpx;
    }

    &__want {
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__price-row {
        display: flex;
        align-items: baseline;
        gap: 10rpx;
        margin-top: 8rpx;
    }

    &__origin {
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
        text-decoration: line-through;
    }
}
</style>