<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getOrderDetailApi, submitReviewApi } from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import type { OrderRow } from '@/types';
import { onLoad } from '@dcloudio/uni-app';
import { ensureLoginAndSchool } from '@/utils/guard';
import { computed, ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '评价交易'
    }
});

const toast = useToast();
const userStore = useUserStore();

const orderId = ref('');
const row = ref<OrderRow | null>(null);
const rate = ref(5);
const content = ref('');
const submitting = ref(false);

const sellerName = computed(() => row.value?.seller.nickname || '卖家');

onLoad(async options => {
    if (!ensureLoginAndSchool()) return;
    orderId.value = (options?.orderId as string) || '';
    if (orderId.value) {
        row.value = await getOrderDetailApi(orderId.value);
    }
});

const RATE_LABELS = ['', '很差', '不满意', '一般', '满意', '超赞'];
const rateLabel = computed(() => RATE_LABELS[rate.value] || '');

const submit = async () => {
    if (!content.value.trim()) {
        toast.warning('写点评价内容吧');
        return;
    }
    if (submitting.value) return;
    submitting.value = true;
    try {
        await submitReviewApi({ orderId: orderId.value, rate: rate.value, content: content.value.trim() });
        toast.success('评价成功，感谢您的反馈');
        setTimeout(() => uni.navigateBack(), 600);
    } catch (e) {
        toast.error((e as Error).message || '评价失败');
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
    <the-root-pages>
        <view v-if="row" class="review">
            <!-- 商品信息 -->
            <view class="review__goods">
                <hy-image :src="row.goods.images[0]" width="120rpx" height="120rpx" radius="10rpx" />
                <view class="review__goods-info">
                    <view class="review__goods-title">{{ row.goods.title }}</view>
                    <text class="review__goods-sub">卖家：{{ sellerName }} · 成交价 ￥{{ row.order.price }}</text>
                </view>
            </view>

            <!-- 评分 -->
            <view class="review__card">
                <view class="review__card-title">为本次交易评分</view>
                <view class="review__rate-row">
                    <hy-rate v-model="rate" :size="28" active-color="#FFB300" :touchable="true"></hy-rate>
                    <text class="review__rate-label">{{ rateLabel }}</text>
                </view>
            </view>

            <!-- 评价内容 -->
            <view class="review__card">
                <view class="review__card-title">评价内容</view>
                <hy-textarea v-model="content" placeholder="商品描述相符吗？卖家沟通及时吗？线下交易顺利吗？" :maxlength="200" count auto-height border="surround"></hy-textarea>
            </view>

            <!-- 提示 -->
            <view class="review__tip">
                <hy-icon name="notice" color="var(--hy-info-color)" :size="14" />
                <text>评价将在卖家商品详情页展示，请文明评价</text>
            </view>

            <view class="review__footer">
                <hy-button
                    text="提交评价"
                    shape="circle"
                    type="primary"
                    :loading="submitting"
                    :custom-style="{ height: '92rpx', fontSize: '32rpx' }"
                    @click="submit"
                ></hy-button>
                <hy-safe-bottom></hy-safe-bottom>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.review {
    min-height: 100vh;
    padding: 24rpx 24rpx 200rpx;
    box-sizing: border-box;

    &__goods {
        display: flex;
        gap: 20rpx;
        background: var(--hy-bg-color, #fff);
        border-radius: 16rpx;
        padding: 24rpx;
    }

    &__goods-info {
        flex: 1;
        min-width: 0;
    }

    &__goods-title {
        font-size: 28rpx;
        font-weight: 500;
        color: var(--hy-main-color, #303133);
        margin-bottom: 10rpx;
    }

    &__goods-sub {
        font-size: 24rpx;
        color: var(--hy-info-color, #909193);
    }

    &__card {
        background: var(--hy-bg-color, #fff);
        border-radius: 16rpx;
        padding: 24rpx;
        margin-top: 24rpx;
    }

    &__card-title {
        font-size: 29rpx;
        font-weight: 600;
        color: var(--hy-main-color, #303133);
        margin-bottom: 20rpx;
    }

    &__rate-row {
        display: flex;
        align-items: center;
        gap: 20rpx;
    }

    &__rate-label {
        font-size: 28rpx;
        color: var(--hy-warning-color, #f9ae3d);
        font-weight: 500;
    }

    &__tip {
        margin-top: 20rpx;
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--hy-info-color, #909193);
    }

    &__footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 16rpx 24rpx;
        background: var(--hy-bg-color, #fff);
        box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
    }
}
</style>
