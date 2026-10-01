<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getFeeSummaryApi, payFeeBillApi } from '@/api';
import { useToast } from '@hy-app/ui';
import { fmtAmount, fmtFullTime } from '@/utils/format';
import type { FeeSummary } from '@/types';
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '手续费账单',
    },
});

const toast = useToast();
const summary = ref<FeeSummary | null>(null);
const payingId = ref('');

const load = async () => {
    summary.value = await getFeeSummaryApi();
};
onShow(load);

const pay = async (billId: string) => {
    payingId.value = billId;
    try {
        await payFeeBillApi(billId);
        toast.success('支付成功');
        load();
    } catch (e) {
        toast.error('支付失败');
    } finally {
        payingId.value = '';
    }
};
</script>

<template>
    <the-root-pages>
        <view v-if="summary" class="fee">
            <!-- 未缴汇总 -->
            <view
                class="fee__summary"
                :class="{ 'fee__summary--warn': summary.unpaidAmount > 0 }"
            >
                <text class="fee__summary-label">{{
                    summary.unpaidAmount > 0 ? '待缴手续费' : '暂无待缴账单'
                }}</text>
                <view class="fee__summary-amount-row">
                    <text class="fee__summary-symbol">￥</text>
                    <text class="fee__summary-amount">{{
                        fmtAmount(summary.unpaidAmount)
                    }}</text>
                </view>
                <text v-if="summary.unpaidCount" class="fee__summary-tip"
                    >共
                    {{ summary.unpaidCount }}
                    笔未结清，未结清手续费前禁止发布新商品</text
                >
                <text v-else class="fee__summary-tip"
                    >已全部结清，可正常发布商品</text
                >
            </view>

            <!-- 计费规则 -->
            <view class="fee__card">
                <view class="fee__card-title">计费规则</view>
                <view class="fee__rule"
                    ><text class="fee__rule-no">1</text
                    ><text>卖家第一笔成功交易免手续费</text></view
                >
                <view class="fee__rule"
                    ><text class="fee__rule-no">2</text
                    ><text
                        >后续按成交价 6% 收取，最低 1 元、最高 20 元</text
                    ></view
                >
                <view class="fee__rule"
                    ><text class="fee__rule-no">3</text
                    ><text>手续费由卖家承担，买家免费</text></view
                >
                <view class="fee__rule"
                    ><text class="fee__rule-no">4</text
                    ><text
                        >平台不代收货款，账单仅在订单最终完成后生成</text
                    ></view
                >
            </view>

            <!-- 账单列表 -->
            <view class="fee__card">
                <view class="fee__card-title">账单明细</view>
                <view
                    v-for="bill in summary.bills"
                    :key="bill.id"
                    class="fee__bill"
                >
                    <view class="fee__bill-head">
                        <text class="fee__bill-title">{{
                            bill.goodsTitle
                        }}</text>
                        <hy-tag
                            :label="
                                bill.status === 'PAID' ? '已支付' : '待支付'
                            "
                            :type="bill.status === 'PAID' ? 'success' : 'error'"
                            size="small"
                            :plain="bill.status !== 'PAID'"
                        />
                    </view>
                    <view class="fee__bill-row"
                        ><text>关联订单</text
                        ><text>{{ bill.orderId }}</text></view
                    >
                    <view class="fee__bill-row"
                        ><text>成交价</text
                        ><text>￥{{ fmtAmount(bill.dealPrice) }}</text></view
                    >
                    <view class="fee__bill-row">
                        <text
                            >手续费（{{ (bill.rate * 100).toFixed(0) }}%）</text
                        >
                        <text class="fee__bill-amount">
                            {{
                                bill.amount === 0
                                    ? '免费'
                                    : `￥${fmtAmount(bill.amount)}`
                            }}
                            <text
                                v-if="bill.freeReason"
                                class="fee__bill-free"
                                >{{ bill.freeReason }}</text
                            >
                        </text>
                    </view>
                    <view class="fee__bill-row">
                        <text>生成时间</text>
                        <text>{{ fmtFullTime(bill.createTime) }}</text>
                    </view>
                    <hy-button
                        v-if="bill.status === 'UNPAID'"
                        :text="payingId === bill.id ? '支付中...' : '立即支付'"
                        type="error"
                        size="small"
                        shape="circle"
                        :custom-style="{ marginTop: '16rpx' }"
                        :loading="payingId === bill.id"
                        @click="pay(bill.id)"
                    ></hy-button>
                </view>
                <hy-empty
                    v-if="!summary.bills.length"
                    mode="order"
                    description="暂无账单，完成交易后生成"
                ></hy-empty>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.fee {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;

    &__summary {
        background:
            linear-gradient(
                135deg,
                rgba(255, 255, 255, 0) 40%,
                rgba(255, 255, 255, 0.4) 100%
            ),
            var(--hy-success, #07c160);
        border-radius: 24rpx;
        padding: 40rpx 32rpx;
        color: #fff;
        box-shadow: 0 8rpx 28rpx rgba(7, 193, 96, 0.18);
        animation: fee-fade-up 0.45s ease both;

        &--warn {
            background:
                linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0) 40%,
                    rgba(255, 255, 255, 0.4) 100%
                ),
                var(--hy-error, #f56c6c);
            box-shadow: 0 8rpx 28rpx rgba(245, 108, 108, 0.18);
        }
    }

    &__summary-label {
        font-size: 26rpx;
        opacity: 0.92;
    }

    &__summary-amount-row {
        display: flex;
        align-items: baseline;
        margin-top: 12rpx;
    }

    &__summary-symbol {
        font-size: 32rpx;
        font-weight: 600;
    }

    &__summary-amount {
        font-size: 72rpx;
        font-weight: 700;
        line-height: 1.1;
    }

    &__summary-tip {
        display: block;
        margin-top: 12rpx;
        font-size: 22rpx;
        opacity: 0.9;
    }

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin-top: 24rpx;
        animation: fee-fade-up 0.45s ease 0.06s both;
    }

    &__card-title {
        font-size: 29rpx;
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

    &__rule-no {
        width: 32rpx;
        height: 32rpx;
        border-radius: 50%;
        background: var(--primary-light, rgba(61, 126, 255, 0.08));
        color: var(--primary, #3d7eff);
        font-size: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 4rpx;
    }

    &__bill {
        background: var(--hy-background, #f8f8f8);
        border-radius: 16rpx;
        padding: 20rpx;
        margin-bottom: 20rpx;

        &:last-child {
            margin-bottom: 0;
        }
    }

    &__bill-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16rpx;
        margin-bottom: 12rpx;
    }

    &__bill-title {
        font-size: 27rpx;
        font-weight: 500;
        color: var(--hy-text-color, #000000);
    }

    &__bill-row {
        display: flex;
        justify-content: space-between;
        gap: 20rpx;
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
        padding: 6rpx 0;

        text:last-child {
            color: var(--hy-text-color--2, #46464a);
            text-align: right;
        }
    }

    &__bill-amount {
        font-weight: 600;
        color: var(--hy-error, #f56c6c) !important;
    }

    &__bill-free {
        font-size: 20rpx;
        font-weight: 400;
        color: var(--hy-success, #07c160);
        margin-left: 8rpx;
    }
}

@keyframes fee-fade-up {
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
