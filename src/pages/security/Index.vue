<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import SafetyTips from '@/components/SafetyTips.vue';
import { useToast } from '@hy-app/ui';
import { SAFETY_PROMISES } from '@/types';
import { ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '安全中心',
    },
});

const toast = useToast();

/** 跳转投诉维权页（通用举报，不带订单） */
const goComplaint = () => {
    uni.navigateTo({ url: '/pages/complaint/Index' });
};

/** 跳转投诉/申诉记录 */
const goRecords = () => {
    uni.navigateTo({ url: '/pages/complaint/Record' });
};

const callSecurity = () => {
    // mock：学校保卫处电话
    uni.makePhoneCall({
        phoneNumber: '027-87541110',
        fail: () => toast.info('当前环境无法拨打电话'),
    });
};
const callPolice = () => {
    uni.makePhoneCall({
        phoneNumber: '110',
        fail: () => toast.info('当前环境无法拨打电话'),
    });
};
</script>

<template>
    <the-root-pages>
        <view class="sec">
            <!-- 强制安全承诺（购买确认页同款） -->
            <view class="sec__card">
                <view class="sec__card-title"
                    >交易安全承诺（购买时强制勾选）</view
                >
                <view
                    v-for="(item, i) in SAFETY_PROMISES"
                    :key="i"
                    class="sec__promise"
                >
                    <view class="sec__promise-icon">
                        <hy-icon
                            name="check-mask"
                            color="var(--hy-success, #07c160)"
                            :size="16"
                        />
                    </view>
                    <text>{{ item }}</text>
                </view>
            </view>

            <!-- 风险提醒（商品/订单/消息页同步展示） -->
            <view class="sec__card">
                <view class="sec__card-title">六条风险提醒</view>
                <safety-tips></safety-tips>
            </view>

            <!-- 应急处理 -->
            <view class="sec__card">
                <view class="sec__card-title">应急处理</view>
                <hy-cell :border="false">
                    <hy-cell-item
                        title="投诉用户或订单"
                        sub="遇到欺诈、违规行为，立即投诉维权"
                        clickable
                        is-right-icon
                        @click="goComplaint"
                    >
                        <template #icon>
                            <view class="sec__entry-icon sec__entry-icon--red">
                                <hy-icon
                                    name="warning"
                                    color="var(--hy-error, #f56c6c)"
                                    :size="20"
                                ></hy-icon>
                            </view>
                        </template>
                    </hy-cell-item>
                    <hy-cell-item
                        title="投诉 / 申诉记录"
                        sub="处理进度 · 投诉结果 · 申辩记录"
                        clickable
                        is-right-icon
                        @click="goRecords"
                    >
                        <template #icon>
                            <view class="sec__entry-icon">
                                <hy-icon
                                    name="order"
                                    color="var(--primary, #3d7eff)"
                                    :size="20"
                                ></hy-icon>
                            </view>
                        </template>
                    </hy-cell-item>
                    <hy-cell-item
                        title="联系学校保卫处"
                        sub="027-8754-1110（mock）"
                        clickable
                        is-right-icon
                        @click="callSecurity"
                    >
                        <template #icon>
                            <view class="sec__entry-icon">
                                <hy-icon
                                    name="telephone"
                                    color="var(--primary, #3d7eff)"
                                    :size="20"
                                ></hy-icon>
                            </view>
                        </template>
                    </hy-cell-item>
                    <hy-cell-item
                        title="报警求助"
                        sub="遇到人身安全威胁立即拨打 110"
                        clickable
                        is-right-icon
                        @click="callPolice"
                    >
                        <template #icon>
                            <view class="sec__entry-icon sec__entry-icon--red">
                                <hy-icon
                                    name="notice-fill"
                                    color="var(--hy-error, #f56c6c)"
                                    :size="20"
                                ></hy-icon>
                            </view>
                        </template>
                    </hy-cell-item>
                </hy-cell>
            </view>

            <!-- 平台机制说明 -->
            <view class="sec__card">
                <view class="sec__card-title">平台安全保障机制</view>
                <view class="sec__mech"
                    ><text class="sec__mech-no">1</text
                    ><text>卖家确认前不展示任何联系方式</text></view
                >
                <view class="sec__mech"
                    ><text class="sec__mech-no">2</text
                    ><text>全部沟通留在站内，聊天记录可作为申诉凭证</text></view
                >
                <view class="sec__mech"
                    ><text class="sec__mech-no">3</text
                    ><text
                        >买家确认后进入 48 小时申诉期，卖家可提异议</text
                    ></view
                >
                <view class="sec__mech"
                    ><text class="sec__mech-no">4</text
                    ><text>订单完成商品仅置灰不隐藏，便于溯源</text></view
                >
                <view class="sec__mech"
                    ><text class="sec__mech-no">5</text
                    ><text>未结清手续费的卖家将被限制发布新商品</text></view
                >
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.sec {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin-bottom: 24rpx;
        animation: sec-fade-up 0.45s ease both;

        &:nth-child(2) {
            animation-delay: 0.06s;
        }

        &:nth-child(3) {
            animation-delay: 0.12s;
        }

        &:nth-child(4) {
            animation-delay: 0.18s;
        }
    }

    &__card-title {
        font-size: 29rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 20rpx;
    }

    &__promise {
        display: flex;
        align-items: flex-start;
        gap: 14rpx;
        font-size: 26rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
        padding: 10rpx 0;
    }

    &__promise-icon {
        @include hy-icon-badge(44rpx, 12rpx);
        margin-top: 2rpx;
        background: var(--hy-success--light, rgba(7, 193, 96, 0.1));
    }

    &__entry-icon {
        @include hy-icon-badge(64rpx, 18rpx);

        &--red {
            background: var(--hy-error--light, rgba(245, 108, 108, 0.1));
        }
    }

    &__mech {
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

    &__mech-no {
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
}

@keyframes sec-fade-up {
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
