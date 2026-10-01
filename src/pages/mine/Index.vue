<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getFeeSummaryApi } from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { usePageShare } from '@/hooks/useShare';
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '我的'
    }
});

const toast = useToast();
const userStore = useUserStore();

// 全局分享（hy-app useShare 封装）
const { onShareAppMessage, onShareTimeline } = usePageShare();
defineExpose({ onShareAppMessage, onShareTimeline });

const unpaidAmount = ref(0);
const unpaidCount = ref(0);

onShow(() => {
    if (!userStore.hasLogin) {
        uni.reLaunch({ url: '/pages/login/Index' });
        return;
    }
    if (!userStore.hasSchool) {
        uni.navigateTo({ url: '/pages/school/Index' });
        return;
    }
    loadFee();
});

const loadFee = async () => {
    const summary = await getFeeSummaryApi();
    unpaidAmount.value = summary.unpaidAmount;
    unpaidCount.value = summary.unpaidCount;
};

const goOrders = () => uni.navigateTo({ url: '/pages/order/List' });
const goMyGoods = () => uni.navigateTo({ url: '/pages/goods/Mine' });
const goPublish = () => uni.navigateTo({ url: '/pages/goods/Publish' });
const goFee = () => uni.navigateTo({ url: '/pages/fee/Index' });
const goSecurity = () => uni.navigateTo({ url: '/pages/security/Index' });
const goSchool = () => uni.navigateTo({ url: '/pages/school/Index' });
/** 编辑资料（头像/昵称） */
const goProfile = () => uni.navigateTo({ url: '/pages/profile/Index' });

const logout = () => {
    uni.showModal({
        title: '退出登录',
        content: '确定退出当前账号吗？',
        success: res => {
            if (res.confirm) {
                userStore.logout();
                uni.removeTabBarBadge({ index: 1, fail: () => {} });
                uni.reLaunch({ url: '/pages/login/Index' });
            }
        }
    });
};
</script>

<template>
    <the-root-pages>
        <view class="mine">
            <!-- 用户信息 -->
            <view class="mine__user" @tap="goProfile">
                <hy-avatar :text="userStore.userInfo?.nickname.slice(0, 1) || '同'" random-bg-color :name="userStore.userInfo?.nickname" :size="56" />
                <view class="mine__user-info">
                    <view class="mine__nickname">
                        {{ userStore.userInfo?.nickname || '未登录' }}
                        <hy-tag label="已认证" type="success" size="mini" />
                    </view>
                    <view class="mine__sub" @tap="goSchool">
                        <hy-icon name="map" color="var(--hy-info-color)" :size="13" />
                        <text>{{ userStore.school?.name || '选择学校' }}（点击切换）</text>
                    </view>
                    <view class="mine__stats">
                        <text>信用分 {{ userStore.userInfo?.creditScore ?? '-' }}</text>
                        <text class="mine__stats-divider">|</text>
                        <text>成功交易 {{ userStore.userInfo?.successCount ?? 0 }} 单</text>
                    </view>
                </view>
            </view>

            <!-- 欠费提示 -->
            <view v-if="unpaidAmount > 0" class="mine__fee-warn" @tap="goFee">
                <hy-icon name="warning-fill" color="var(--hy-error-color)" :size="16" />
                <text class="mine__fee-text">有 {{ unpaidAmount }} 元手续费未结清（{{ unpaidCount }} 笔），结清前无法发布新商品</text>
                <text class="mine__fee-link">去处理 ›</text>
            </view>

            <!-- 交易入口 -->
            <hy-cell :border="false" custom-class="mine__group">
                <hy-cell-item title="我买到的" sub="购买申请与订单进度" clickable is-right-icon @click="goOrders">
                    <template #icon>
                        <hy-icon name="shopping-cart" color="var(--hy-primary-color)" :size="20"></hy-icon>
                    </template>
                </hy-cell-item>
                <hy-cell-item title="我卖出的" sub="待确认申请与手续费账单" clickable is-right-icon @click="goOrders">
                    <template #icon>
                        <hy-icon name="shop" color="var(--hy-warning-color)" :size="20"></hy-icon>
                    </template>
                </hy-cell-item>
                <hy-cell-item title="我发布的" sub="在售 / 交易中 / 已售出（置灰）" clickable is-right-icon @click="goMyGoods">
                    <template #icon>
                        <hy-icon name="picture" color="var(--hy-success-color)" :size="20"></hy-icon>
                    </template>
                </hy-cell-item>
                <hy-cell-item title="发布商品" sub="第一笔成功交易免手续费" clickable is-right-icon @click="goPublish">
                    <template #icon>
                        <hy-icon name="plus" color="var(--hy-primary-color)" :size="20"></hy-icon>
                    </template>
                </hy-cell-item>
            </hy-cell>

            <!-- 服务入口 -->
            <hy-cell :border="false" custom-class="mine__group">
                <hy-cell-item title="手续费账单" clickable is-right-icon @click="goFee">
                    <template #icon>
                        <hy-icon name="order" color="var(--hy-error-color)" :size="20"></hy-icon>
                    </template>
                    <template #value>
                        <text v-if="unpaidAmount > 0" class="mine__fee-amount">待缴 ￥{{ unpaidAmount }}</text>
                    </template>
                </hy-cell-item>
                <hy-cell-item title="安全中心" sub="交易守则 · 举报 · 紧急求助" clickable is-right-icon @click="goSecurity">
                    <template #icon>
                        <hy-icon name="security" color="var(--hy-success-color)" :size="20"></hy-icon>
                    </template>
                </hy-cell-item>
            </hy-cell>

            <view class="mine__logout">
                <hy-button text="退出登录" plain type="info" shape="circle" :custom-style="{ height: '88rpx' }" @click="logout"></hy-button>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.mine {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;

    &__user {
        display: flex;
        align-items: center;
        gap: 24rpx;
        background: linear-gradient(135deg, var(--hy-primary-color, #3d7eff), #6ba1ff);
        border-radius: 20rpx;
        padding: 36rpx 32rpx;
    }

    &__user-info {
        flex: 1;
    }

    &__nickname {
        display: flex;
        align-items: center;
        gap: 12rpx;
        font-size: 34rpx;
        font-weight: 700;
        color: #fff;
    }

    &__sub {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-top: 10rpx;
        font-size: 23rpx;
        color: rgba(255, 255, 255, 0.85);
    }

    &__stats {
        display: flex;
        align-items: center;
        gap: 16rpx;
        margin-top: 12rpx;
        font-size: 23rpx;
        color: rgba(255, 255, 255, 0.85);
    }

    &__stats-divider {
        opacity: 0.5;
    }

    &__fee-warn {
        display: flex;
        align-items: center;
        gap: 10rpx;
        background: var(--hy-error-light, rgba(245, 108, 108, 0.08));
        border: 1rpx solid var(--hy-error-color, #f56c6c);
        border-radius: 12rpx;
        padding: 18rpx 20rpx;
        margin-top: 20rpx;
    }

    &__fee-text {
        flex: 1;
        font-size: 23rpx;
        color: var(--hy-error-color, #f56c6c);
        line-height: 1.5;
    }

    &__fee-link {
        font-size: 23rpx;
        color: var(--hy-error-color, #f56c6c);
        flex-shrink: 0;
    }

    &__group {
        border-radius: 16rpx;
        overflow: hidden;
        margin-top: 24rpx;
    }

    &__fee-amount {
        font-size: 24rpx;
        color: var(--hy-error-color, #f56c6c);
        font-weight: 600;
    }

    &__logout {
        margin-top: 48rpx;
    }
}
</style>
