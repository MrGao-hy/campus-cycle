<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getFeeSummaryApi } from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '我的',
    },
});

const toast = useToast();
const userStore = useUserStore();

const unpaidAmount = ref(0);
const unpaidCount = ref(0);

onShow(() => {
    if (!userStore.hasLogin) return;
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
const goRecords = () => uni.navigateTo({ url: '/pages/complaint/Record' });
const goSchool = () => uni.navigateTo({ url: '/pages/school/Index' });
const goProfile = () => uni.navigateTo({ url: '/pages/profile/Index' });
const goLogin = () => uni.navigateTo({ url: '/pages/login/Index' });

const logout = () => {
    uni.showModal({
        title: '退出登录',
        content: '确定退出当前账号吗？',
        success: res => {
            if (res.confirm) {
                userStore.logout();
                uni.reLaunch({ url: '/pages/login/Index' });
            }
        },
    });
};
</script>

<template>
    <the-root-pages>
        <view class="mine">
            <!-- 未登录引导 -->
            <view v-if="!userStore.hasLogin" class="mine__login-guide">
                <view class="mine__login-logo">
                    <hy-icon
                        name="/static/icons/shield.png"
                        :size="34"
                    />
                </view>
                <text class="mine__login-title">登录后开启校园二手交易</text>
                <text class="mine__login-desc"
                    >同校实名认证 · 平台订单保障 · 交易更放心</text
                >
                <hy-button
                    text="微信一键登录"
                    color="#07c160"
                    shape="circle"
                    @click="goLogin"
                ></hy-button>
                <text class="mine__login-link" @tap="goSchool"
                    >先选择学校，逛逛再说</text
                >
            </view>

            <!-- 用户信息 -->
            <view v-else class="mine__user">
                <view class="mine__user-decor"></view>
                <view class="mine__user-decor mine__user-decor--2"></view>
                <!-- 头像：已设置头像显示图片；未设置显示默认灰人形图标；
                     点击进入资料编辑（微信 chooseAvatar 换头像 + 上传） -->
                <image
                    v-if="userStore.userInfo?.avatar"
                    :src="userStore.userInfo.avatar"
                    class="mine__avatar"
                    mode="aspectFill"
                    @tap="goProfile"
                />
                <image
                    v-else
                    src="/static/icons/user.png"
                    class="mine__avatar"
                    mode="aspectFill"
                    @tap="goProfile"
                />
                <view class="mine__user-info">
                    <view class="mine__nickname">
                        {{ userStore.userInfo?.nickname || '未登录' }}
                        <hy-tag label="已认证" type="success" size="mini" />
                    </view>
                    <view class="mine__sub" @tap="goSchool">
                        <hy-icon
                            name="/static/icons/school-cap.png"
                            color="var(--hy-text-color--3, #929295)"
                            :size="16"
                        />
                        <text
                            >{{
                                userStore.school?.name || '选择学校'
                            }}（点击切换）</text
                        >
                    </view>
                    <view class="mine__stats">
                        <text
                            >信用分
                            {{ userStore.userInfo?.creditScore ?? '-' }}</text
                        >
                        <text class="mine__stats-divider">|</text>
                        <text
                            >成功交易
                            {{ userStore.userInfo?.successCount ?? 0 }} 单</text
                        >
                    </view>
                </view>
                <view class="mine__user-edit" @tap="goProfile">
                    <hy-icon
                        name="/static/icons/setting-white.png"
                        :size="18"
                    />
                </view>
            </view>

            <!-- 欠费提示 -->
            <view
                v-if="userStore.hasLogin && unpaidAmount > 0"
                class="mine__fee-warn"
                @tap="goFee"
            >
                <hy-icon
                    name="/static/icons/warning.png"
                    color="var(--hy-error, #f56c6c)"
                    :size="16"
                />
                <text class="mine__fee-text"
                    >有 {{ unpaidAmount }} 元手续费未结清（{{
                        unpaidCount
                    }}
                    笔），结清前无法发布新商品</text
                >
                <text class="mine__fee-link">去处理 ›</text>
            </view>

            <!-- 交易/服务/退出（仅登录可见） -->
            <template v-if="userStore.hasLogin">
                <!-- 交易入口 -->
                <view class="mine__group-title">我的交易</view>
            <view class="mine__group">
                <view class="mine__item" @tap="goOrders">
                    <view class="mine__item-icon"
                        ><hy-icon
                            name="/static/icons/cart.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">我买到的</text>
                        <text class="mine__item-sub">购买申请与订单进度</text>
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="goOrders">
                    <view
                        class="mine__item-icon mine__item-icon--warn"
                        ><hy-icon
                            name="/static/icons/sell.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">我卖出的</text>
                        <text class="mine__item-sub"
                            >待确认申请与手续费账单</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="goMyGoods">
                    <view
                        class="mine__item-icon mine__item-icon--green"
                        ><hy-icon
                            name="/static/icons/picture.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">我发布的</text>
                        <text class="mine__item-sub"
                            >在售 / 交易中 / 已售出（置灰）</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="goPublish">
                    <view class="mine__item-icon"
                        ><hy-icon
                            name="/static/icons/plus.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">发布商品</text>
                        <text class="mine__item-sub"
                            >第一笔成功交易免手续费</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
            </view>

            <!-- 服务入口 -->
            <view class="mine__group-title">更多服务</view>
            <view class="mine__group">
                <view class="mine__item" @tap="goFee">
                    <view class="mine__item-icon mine__item-icon--red"
                        ><hy-icon
                            name="/static/icons/bill.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">手续费账单</text>
                    </view>
                    <text v-if="unpaidAmount > 0" class="mine__fee-amount"
                        >待缴 ￥{{ unpaidAmount }}</text
                    >
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="goSecurity">
                    <view
                        class="mine__item-icon mine__item-icon--green"
                        ><hy-icon
                            name="/static/icons/shield.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">安全中心</text>
                        <text class="mine__item-sub"
                            >交易守则 · 举报 · 紧急求助</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="goRecords">
                    <view class="mine__item-icon mine__item-icon--red"
                        ><hy-icon
                            name="/static/icons/complaint.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">投诉与申诉</text>
                        <text class="mine__item-sub"
                            >投诉记录 · 申诉进度 · 处理结果</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
            </view>

            <view class="mine__logout">
                <hy-button
                    text="退出登录"
                    plain
                    type="info"
                    shape="circle"
                    :custom-style="{ height: '88rpx' }"
                    @click="logout"
                ></hy-button>
            </view>
            </template>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.mine {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 24rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));

    /* 高度链：小程序 tabBar 页 provider 高度 auto（min-height:100%），
       子级任何百分比高度（height/min-height:100%）都会解析为 auto，
       导致 logout margin-top:auto 无剩余空间（底部 110px 空白）；
       改用视口计算：100vh 含 tabBar，减 tabBar 实际高（--window-bottom，
       uni 在 MP 端注入，含安全区，比 100rpx+safe 估算精确）= 可视区高度，
       overflow-y 兜底内容超高时内部滚动（page 已禁页面滚动） */
    /* #ifdef MP-WEIXIN */
    height: calc(100vh - var(--window-bottom, 0px));
    overflow-y: auto;
    /* #endif */
    /* #ifdef H5 */
    min-height: calc(100vh - var(--window-bottom, 0px));
    /* #endif */

    &__user {
        flex-shrink: 0;
        position: relative;
        display: flex;
        align-items: center;
        gap: 24rpx;
        @include hy-gradient-header(135deg, 24rpx);
        padding: 36rpx 32rpx;
        box-shadow: 0 12rpx 32rpx rgba(30, 60, 120, 0.18);
        animation: mine-fade-up 0.45s ease-out both;
        overflow: hidden;
    }

    &__avatar {
        flex-shrink: 0;
        width: 112rpx;
        height: 112rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
    }

    &__login-guide {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        @include hy-gradient-header(135deg, 24rpx);
        padding: 72rpx 48rpx 64rpx;
        gap: 20rpx;
        box-shadow: 0 12rpx 32rpx rgba(30, 60, 120, 0.18);
        animation: mine-fade-up 0.45s ease-out both;
    }

    &__login-logo {
        width: 120rpx;
        height: 120rpx;
        border-radius: 36rpx;
        background: rgba(255, 255, 255, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8rpx;
    }

    &__login-title {
        font-size: 34rpx;
        font-weight: 600;
        color: #fff;
    }

    &__login-desc {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.75);
    }

    &__login-link {
        margin-top: 12rpx;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.85);
        text-decoration: underline;
    }

    &__user-decor {
        position: absolute;
        width: 240rpx;
        height: 240rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        right: -60rpx;
        top: -100rpx;

        &--2 {
            width: 120rpx;
            height: 120rpx;
            right: 70rpx;
            bottom: -70rpx;
            top: auto;
            background: rgba(255, 255, 255, 0.06);
        }
    }

    &__user-edit {
        position: relative;
        z-index: 1;
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.16);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    &__group-title {
        flex-shrink: 0;
        font-size: 26rpx;
        font-weight: 600;
        color: var(--hy-text-color--3, #929295);
        margin: 20rpx 8rpx 4rpx;
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
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 10rpx;
        background: var(--hy-error--light, rgba(245, 108, 108, 0.08));
        border: 1rpx solid var(--hy-error, #f56c6c);
        border-radius: 16rpx;
        padding: 18rpx 20rpx;
        margin-top: 20rpx;
        animation: mine-fade-up 0.45s ease-out 0.08s both;
    }

    &__fee-text {
        flex: 1;
        font-size: 23rpx;
        color: var(--hy-error, #f56c6c);
        line-height: 1.5;
    }

    &__fee-link {
        font-size: 23rpx;
        color: var(--hy-error, #f56c6c);
        flex-shrink: 0;
    }

    &__group {
        flex-shrink: 0;
        @include hy-card(20rpx);
        overflow: hidden;
        margin-top: 12rpx;
    }

    &__item {
        display: flex;
        align-items: center;
        gap: 20rpx;
        padding: 26rpx 28rpx;
        position: relative;

        & + & {
            border-top: 1rpx solid #f2f3f5;
        }
    }

    &__item-icon {
        flex-shrink: 0;
        width: 72rpx;
        height: 72rpx;
        border-radius: 18rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(61, 126, 255, 0.1);

        &--warn {
            background: rgba(249, 174, 61, 0.12);
        }

        &--green {
            background: rgba(7, 193, 96, 0.12);
        }

        &--red {
            background: rgba(245, 108, 108, 0.12);
        }
    }

    &__item-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4rpx;
        min-height: 0;
    }

    &__item-title {
        font-size: 28rpx;
        font-weight: 500;
        color: #1f2329;
        line-height: 1.4;
    }

    &__item-sub {
        font-size: 22rpx;
        color: #929295;
        line-height: 1.4;
    }

    &__fee-amount {
        font-size: 24rpx;
        color: var(--hy-error, #f56c6c);
        font-weight: 600;
        flex-shrink: 0;
    }

    &__logout {
        margin-top: auto;
        padding-top: 24rpx;
    }
}

@keyframes mine-fade-up {
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
