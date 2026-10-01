<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import {
    getConversationListApi,
    getMessagesApi,
    getPeerName,
    sendMessageApi,
    startConversationApi,
} from '@/api';
import { getGoodsDetailApi, applyBuyApi, type IGoodsDetail } from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { fmtTime } from '@/utils/format';
import type { ChatMessage } from '@/types';
import { onLoad } from '@dcloudio/uni-app';
import { ensureLoginAndSchool } from '@/utils/guard';
import { computed, nextTick, ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '会话',
    },
});

const toast = useToast();
const userStore = useUserStore();

const conversationId = ref('');
const peerName = ref('同学');
const goods = ref<IGoodsDetail | null>(null);
const messages = ref<ChatMessage[]>([]);
const input = ref('');
const sending = ref(false);
const scrollInto = ref('');

const isBuyer = computed(
    () => goods.value?.sellerId !== userStore.userInfo?.id
);
/** 商品仍在售时，买家可在会话内直接发起购买申请 */
const canApply = computed(
    () => goods.value && goods.value.status === 'ON_SALE' && isBuyer.value
);

const scrollToBottom = () => {
    nextTick(() => {
        const last = messages.value[messages.value.length - 1];
        if (last) scrollInto.value = `msg-${last.id}`;
    });
};

const load = async () => {
    messages.value = await getMessagesApi(conversationId.value);
    scrollToBottom();
};

onLoad(async options => {
    if (!ensureLoginAndSchool()) return;
    // 商品页「聊一聊」带 goodsId 进入：先创建/复用会话
    if (options?.goodsId) {
        conversationId.value = await startConversationApi(
            options.goodsId as string
        );
    } else {
        conversationId.value = (options?.id as string) || '';
    }
    if (!conversationId.value) return;

    // 会话关联信息：优先从会话列表联查；商品页进入时直接按 goodsId 查
    const rows = await getConversationListApi();
    const row = rows.find(r => r.conversation.id === conversationId.value);
    if (row) {
        goods.value = await getGoodsDetailApi(row.goods.id);
        peerName.value = row.peer.nickname;
    } else if (options?.goodsId) {
        goods.value = await getGoodsDetailApi(options.goodsId as string);
        peerName.value =
            goods.value?.sellerId === userStore.userInfo?.id
                ? '买家'
                : goods.value?.seller.nickname || '同学';
    }
    if (!peerName.value || peerName.value === '同学') {
        peerName.value = getPeerName(conversationId.value);
    }
    uni.setNavigationBarTitle({ title: peerName.value });
    load();
});

const send = async () => {
    const content = input.value.trim();
    if (!content || sending.value) return;
    sending.value = true;
    input.value = '';
    await sendMessageApi(conversationId.value, content);
    await load();
    sending.value = false;
};

/** 会话内快捷发起购买申请 */
const quickApply = async () => {
    if (!goods.value) return;
    try {
        const orderId = await applyBuyApi({ goodsId: goods.value.id });
        toast.success('申请已提交，等待卖家确认');
        setTimeout(
            () => uni.navigateTo({ url: `/pages/order/Detail?id=${orderId}` }),
            500
        );
    } catch (e) {
        toast.warning((e as Error).message || '无法提交申请');
    }
};

const goGoods = () => {
    if (goods.value) {
        uni.navigateTo({ url: `/pages/goods/Detail?id=${goods.value.id}` });
    }
};
</script>

