<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import SafetyTips from '@/components/SafetyTips.vue';
import { getConversationListApi } from '@/api';
import { useUserStore } from '@/store';
import { ensureLogin } from '@/utils/guard';
import { fmtTime } from '@/utils/format';
import type { ConversationRow } from '@/types';
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '消息',
    },
});

const userStore = useUserStore();

const list = ref<ConversationRow[]>([]);
const loading = ref(true);

/** 汇总未读数 → tabBar 角标 */
const syncBadge = () => {
    const total = list.value.reduce((sum, row) => sum + (row.unread || 0), 0);
    if (total > 0) {
        uni.setTabBarBadge({ index: 1, text: total > 99 ? '99+' : String(total) });
    } else {
        uni.removeTabBarBadge({ index: 1, fail: () => {} });
    }
};

const loadList = async () => {
    loading.value = true;
    list.value = await getConversationListApi();
    syncBadge();
    loading.value = false;
};

onShow(() => {
    // 未登录不拉会话（页面内显示登录引导），登录后再加载
    if (!userStore.hasLogin) return;
    loadList();
});

const goChat = (row: ConversationRow) => {
    uni.navigateTo({ url: `/pages/chat/Detail?id=${row.conversation.id}` });
};

const goOrders = () => {
    uni.navigateTo({ url: '/pages/order/List' });
};

const goLogin = () => {
    uni.navigateTo({ url: '/pages/login/Index' });
};

const goSecurity = () => {
    uni.navigateTo({ url: '/pages/security/Index' });
};

const goIndex = () => {
    uni.switchTab({ url: '/pages/index/Index' });
};
</script>

