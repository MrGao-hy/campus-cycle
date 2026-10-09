<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import SafetyTips from '@/components/SafetyTips.vue';
import { getGoodsDetailApi, startConversationApi } from '@/api';
import { useUserStore } from '@/store';
import { useMessage, type SwiperVo } from '@/uni_modules/hy-app-ui';
import { useToast } from '@/utils/toast';
import { fmtTime } from '@/utils/format';
import { GOODS_STATUS_TEXT } from '@/types';
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import type { IGoodsDetail } from '@/api';

definePage({
    style: {
        navigationBarTitleText: '商品详情',
    },
});

const toast = useToast();
const message = useMessage();
const userStore = useUserStore();

const detail = ref<IGoodsDetail | null>(null);
const current = ref(0);

const isMine = computed(
    () => detail.value?.sellerId === userStore.userInfo?.id
);
const canBuy = computed(
    () => detail.value && detail.value.status === 'ON_SALE' && !isMine.value
);
/** 自己发布的商品：在售状态下可下架 */
const canOffShelf = computed(
    () => isMine.value && detail.value?.status === 'ON_SALE'
);
/** 自己发布的商品：未售出才可删除 */
const canDelete = computed(
    () => isMine.value && !!detail.value && detail.value.status !== 'SOLD'
);

onLoad(async options => {
    const id = options?.id as string;
    if (!id) return;
    detail.value = await getGoodsDetailApi(id);
});

const onSwiperChange = (e: SwiperVo['detail']) => {
    current.value = e.current;
};

/** 站内会话沟通 */
const goChat = async () => {
    if (!detail.value) return;
    if (isMine.value) {
        toast.info('这是您发布的商品');
        return;
    }
    // 未登录 → 先去登录
    if (!userStore.hasLogin) {
        uni.navigateTo({ url: '/pages/login/Index' });
        return;
    }
    const conversationId = await startConversationApi(detail.value.id);
    uni.navigateTo({ url: `/pages/chat/Detail?id=${conversationId}` });
};

/** 买家提交购买申请 */
const goApply = () => {
    if (!detail.value) return;
    if (!userStore.hasLogin) {
        uni.navigateTo({ url: '/pages/login/Index' });
        return;
    }
    uni.navigateTo({ url: `/pages/goods/Apply?id=${detail.value.id}` });
};

/** 下架 / 删除确认弹窗（message.confirm，确认后执行） */
type ConfirmType = 'offShelf' | 'delete';

const CONFIRM_META: Record<ConfirmType, { title: string; content: string }> = {
    offShelf: {
        title: '下架商品',
        content: '下架后买家将无法浏览该商品，确定下架吗？',
    },
    delete: {
        title: '删除商品',
        content: '删除后不可恢复，确定删除该商品吗？',
    },
};

const onConfirmAction = async (type: ConfirmType) => {
    const goods = detail.value;
    if (!goods) return;
    const confirmed = await message.confirm({
        title: CONFIRM_META[type].title,
        content: CONFIRM_META[type].content,
        confirmColor: type === 'delete' ? '#fa3534' : undefined,
    });
    if (!confirmed) return;
    try {
        if (type === 'offShelf') {
            await offShelfGoodsApi(goods.id);
            goods.status = 'OFF_SHELF';
            toast.success('商品已下架');
        } else {
            await deleteGoodsApi(goods.id);
            toast.success('商品已删除');
            setTimeout(() => uni.navigateBack(), 600);
        }
    } catch (err) {
        toast.error((err as Error).message || '操作失败');
    }
};

/** 预览图片 */
const previewImages = (index: number) => {
    if (!detail.value) return;
    uni.previewImage({ urls: detail.value.images, current: index });
};

/** 查看卖家主页（自己不跳） */
const goSellerProfile = () => {
    if (!detail.value || isMine.value) return;
    uni.navigateTo({ url: `/pages/user/Detail?id=${detail.value.sellerId}` });
};
</script>

