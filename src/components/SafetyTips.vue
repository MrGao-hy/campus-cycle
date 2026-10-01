<script setup lang="ts">
import { SAFETY_REMINDERS } from '@/types';

interface IProps {
    /** 紧凑模式：只展示前 3 条 */
    compact?: boolean;
}

withDefaults(defineProps<IProps>(), { compact: false });
</script>

<template>
    <view class="safety-tips">
        <view class="safety-tips__head">
            <hy-icon
                name="warning-fill"
                color="var(--warning, #f9ae3d)"
                :size="18"
            />
            <text class="safety-tips__title">交易安全提醒</text>
        </view>
        <view class="safety-tips__list">
            <view
                v-for="(item, i) in compact
                    ? SAFETY_REMINDERS.slice(0, 3)
                    : SAFETY_REMINDERS"
                :key="i"
                class="safety-tips__item"
            >
                <text class="safety-tips__dot">•</text>
                <text class="safety-tips__text">{{ item }}</text>
            </view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.safety-tips {
    background: var(--warning-light, rgba(249, 174, 61, 0.1));
    border: 1rpx solid var(--warning, #f9ae3d);
    border-radius: 12rpx;
    padding: 20rpx 24rpx;

    &__head {
        display: flex;
        align-items: center;
        gap: 8rpx;
    }

    &__title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--warning, #f9ae3d);
    }

    &__list {
        margin-top: 12rpx;
    }

    &__item {
        display: flex;
        gap: 10rpx;
        margin-bottom: 8rpx;

        &:last-child {
            margin-bottom: 0;
        }
    }

    &__dot {
        color: var(--warning, #f9ae3d);
        font-size: 24rpx;
        line-height: 1.6;
    }

    &__text {
        font-size: 24rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
        flex: 1;
    }
}
</style>