<template>
    <the-root-pages>
        <view class="chat">
            <!-- 关联商品条 -->
            <view
                v-if="goods"
                class="chat__goods"
                hover-class="chat__goods--hover"
                :hover-stay-time="120"
                @tap="goGoods"
            >
                <hy-image
                    :src="goods.images[0]"
                    width="88rpx"
                    height="88rpx"
                    radius="8rpx"
                />
                <view class="chat__goods-info">
                    <view class="chat__goods-title">{{ goods.title }}</view>
                    <hy-price :text="String(goods.price)" :size="15" />
                </view>
                <hy-button
                    v-if="canApply"
                    text="提交购买申请"
                    type="primary"
                    size="mini"
                    shape="circle"
                    @click="quickApply"
                ></hy-button>
                <hy-tag
                    v-else
                    :label="goods.status === 'SOLD' ? '已售出' : '交易进行中'"
                    type="info"
                    size="mini"
                />
            </view>

            <!-- 安全提示 -->
            <view class="chat__safety">
                <hy-icon
                    name="security"
                    color="var(--hy-success, #07c160)"
                    :size="14"
                />
                <text
                    >请在校内公共场所当面交易、当面验货，勿提前转账，勿脱离平台沟通</text
                >
            </view>

            <!-- 消息列表 -->
            <scroll-view
                class="chat__list"
                scroll-y
                :scroll-into-view="scrollInto"
                scroll-with-animation
            >
                <view
                    v-for="msg in messages"
                    :id="`msg-${msg.id}`"
                    :key="msg.id"
                    class="chat__msg"
                    :class="{
                        'chat__msg--mine':
                            msg.fromUserId === userStore.userInfo?.id,
                    }"
                >
                    <view
                        v-if="msg.fromUserId !== userStore.userInfo?.id"
                        class="chat__bubble chat__bubble--peer"
                    >
                        <text>{{ msg.content }}</text>
                    </view>
                    <text v-else class="chat__bubble chat__bubble--mine">
                        {{ msg.content }}
                    </text>
                </view>
                <view class="chat__msg-time">{{
                    messages.length
                        ? fmtTime(messages[0].time) + ' 开始会话'
                        : ''
                }}</view>
                <view class="chat__list-bottom"></view>
            </scroll-view>

            <!-- 输入栏 -->
            <view class="chat__input-bar">
                <hy-textarea
                    v-model="input"
                    placeholder="和 TA 沟通商品细节..."
                    :maxlength="200"
                    :auto-height="true"
                    :height="'40'"
                    fixed
                    border="none"
                    :custom-style="{
                        flex: 1,
                        background: 'var(--hy-background, #f8f8f8)',
                        borderRadius: '32rpx',
                        padding: '16rpx 24rpx',
                    }"
                ></hy-textarea>
                <hy-button
                    text="发送"
                    type="primary"
                    shape="circle"
                    :disabled="!input.trim()"
                    :loading="sending"
                    :custom-style="{ marginLeft: '16rpx' }"
                    @click="send"
                ></hy-button>
                <hy-safe-bottom></hy-safe-bottom>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.chat {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &__goods {
        display: flex;
        align-items: center;
        gap: 16rpx;
        padding: 16rpx 24rpx;
        background: var(--hy-background--container, #ffffff);
        border-bottom: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));
        box-shadow: 0 4rpx 16rpx rgba(30, 60, 120, 0.04);
        animation: chat-fade-down 0.35s ease both;
        transition: opacity 0.15s ease;
    }

    &__goods--hover {
        opacity: 0.7;
    }

    &__goods-info {
        flex: 1;
        min-width: 0;
    }

    &__goods-title {
        font-size: 26rpx;
        color: var(--hy-text-color, #000000);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 6rpx;
    }

    &__safety {
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: 12rpx 24rpx;
        font-size: 22rpx;
        color: var(--hy-success, #07c160);
        background: var(--hy-success--light, rgba(7, 193, 96, 0.1));
    }

    &__list {
        flex: 1;
        padding: 24rpx;
        box-sizing: border-box;
    }

    &__msg {
        display: flex;
        margin-bottom: 24rpx;

        &--mine {
            justify-content: flex-end;
        }
    }

    &__bubble {
        max-width: 70%;
        padding: 18rpx 24rpx;
        border-radius: 16rpx;
        font-size: 27rpx;
        line-height: 1.6;
        word-break: break-all;

        &--peer {
            background: var(--hy-background--container, #ffffff);
            color: var(--hy-text-color, #000000);
            border-top-left-radius: 4rpx;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
        }

        &--mine {
            background: var(--primary, #3d7eff);
            color: #fff;
            border-top-right-radius: 4rpx;
            box-shadow: 0 4rpx 12rpx
                var(--primary-light-2, rgba(61, 126, 255, 0.3));
        }
    }

    &__msg-time {
        text-align: center;
        font-size: 20rpx;
        color: var(--hy-text-color--placeholder, #c0c4cc);
    }

    &__list-bottom {
        height: 20rpx;
    }

    &__input-bar {
        display: flex;
        align-items: flex-end;
        padding: 16rpx 24rpx 8rpx;
        background: var(--hy-background--container, #ffffff);
        border-top: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));
    }
}

@keyframes chat-fade-down {
    from {
        opacity: 0;
        transform: translateY(-16rpx);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
