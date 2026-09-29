<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { ref } from 'vue';
import { wxLoginMockApi } from '@/api';

definePage({
    style: {
        navigationBarTitleText: '登录',
        navigationStyle: 'custom'
    }
});

const toast = useToast();
const userStore = useUserStore();
const loading = ref(false);

/** 微信一键登录（mock：真实环境走 uni.login 获取 code 换 token） */
const handleLogin = async () => {
    if (loading.value) return;
    loading.value = true;
    toast.loading('登录中...');
    try {
        const res = await wxLoginMockApi();
        userStore.setLogin(res.token, res.userInfo);
        toast.close();
        toast.success('登录成功');
        // 未选择学校 → 先选择并确认学校
        if (!userStore.hasSchool) {
            setTimeout(() => uni.navigateTo({ url: '/pages/school/Index' }), 400);
        } else {
            setTimeout(() => uni.switchTab({ url: '/pages/index/Index' }), 400);
        }
    } catch (e) {
        toast.close();
        toast.error('登录失败，请重试');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <the-root-pages>
        <view class="login">
            <view class="login__hero">
                <image class="login__logo" src="/static/logo.png" mode="aspectFit" />
                <text class="login__name">校园循环</text>
                <text class="login__slogan">同校二手循环 · 校内当面交易更放心</text>
            </view>

            <view class="login__features">
                <view class="login__feature">
                    <hy-icon name="security" color="var(--hy-primary-color)" :size="20" />
                    <text>本校学生实名认证</text>
                </view>
                <view class="login__feature">
                    <hy-icon name="shop" color="var(--hy-primary-color)" :size="20" />
                    <text>站内沟通 · 平台创建订单</text>
                </view>
                <view class="login__feature">
                    <hy-icon name="warning" color="var(--hy-primary-color)" :size="20" />
                    <text>线下交易安全管控</text>
                </view>
            </view>

            <view class="login__btn">
                <hy-button
                    text="微信一键登录"
                    color="#07c160"
                    shape="circle"
                    :loading="loading"
                    :custom-style="{ height: '96rpx', fontSize: '32rpx' }"
                    @click="handleLogin"
                ></hy-button>
            </view>

            <view class="login__safety">
                <hy-icon name="notice" color="var(--hy-info-color)" :size="14" />
                <text>登录即代表同意《用户协议》与《交易安全须知》，线下交易请当面验货、保留凭证</text>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.login {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 160rpx 60rpx 80rpx;
    box-sizing: border-box;

    &__hero {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    &__logo {
        width: 160rpx;
        height: 160rpx;
        border-radius: 36rpx;
    }

    &__name {
        margin-top: 32rpx;
        font-size: 44rpx;
        font-weight: 700;
        color: var(--hy-main-color, #303133);
    }

    &__slogan {
        margin-top: 16rpx;
        font-size: 26rpx;
        color: var(--hy-info-color, #909193);
    }

    &__features {
        margin-top: 100rpx;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 28rpx;
        padding: 0 40rpx;
        box-sizing: border-box;
    }

    &__feature {
        display: flex;
        align-items: center;
        gap: 16rpx;
        font-size: 28rpx;
        color: var(--hy-content-color, #606266);
    }

    &__btn {
        width: 100%;
        margin-top: auto;
        padding-top: 100rpx;
    }

    &__safety {
        margin-top: 32rpx;
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--hy-info-color, #909193);
        line-height: 1.6;
    }
}
</style>
