<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { applyBuyApi, getGoodsDetailApi } from '@/api';
import { useToast } from '@/utils/toast';
import { SAFETY_PROMISES } from '@/types';
import { onLoad } from '@dcloudio/uni-app';
import { ensureLoginAndSchool } from '@/utils/guard';
import { computed, ref } from 'vue';
import type { IGoodsDetail } from '@/api';

definePage({
    style: {
        navigationBarTitleText: '确认购买',
    },
});

const toast = useToast();

const goodsId = ref('');
const detail = ref<IGoodsDetail | null>(null);
const remark = ref('');
const submitting = ref(false);

/** 强制勾选的安全承诺，三项全部勾选才能提交 */
const promises = ref<string[]>([]);
const allPromised = computed(
    () => promises.value.length === SAFETY_PROMISES.length
);

onLoad(async options => {
    if (!ensureLoginAndSchool()) return;
    goodsId.value = (options?.id as string) || '';
    if (goodsId.value) {
        detail.value = await getGoodsDetailApi(goodsId.value);
    }
});

const submit = async () => {
    if (!allPromised.value) {
        toast.warning('请先勾选全部安全承诺');
        return;
    }
    if (submitting.value) return;
    submitting.value = true;
    try {
        const orderId = await applyBuyApi({
            goodsId: goodsId.value,
            remark: remark.value,
        });
        toast.success('申请已提交，等待卖家确认');
        setTimeout(() => {
            uni.redirectTo({ url: `/pages/order/Detail?id=${orderId}` });
        }, 600);
    } catch (e) {
        toast.error((e as Error).message || '提交失败');
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
    <the-root-pages>
        <view v-if="detail" class="apply">
            <!-- 商品信息 -->
            <view class="apply__goods">
                <hy-image
                    :src="detail.images[0]"
                    width="160rpx"
                    height="160rpx"
                    radius="12rpx"
                />
                <view class="apply__goods-info">
                    <view class="apply__goods-title">{{ detail.title }}</view>
                    <view class="apply__goods-meta"
                        >{{ detail.condition }} ·
                        {{ detail.seller.nickname }}</view
                    >
                    <hy-price :text="String(detail.price)" :size="20" />
                </view>
            </view>

            <!-- 交易说明 -->
            <view class="apply__card">
                <view class="apply__card-title">交易说明</view>
                <view class="apply__rule">
                    <view class="apply__rule-icon">
                        <hy-icon
                            name="/static/icons/order.png"
 :size="16"
                        />
                    </view>
                    <text
                        >提交申请后由卖家确认，平台创建订单，买家无任何费用</text
                    >
                </view>
                <view class="apply__rule">
                    <view class="apply__rule-icon">
                        <hy-icon
                            name="/static/icons/telephone.png"
                            color="var(--primary, #3d7eff)"
                            :size="16"
                        />
                    </view>
                    <text>卖家确认后才展示其联系方式（电话/QQ/微信/邮箱）</text>
                </view>
                <view class="apply__rule">
                    <view class="apply__rule-icon apply__rule-icon--warn">
                        <hy-icon
                            name="/static/icons/order.png"
 :size="16"
                        />
                    </view>
                    <text>平台不代收货款，请当面验货后自行付款</text>
                </view>
                <view class="apply__rule">
                    <view class="apply__rule-icon">
                        <hy-icon
                            name="/static/icons/time.png"
                            color="var(--primary, #3d7eff)"
                            :size="16"
                        />
                    </view>
                    <text
                        >卖家 24
                        小时内未确认，订单自动过期，不产生任何费用</text
                    >
                </view>
            </view>

            <!-- 留言 -->
            <view class="apply__card">
                <view class="apply__card-title">给卖家留言（选填）</view>
                <hy-textarea
                    v-model="remark"
                    placeholder="如：希望明天中午在食堂门口交易"
                    :maxlength="100"
                    count
                    auto-height
                ></hy-textarea>
            </view>

            <!-- 强制安全承诺 -->
            <view class="apply__card apply__promise">
                <view class="apply__card-title">交易安全承诺（必读必勾）</view>
                <hy-checkbox-group
                    v-model="promises"
                    placement="column"
                    icon-placement="left"
                >
                    <view
                        v-for="(item, i) in SAFETY_PROMISES"
                        :key="i"
                        class="apply__promise-item"
                    >
                        <hy-checkbox-item
                            :value="`p${i + 1}`"
                            :label="item"
                        ></hy-checkbox-item>
                    </view>
                </hy-checkbox-group>
                <view class="apply__promise-tip">
                    <hy-icon
                        name="/static/icons/warning.png"
                        color="var(--warning, #f9ae3d)"
                        :size="14"
                    />
                    <text>三项承诺须全部勾选后才能提交申请</text>
                </view>
            </view>

            <!-- 提交 -->
            <view class="apply__footer">
                <hy-button
                    text="提交购买申请"
                    shape="circle"
                    color="var(--primary, #3d7eff)"
                    :disabled="!allPromised"
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
@use '../../styles/design.scss' as *;
.apply {
    min-height: 100vh;
    padding: 24rpx 24rpx 200rpx;
    box-sizing: border-box;

    &__goods {
        @include hy-card(20rpx);
        display: flex;
        gap: 20rpx;
        padding: 24rpx;
        animation: apply-fade-up 0.45s ease both;
    }

    &__goods-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10rpx;
    }

    &__goods-title {
        font-size: 28rpx;
        font-weight: 500;
        color: var(--hy-text-color, #000000);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
    }

    &__goods-meta {
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin-top: 24rpx;
        animation: apply-fade-up 0.45s ease 0.06s both;
    }

    &__card-title {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 16rpx;
    }

    &__rule {
        display: flex;
        align-items: flex-start;
        gap: 14rpx;
        font-size: 25rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
        margin-bottom: 14rpx;

        &:last-child {
            margin-bottom: 0;
        }
    }

    &__rule-icon {
        @include hy-icon-badge(44rpx, 12rpx);
        margin-top: 2rpx;

        &--warn {
            background: var(--warning-light, rgba(249, 174, 61, 0.1));
        }
    }

    &__promise {
        border: 1rpx solid var(--warning, #f9ae3d);
        background: var(--warning-light, rgba(249, 174, 61, 0.06));
    }

    &__promise-item {
        padding: 14rpx 0;
        border-bottom: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));

        &:last-child {
            border-bottom: none;
        }
    }

    &__promise-tip {
        margin-top: 16rpx;
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--warning, #f9ae3d);
    }

    &__footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 16rpx 24rpx;
        @include hy-safe-bottom(16rpx);
        background: var(--hy-background--container, #ffffff);
        box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
    }
}

@keyframes apply-fade-up {
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
