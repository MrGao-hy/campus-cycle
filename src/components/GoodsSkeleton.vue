<script setup lang="ts">
/**
 * 商品卡骨架屏
 *
 * 与 GoodsCard 同尺寸同间距的两列卡片占位（图块 + 标题行 + 价格行），
 * 蓝主题淡色 shimmer 呼吸动画，加载完成切换无跳动。
 * 注：弃用 hy-skeleton——段落式形态与商品列表不符，且第三方骨架组件在 MP 端渲染不可控。
 */
interface IProps {
    /** 占位卡片数量 */
    count?: number;
}

withDefaults(defineProps<IProps>(), { count: 4 });
</script>

<template>
    <view class="goods-skeleton">
        <view v-for="i in count" :key="i" class="goods-skeleton__card">
            <view class="goods-skeleton__img"></view>
            <view class="goods-skeleton__title"></view>
            <view class="goods-skeleton__price"></view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.goods-skeleton {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 24rpx 24rpx 0;

    /* 尺寸与 GoodsCard 对齐：calc(50% - 10rpx) 宽、16rpx 圆角、20rpx 内边距 */
    &__card {
        width: calc(50% - 10rpx);
        margin-bottom: 20rpx;
        background: var(--hy-background--container, #ffffff);
        border-radius: 16rpx;
        padding: 20rpx;
        box-sizing: border-box;
    }

    &__img {
        width: 100%;
        height: 340rpx;
        border-radius: 12rpx;
        background: linear-gradient(
            90deg,
            #f0f2f6 25%,
            #e6e9f2 37%,
            #f0f2f6 63%
        );
        background-size: 400% 100%;
        animation: goods-skeleton-shimmer 1.4s ease infinite;
    }

    &__title {
        margin-top: 16rpx;
        height: 28rpx;
        width: 76%;
        border-radius: 8rpx;
        background: linear-gradient(
            90deg,
            #f0f2f6 25%,
            #e6e9f2 37%,
            #f0f2f6 63%
        );
        background-size: 400% 100%;
        animation: goods-skeleton-shimmer 1.4s ease infinite;
    }

    &__price {
        margin-top: 14rpx;
        height: 30rpx;
        width: 42%;
        border-radius: 8rpx;
        background: linear-gradient(
            90deg,
            #f0f2f6 25%,
            #e6e9f2 37%,
            #f0f2f6 63%
        );
        background-size: 400% 100%;
        animation: goods-skeleton-shimmer 1.4s ease infinite 0.15s;
    }
}

@keyframes goods-skeleton-shimmer {
    0% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0 50%;
    }
}
</style>
