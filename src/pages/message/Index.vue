<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import SafetyTips from '@/components/SafetyTips.vue';
import { getConversationListApi } from '@/api';
import { useUserStore } from '@/store';
import { ensureLoginAndSchool } from '@/utils/guard';
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
                <hy-cell-item
                    title="订单通知"
                    sub="卖家确认、申诉期提醒都会在这里通知"
                    clickable
                    is-right-icon
                    @click="goOrders"
                >
                    <template #icon>
                        <view class="msg__entry-icon">
                            <hy-icon
                                name="order"
                                color="var(--primary, #3d7eff)"
                                :size="22"
                            ></hy-icon>
                        </view>
                    </template>
                </hy-cell-item>
                <hy-cell-item
                    title="安全中心"
                    sub="交易安全守则、举报与紧急求助"
                    clickable
                    is-right-icon
                    @click="goSecurity"
                >
                    <template #icon>
                        <view class="msg__entry-icon msg__entry-icon--green">
                            <hy-icon
                                name="security"
                                color="var(--hy-success, #07c160)"
                                :size="22"
                            ></hy-icon>
                        </view>
                    </template>
                </hy-cell-item>
            </hy-cell>

            <!-- 会话列表 -->
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
            <hy-empty
                v-else
                mode="message"
                description="暂无会话，去商品页和卖家聊聊吧"
            ></hy-empty>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.msg {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;

    &__safety {
        margin-bottom: 24rpx;
    }

    &__entries {
        @include hy-card(20rpx);
        margin-bottom: 24rpx;
        overflow: hidden;
    }

    &__entry-icon {
        @include hy-icon-badge(64rpx, 18rpx);

        &--green {
            background: rgba(7, 193, 96, 0.1);
        }
    }

    &__title {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
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
