<script setup lang="ts">
/**
 * 页面守卫引导态
 *
 * 用于「未登录 / 未选校 / 无权限」等需要引导用户执行某个前置动作的空态场景。
 * 组件只负责展示与点击事件上抛（emit），跳转等业务逻辑由调用方实现，
 * 从而保证同一组件可在多个页面复用且行为各自独立。
 */
interface IProps {
    /** 徽章主图标路径，如 /static/icons/lock.png */
    icon: string;
    /** 主标题 */
    title: string;
    /** 辅助描述 */
    desc: string;
    /** 按钮文案 */
    buttonText: string;
    /** 权益点列表（可选）：逐条带对勾展示，填充版面降低空态感 */
    tips?: string[];
}

withDefaults(defineProps<IProps>(), { tips: () => [] });
const emit = defineEmits<{
    (e: 'action'): void;
}>();
</script>

<template>
    <view class="page-guard">
        <!-- 背景光斑：柔和的品牌色氛围（径向渐变过渡到透明，性能优于 blur） -->
        <view class="page-guard__glow page-guard__glow--1"></view>
        <view class="page-guard__glow page-guard__glow--2"></view>

        <view class="page-guard__card">
            <!-- 插画：中央渐变徽章 + 两侧漂浮功能小卡 -->
            <view class="page-guard__art">
                <view class="page-guard__chip page-guard__chip--left">
                    <hy-icon name="/static/icons/camera.png" :size="22" />
                </view>
                <view class="page-guard__badge">
                    <hy-icon :name="icon" color="#ffffff" :size="44" />
                </view>
                <view class="page-guard__chip page-guard__chip--right">
                    <hy-icon name="/static/icons/sell.png" :size="22" />
                </view>
            </view>

            <text class="page-guard__title">{{ title }}</text>
            <text class="page-guard__desc">{{ desc }}</text>

            <!-- 权益点：弱底色分组块，左对齐更易扫读 -->
            <view v-if="tips.length" class="page-guard__tips">
                <view v-for="(tip, i) in tips" :key="i" class="page-guard__tip">
                    <view class="page-guard__tip-check">
                        <hy-icon
                            name="/static/icons/check.png"
                            color="#ffffff"
                            :size="10"
                        />
                    </view>
                    <text class="page-guard__tip-text">{{ tip }}</text>
                </view>
            </view>

            <!-- CTA：全宽渐变胶囊 + 右箭头，hover 仅改透明度避免布局位移 -->
            <view
                class="page-guard__btn"
                hover-class="page-guard__btn--hover"
                :hover-stay-time="120"
                @tap="emit('action')"
            >
                <text>{{ buttonText }}</text>
                <hy-icon
                    name="/static/icons/right.png"
                    color="#ffffff"
                    :size="16"
                />
            </view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.page-guard {
    position: relative;
    margin: 56rpx 40rpx 0;

    /* 品牌色光斑氛围 */
    &__glow {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;

        &--1 {
            width: 420rpx;
            height: 420rpx;
            top: -60rpx;
            left: -80rpx;
            background: radial-gradient(
                closest-side,
                rgba(61, 126, 255, 0.14),
                rgba(61, 126, 255, 0)
            );
        }

        &--2 {
            width: 360rpx;
            height: 360rpx;
            top: 120rpx;
            right: -100rpx;
            background: radial-gradient(
                closest-side,
                rgba(111, 168, 255, 0.16),
                rgba(111, 168, 255, 0)
            );
        }
    }

    &__card {
        position: relative;
        background: var(--hy-background--container, #ffffff);
        border-radius: 36rpx;
        box-shadow: 0 12rpx 40rpx rgba(30, 60, 120, 0.08);
        padding: 56rpx 40rpx 48rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: page-guard-fade-up 0.5s ease both;
    }

    /* 插画区：徽章 + 漂浮小卡 */
    &__art {
        position: relative;
        width: 100%;
        height: 200rpx;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__badge {
        width: 132rpx;
        height: 132rpx;
        border-radius: 40rpx;
        background: linear-gradient(135deg, var(--primary, #3d7eff), #6fa8ff);
        display: flex;
        align-items: center;
        justify-content: center;
        /* 外圈柔光环 + 底部投影，层次感 */
        box-shadow:
            0 0 0 18rpx rgba(61, 126, 255, 0.08),
            0 18rpx 36rpx rgba(61, 126, 255, 0.32);
    }

    &__chip {
        position: absolute;
        top: 50%;
        width: 76rpx;
        height: 76rpx;
        margin-top: -38rpx;
        border-radius: 22rpx;
        background: var(--hy-background--container, #ffffff);
        box-shadow: 0 10rpx 24rpx rgba(30, 60, 120, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: page-guard-float 3s ease-in-out infinite alternate;

        &--left {
            left: 56rpx;
        }

        &--right {
            right: 56rpx;
            animation-delay: 1.5s;
        }
    }

    &__title {
        margin-top: 36rpx;
        font-size: 38rpx;
        font-weight: 700;
        color: var(--hy-text-color, #000000);
        letter-spacing: 1rpx;
    }

    &__desc {
        margin-top: 14rpx;
        font-size: 26rpx;
        color: var(--hy-text-color--3, #929295);
        line-height: 1.7;
        text-align: center;
        padding: 0 16rpx;
    }

    /* 权益点 */
    &__tips {
        align-self: stretch;
        margin-top: 32rpx;
        background: var(--primary-light, rgba(61, 126, 255, 0.06));
        border-radius: 20rpx;
        padding: 24rpx 28rpx;
        display: flex;
        flex-direction: column;
        gap: 18rpx;
    }

    &__tip {
        display: flex;
        align-items: center;
        gap: 16rpx;
    }

    &__tip-check {
        width: 30rpx;
        height: 30rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary, #3d7eff), #6fa8ff);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    &__tip-text {
        font-size: 24rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.5;
    }

    /* CTA 按钮 */
    &__btn {
        align-self: stretch;
        margin-top: 40rpx;
        height: 88rpx;
        border-radius: 44rpx;
        background: linear-gradient(135deg, var(--primary, #3d7eff), #6fa8ff);
        color: #ffffff;
        font-size: 30rpx;
        font-weight: 600;
        letter-spacing: 2rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        box-shadow: 0 12rpx 28rpx rgba(61, 126, 255, 0.3);
        transition: opacity 0.2s ease;

        &--hover {
            opacity: 0.88;
        }
    }
}

@keyframes page-guard-fade-up {
    from {
        opacity: 0;
        transform: translateY(28rpx);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes page-guard-float {
    from {
        transform: translateY(-8rpx);
    }

    to {
        transform: translateY(8rpx);
    }
}
</style>