<template>
    <the-root-pages>
        <view v-if="detail" class="detail">
            <!-- 图片轮播 -->
            <view class="detail__swiper">
                <hy-swiper
                    :list="detail.images"
                    height="640rpx"
                    indicator
                    @change="onSwiperChange"
                ></hy-swiper>
                <view v-if="detail.status === 'SOLD'" class="detail__sold-mask">
                    <hy-image
                        src="/static/images/soldOut.png"
                        width="155"
                        height="140"
                    ></hy-image>
                </view>
            </view>

            <view class="detail__main">
                <!-- 商品信息卡 -->
                <view class="detail__card">
                    <!-- 价格与成色 -->
                    <view class="detail__price-row">
                        <hy-price :text="String(detail.price)" :size="26" />
                        <text v-if="detail.originalPrice" class="detail__origin"
                            >原价 ￥{{ detail.originalPrice }}</text
                        >
                        <hy-tag
                            :label="detail.condition"
                            type="warning"
                            plain
                            size="small"
                        />
                        <view class="detail__flex-fill"></view>
                        <hy-tag
                            :label="GOODS_STATUS_TEXT[detail.status]"
                            :type="
                                detail.status === 'ON_SALE' ? 'success' : 'info'
                            "
                            size="small"
                        />
                    </view>

                    <!-- 标题与描述 -->
                    <view class="detail__title">{{ detail.title }}</view>
                    <view class="detail__desc">{{ detail.description }}</view>

                    <!-- 元信息 -->
                    <view class="detail__meta">
                        <text>发布于 {{ fmtTime(detail.publishTime) }}</text>
                        <text>浏览 {{ detail.views }}</text>
                        <text>{{ detail.wantCount }} 人想要</text>
                    </view>
                </view>

                <!-- 卖家信息（点击查看用户主页） -->
                <view class="detail__seller" @tap="goSellerProfile">
                    <hy-avatar
                        :text="detail.seller.nickname.slice(0, 1)"
                        random-bg-color
                        :name="detail.seller.nickname"
                        :size="44"
                    />
                    <view class="detail__seller-info">
                        <view class="detail__seller-name">
                            {{ detail.seller.nickname }}
                            <hy-tag
                                v-if="isMine"
                                label="我发布的"
                                type="primary"
                                size="mini"
                            />
                        </view>
                        <text class="detail__seller-sub"
                            >信用分 {{ detail.seller.creditScore }} · 成交
                            {{ detail.seller.successCount }} 单</text
                        >
                    </view>
                    <hy-button
                        v-if="!isMine"
                        text="聊一聊"
                        size="small"
                        shape="circle"
                        plain
                        type="primary"
                        @click="goChat"
                    ></hy-button>
                </view>

                <!-- 买家评价 -->
                <view v-if="detail.reviews.length" class="detail__reviews">
                    <view class="detail__section-title"
                        >买家评价（{{ detail.reviews.length }}）</view
                    >
                    <view
                        v-for="review in detail.reviews"
                        :key="review.id"
                        class="detail__review"
                    >
                        <view class="detail__review-head">
                            <hy-avatar
                                :text="review.fromNickname.slice(0, 1)"
                                random-bg-color
                                :name="review.fromNickname"
                                :size="32"
                            />
                            <text class="detail__review-name">{{
                                review.fromNickname
                            }}</text>
                            <hy-rate
                                :model-value="review.rate"
                                readonly
                                :size="12"
                                active-color="#FFB300"
                            ></hy-rate>
                        </view>
                        <view class="detail__review-content">{{
                            review.content
                        }}</view>
                    </view>
                </view>

                <!-- 交易安全提醒（商品页强制展示） -->
                <view class="detail__safety">
                    <safety-tips :compact="true"></safety-tips>
                </view>
            </view>

            <!-- 底部操作栏 -->
            <view class="detail__footer">
                <view class="detail__footer-inner">
                    <view v-if="canBuy" class="detail__footer-btns">
                        <hy-button
                            text="站内沟通"
                            shape="circle"
                            plain
                            type="primary"
                            :custom-style="{ flex: 1 }"
                            @click="goChat"
                        ></hy-button>
                        <hy-button
                            text="我想要"
                            shape="circle"
                            color="var(--primary, #3d7eff)"
                            :custom-style="{ flex: 1 }"
                            @click="goApply"
                        ></hy-button>
                    </view>
                    <!-- 自己发布的商品：下架 / 删除 -->
                    <view
                        v-else-if="canOffShelf || canDelete"
                        class="detail__footer-btns"
                    >
                        <hy-button
                            v-if="canOffShelf"
                            text="下架"
                            shape="circle"
                            plain
                            type="warning"
                            :custom-style="{ flex: 1 }"
                            @click="onConfirmAction('offShelf')"
                        ></hy-button>
                        <hy-button
                            v-if="canDelete"
                            text="删除"
                            shape="circle"
                            type="error"
                            :custom-style="{ flex: 1 }"
                            @click="onConfirmAction('delete')"
                        ></hy-button>
                    </view>
                    <view v-else class="detail__footer-tip">
                        <hy-icon
                            :name="
                                detail.status === 'ON_SALE' ? 'mine' : 'lock'
                            "
                            color="var(--hy-text-color--3, #929295)"
                            :size="16"
                        />
                        <text>{{
                            isMine
                                ? '商品已售出'
                                : detail.status === 'SOLD'
                                  ? '商品已售出，看看其他宝贝吧'
                                  : '该商品交易进行中，暂不可申请'
                        }}</text>
                    </view>
                    <hy-safe-bottom></hy-safe-bottom>
                </view>
            </view>

            <!-- message 弹窗渲染载体（配合 useMessage） -->
            <hy-modal></hy-modal>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.detail {
    min-height: 100vh;
    padding-bottom: 160rpx;

    &__swiper {
        height: 640rpx;
        position: relative;
    }

    &__sold-mask {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        color: #fff;
        font-size: 56rpx;
        font-weight: 700;
        letter-spacing: 8rpx;
    }

    &__main {
        padding: 24rpx;
        animation: detail-fade-up 0.45s ease both;
    }

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
    }

    &__price-row {
        display: flex;
        align-items: center;
        gap: 16rpx;
    }

    &__flex-fill {
        flex: 1;
    }

    &__origin {
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
        text-decoration: line-through;
    }

    &__title {
        margin-top: 20rpx;
        font-size: 34rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        line-height: 1.5;
    }

    &__desc {
        margin-top: 16rpx;
        font-size: 28rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.7;
    }

    &__meta {
        margin-top: 20rpx;
        display: flex;
        gap: 32rpx;
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__seller {
        @include hy-card(20rpx);
        margin-top: 24rpx;
        display: flex;
        align-items: center;
        gap: 20rpx;
        padding: 24rpx;
    }

    &__seller-info {
        flex: 1;
    }

    &__seller-name {
        display: flex;
        align-items: center;
        gap: 12rpx;
        font-size: 30rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
    }

    &__seller-sub {
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__reviews {
        margin-top: 24rpx;
    }

    &__section-title {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 16rpx;
    }

    &__review {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin-bottom: 16rpx;
    }

    &__review-head {
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    &__review-name {
        flex: 1;
        font-size: 26rpx;
        color: var(--hy-text-color, #000000);
    }

    &__review-content {
        margin-top: 12rpx;
        font-size: 26rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
    }

    &__safety {
        margin-top: 24rpx;
    }

    &__footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--hy-background--container, #ffffff);
        box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
    }

    &__footer-inner {
        padding: 16rpx 24rpx;
    }

    &__footer-btns {
        display: flex;
        gap: 24rpx;
    }

    &__footer-tip {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10rpx;
        font-size: 26rpx;
        color: var(--hy-text-color--3, #929295);
        padding: 16rpx 0;
    }
}

@keyframes detail-fade-up {
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
