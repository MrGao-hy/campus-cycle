<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import SafetyTips from '@/components/SafetyTips.vue';
import { getConversationListApi } from '@/api';
import { useUserStore } from '@/store';
import { ensureLoginAndSchool } from '@/utils/guard';
import { fmtTime } from '@/utils/format';
import type { ConversationRow } from '@/types';
import { onShow } from '@dcloudio/uni-app';
import { usePageShare } from '@/hooks/useShare';
import { ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '消息'
    }
});

const userStore = useUserStore();

// 全局分享（hy-app useShare 封装）
const { onShareAppMessage, onShareTimeline } = usePageShare();
defineExpose({ onShareAppMessage, onShareTimeline });

const list = ref<ConversationRow[]>([]);
const loading = ref(true);

const loadList = async () => {
    loading.value = true;
    list.value = await getConversationListApi();
    loading.value = false;
};

onShow(() => {
    if (!ensureLoginAndSchool()) return;
    loadList();
});

const goChat = (row: ConversationRow) => {
    uni.navigateTo({ url: `/pages/chat/Detail?id=${row.conversation.id}` });
};

const goOrders = () => {
    uni.navigateTo({ url: '/pages/order/List' });
};

const goSecurity = () => {
    uni.navigateTo({ url: '/pages/security/Index' });
};
</script>

<template>
    <the-root-pages>
        <view class="msg">
            <!-- 安全提醒（消息页强制展示） -->
            <view class="msg__safety">
                <safety-tips :compact="true"></safety-tips>
            </view>

            <!-- 功能入口 -->
            <hy-cell :border="false" custom-class="msg__entries">
                <hy-cell-item title="订单通知" sub="卖家确认、申诉期提醒都会在这里通知" clickable is-right-icon @click="goOrders">
                    <template #icon>
                        <hy-icon name="order" color="var(--hy-primary-color)" :size="22"></hy-icon>
                    </template>
                </hy-cell-item>
                <hy-cell-item title="安全中心" sub="交易安全守则、举报与紧急求助" clickable is-right-icon @click="goSecurity">
                    <template #icon>
                        <hy-icon name="security" color="var(--hy-success-color)" :size="22"></hy-icon>
                    </template>
                </hy-cell-item>
            </hy-cell>

            <!-- 会话列表 -->
            <view class="msg__title">站内会话</view>
            <view v-if="loading" class="msg__loading">
                <hy-skeleton theme="avatar" :row-col="[1, 1, 1]" animation="gradient"></hy-skeleton>
            </view>
            <template v-else-if="list.length">
                <view v-for="row in list" :key="row.conversation.id" class="msg__item" @tap="goChat(row)">
                    <view class="msg__avatar">
                        <hy-avatar :text="row.peer.nickname.slice(0, 1)" random-bg-color :name="row.peer.nickname" :size="40"></hy-avatar>
                        <view v-if="row.unread" class="msg__badge">{{ row.unread > 99 ? '99+' : row.unread }}</view>
                    </view>
                    <view class="msg__body">
                        <view class="msg__row">
                            <text class="msg__name">{{ row.peer.nickname }}</text>
                            <text class="msg__time">{{ fmtTime(row.conversation.lastTime) }}</text>
                        </view>
                        <view class="msg__goods">「{{ row.goods.title }}」</view>
                        <view class="msg__last">{{ row.conversation.lastMessage || '开始沟通吧～' }}</view>
                    </view>
                </view>
            </template>
            <hy-empty v-else mode="message" description="暂无会话，去商品页和卖家聊聊吧"></hy-empty>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.msg {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;

    &__safety {
        margin-bottom: 24rpx;
    }

    &__entries {
        border-radius: 16rpx;
        overflow: hidden;
        margin-bottom: 24rpx;
    }

    &__title {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--hy-main-color, #303133);
        margin-bottom: 16rpx;
    }

    &__loading {
        padding: 24rpx;
    }

    &__item {
        display: flex;
        gap: 20rpx;
        padding: 24rpx;
        background: var(--hy-bg-color, #fff);
        border-radius: 16rpx;
        margin-bottom: 16rpx;
    }

    &__avatar {
        position: relative;
    }

    &__badge {
        position: absolute;
        top: -8rpx;
        right: -8rpx;
        min-width: 32rpx;
        height: 32rpx;
        padding: 0 8rpx;
        border-radius: 16rpx;
        background: var(--hy-error-color, #f56c6c);
        color: #fff;
        font-size: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
    }

    &__body {
        flex: 1;
        min-width: 0;
    }

    &__row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__name {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--hy-main-color, #303133);
    }

    &__time {
        font-size: 22rpx;
        color: var(--hy-info-color, #909193);
    }

    &__goods {
        margin-top: 6rpx;
        font-size: 22rpx;
        color: var(--hy-primary-color, #3d7eff);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__last {
        margin-top: 6rpx;
        font-size: 25rpx;
        color: var(--hy-info-color, #909193);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
</style>