<template>
    <the-root-pages>
        <view class="msg">
            <!-- 安全提醒（消息页强制展示） -->
            <view class="msg__safety">
                <safety-tips :compact="true"></safety-tips>
            </view>

            <!-- 功能入口：双列卡片 -->
            <view class="msg__entries">
                <view
                    class="msg__entry"
                    hover-class="msg__entry--hover"
                    :hover-stay-time="120"
                    @tap="goOrders"
                >
                    <view class="msg__entry-icon">
                        <hy-icon
                            name="/static/icons/order.png"
                            :size="26"
                        ></hy-icon>
                    </view>
                    <view class="msg__entry-body">
                        <text class="msg__entry-title">订单通知</text>
                        <text class="msg__entry-sub">进度 · 申诉提醒</text>
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="var(--hy-text-color--4, #c0c4cc)"
                        :size="14"
                    ></hy-icon>
                </view>
                <view
                    class="msg__entry"
                    hover-class="msg__entry--hover"
                    :hover-stay-time="120"
                    @tap="goSecurity"
                >
                    <view class="msg__entry-icon msg__entry-icon--green">
                        <hy-icon
                            name="/static/icons/shield.png"
                            :size="26"
                        ></hy-icon>
                    </view>
                    <view class="msg__entry-body">
                        <text class="msg__entry-title">安全中心</text>
                        <text class="msg__entry-sub">守则 · 举报 · 求助</text>
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="var(--hy-text-color--4, #c0c4cc)"
                        :size="14"
                    ></hy-icon>
                </view>
            </view>

            <!-- 未登录：登录引导 -->
            <view v-if="!userStore.hasLogin" class="msg__login-guide">
                <view class="msg__login-logo">
                    <hy-icon
                        name="/static/icons/message.png"
                        :size="32"
                    />
                </view>
                <text class="msg__login-title">登录后查看站内会话</text>
                <text class="msg__login-desc"
                    >与买家/卖家在线沟通，交易全程留痕</text
                >
                <hy-button
                    text="微信一键登录"
                    color="#07c160"
                    shape="circle"
                    @click="goLogin"
                ></hy-button>
            </view>

            <!-- 会话列表（登录可见） -->
            <template v-if="userStore.hasLogin">
                <view class="msg__title">站内会话</view>
                <view v-if="loading" class="msg__loading">
                    <hy-skeleton
                        theme="avatar"
                        :row-col="[1, 1, 1]"
                        animation="gradient"
                    ></hy-skeleton>
                </view>
            <template v-else-if="list.length">
                <view
                    v-for="(row, i) in list"
                    :key="row.conversation.id"
                    class="msg__item"
                    :style="{ animationDelay: `${i * 0.06}s` }"
                    hover-class="msg__item--hover"
                    :hover-stay-time="120"
                    @tap="goChat(row)"
                >
                    <view class="msg__avatar">
                        <hy-avatar
                            :text="row.peer.nickname.slice(0, 1)"
                            random-bg-color
                            :name="row.peer.nickname"
                            :size="40"
                        ></hy-avatar>
                        <view v-if="row.unread" class="msg__badge">{{
                            row.unread > 99 ? '99+' : row.unread
                        }}</view>
                    </view>
                    <view class="msg__body">
                        <view class="msg__row">
                            <text
                                class="msg__name"
                                :class="{ 'msg__name--unread': row.unread }"
                                >{{ row.peer.nickname }}</text
                            >
                            <text class="msg__time">{{
                                fmtTime(row.conversation.lastTime)
                            }}</text>
                        </view>
                        <view
                            class="msg__goods"
                            :class="{ 'msg__goods--unread': row.unread }"
                            >{{ row.goods.title }}</view
                        >
                        <view class="msg__last">{{
                            row.conversation.lastMessage || '开始沟通吧～'
                        }}</view>
                    </view>
                    <view class="msg__thumb">
                        <hy-image
                            :src="row.goods.images?.[0]"
                            width="96rpx"
                            height="96rpx"
                            radius="12rpx"
                        ></hy-image>
                    </view>
                </view>
            </template>
            <view v-else class="msg__empty">
                <view class="msg__empty-icon">
                    <hy-icon
                        name="/static/icons/message.png"
                        :size="40"
                    ></hy-icon>
                </view>
                <text class="msg__empty-title">暂无会话</text>
                <text class="msg__empty-sub"
                    >去逛逛，和卖家聊聊心仪的宝贝吧</text
                >
                <hy-button
                    text="去逛逛"
                    size="small"
                    shape="circle"
                    :custom-style="{ marginTop: '28rpx' }"
                    @click="goIndex"
                ></hy-button>
            </view>
            </template>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.msg {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 24rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));

    /* 高度链：小程序 tabBar 页 provider 高度 auto（min-height:100%），
       子级百分比高度解析为 auto；用视口计算（100vh 减 tabBar 高+安全区=可视区） */
    /* #ifdef MP-WEIXIN */
    height: calc(100vh - 100rpx - env(safe-area-inset-bottom));
    overflow-y: auto;
    /* #endif */
    /* #ifdef H5 */
    min-height: calc(100vh - var(--window-bottom, 0px));
    /* #endif */

    &__safety {
        margin-bottom: 24rpx;
    }

    &__login-guide {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-top: 16rpx;
        @include hy-card(20rpx);
        padding: 64rpx 40rpx 72rpx;
        gap: 20rpx;
    }

    &__login-logo {
        width: 112rpx;
        height: 112rpx;
        border-radius: 32rpx;
        background: rgba(61, 126, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8rpx;
    }

    &__login-title {
        font-size: 32rpx;
        font-weight: 600;
        color: #1f2329;
    }

    &__login-desc {
        font-size: 24rpx;
        color: #929295;
    }

    &__entries {
        display: flex;
        gap: 20rpx;
        margin-bottom: 32rpx;
    }

    &__entry {
        @include hy-card(20rpx);
        flex: 1;
        display: flex;
        align-items: center;
        gap: 16rpx;
        padding: 26rpx 24rpx;
        transition: transform 0.15s ease;

        &--hover {
            transform: scale(0.97);
        }
    }

    &__entry-icon {
        @include hy-icon-badge(72rpx, 20rpx);

        &--green {
            background: rgba(7, 193, 96, 0.1);
        }
    }

    &__entry-body {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4rpx;
    }

    &__entry-title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
    }

    &__entry-sub {
        font-size: 20rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--hy-text-color--2, #46464a);
        margin-bottom: 16rpx;
    }

    &__loading {
        padding: 24rpx;
    }

    &__item {
        @include hy-card(20rpx);
        display: flex;
        gap: 20rpx;
        padding: 24rpx;
        margin-bottom: 16rpx;
        animation: msg-fade-up 0.45s ease-out both;

        &--hover {
            background: var(--hy-background--hover, rgba(0, 0, 0, 0.05));
        }
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
        background: var(--hy-error, #f56c6c);
        color: #fff;
        font-size: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        border: 2rpx solid #ffffff;
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
        font-weight: 400;
        color: var(--hy-text-color--2, #46464a);

        &--unread {
            font-weight: 600;
            color: var(--hy-text-color, #000000);
        }
    }

    &__time {
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__goods {
        margin-top: 6rpx;
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &--unread {
            color: var(--primary, #3d7eff);
        }
    }

    &__last {
        margin-top: 6rpx;
        font-size: 25rpx;
        color: var(--hy-text-color--3, #929295);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    &__thumb {
        flex-shrink: 0;
        align-self: center;
    }

    &__empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40rpx 0 40rpx;

        &-icon {
            width: 120rpx;
            height: 120rpx;
            border-radius: 50%;
            background: var(--primary-light, rgba(61, 126, 255, 0.08));
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 28rpx;
        }

        &-title {
            font-size: 30rpx;
            font-weight: 600;
            color: var(--hy-text-color--2, #46464a);
        }

        &-sub {
            margin-top: 10rpx;
            font-size: 24rpx;
            color: var(--hy-text-color--3, #929295);
        }
    }
}

@keyframes msg-fade-up {
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
