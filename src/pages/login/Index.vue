<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { useUserStore } from '@/store';
import { useToast } from '@/utils/toast';
import { computed, ref } from 'vue';
import { wxLoginApi } from '@/api';

definePage({
    style: {
        navigationBarTitleText: '登录',
        navigationStyle: 'custom',
    },
});

const toast = useToast();
const userStore = useUserStore();
const loading = ref(false);

/** 协议勾选状态（未勾选不允许登录） */
const agreed = ref(false);
const agreeShake = ref(false);

/** 协议弹窗 */
const agreementShow = ref(false);
const agreementKey = ref<'user' | 'privacy'>('privacy');

/** 微信隐私授权弹层（小程序端：拦截原生隐私弹窗，用与协议弹层一致的风格渲染） */
const privacyShow = ref(false);
// #ifdef MP-WEIXIN
let privacyResolveFn: ((res: any) => void) | null = null;
onLoad(() => {
    if (typeof wx !== 'undefined' && (wx as any).onNeedPrivacyAuthorization) {
        (wx as any).onNeedPrivacyAuthorization(
            (resolve: (res: any) => void) => {
                privacyResolveFn = resolve;
                privacyShow.value = true;
            }
        );
    }
});
const agreePrivacy = () => {
    if (privacyResolveFn) {
        privacyResolveFn({ event: 'agree', buttonId: 'privacy-agree-btn' });
    }
    privacyResolveFn = null;
    privacyShow.value = false;
};
// #endif

const AGREEMENTS = {
    user: {
        title: '校园循环用户服务协议',
        sections: [
            {
                heading: '一、账号与认证',
                text: '本平台面向在校师生开放，需通过学校确认后使用。请使用真实身份信息，不得出借、转让账号。',
            },
            {
                heading: '二、交易规则',
                text: '买卖双方通过站内沟通达成意向，由买家提交购买申请、卖家确认后平台创建订单，双方线下当面交易。',
            },
            {
                heading: '三、线下交易安全',
                text: '请选择白天、校内、有人、照明良好的公共区域交易；当面验货确认无误后再支付；不向陌生人提供验证码、银行卡密码或身份证照片。',
            },
            {
                heading: '四、订单与申诉',
                text: '买家确认完成后进入 48 小时申诉期；交易未成功可取消订单，商品恢复在售；存在争议可提交平台申诉处理。',
            },
            {
                heading: '五、手续费',
                text: '卖家第一笔成功交易免手续费，后续按成交价 6% 收取（最低 1 元、最高 20 元），由卖家承担；未结清手续费将限制发布新商品。',
            },
            {
                heading: '六、免责声明',
                text: '平台仅提供信息撮合与订单管理，不代收货款。因线下交易产生的争议，双方应友好协商，必要时可联系学校保卫处或报警。',
            },
        ],
    },
    privacy: {
        title: '微信小程序隐私保护指引',
        sections: [
            {
                heading: '1. 开发者处理的信息',
                text: '为完成微信登录与账号创建，开发者会处理你的微信登录凭证（OpenID）、微信昵称与头像，以及你主动填写的学校信息。',
            },
            {
                heading: '2. 信息的使用',
                text: '上述信息仅用于：创建与识别你的账号、展示交易身份、保障同校交易安全、生成并管理交易订单，不用于任何与交易无关的用途。',
            },
            {
                heading: '3. 信息的存储',
                text: '信息存储于中华人民共和国境内的服务器，采用加密传输与访问控制措施，存储期限不超过实现目的所必需的最短时间。',
            },
            {
                heading: '4. 信息共享',
                text: '除法律法规要求或取得你的明确授权外，开发者不会向任何第三方共享、转让、公开披露你的个人信息。',
            },
            {
                heading: '5. 你的权利',
                text: '你可以在微信「设置-小程序设置」中管理授权、撤回同意或删除小程序；如需注销账号，可通过页面内「退出登录」并联系平台处理。',
            },
            {
                heading: '6. 联系我们',
                text: '如对本指引有任何疑问，可通过「安全中心-举报与反馈」联系平台处理。',
            },
        ],
    },
};

const currentAgreement = computed(() => AGREEMENTS[agreementKey.value]);

const openAgreement = (key: 'user' | 'privacy') => {
    agreementKey.value = key;
    agreementShow.value = true;
};

/** 协议弹窗内「同意并继续」 */
const agreeFromModal = () => {
    agreed.value = true;
    agreementShow.value = false;
};

/** 暂不登录，先逛逛（未登录态浏览首页） */
const goGuest = () => {
    uni.switchTab({ url: '/pages/index/Index' });
};

/** 未勾选协议时引导：抖动 + 轻震动 + 提示 */
const remindAgreement = () => {
    agreeShake.value = true;
    setTimeout(() => (agreeShake.value = false), 450);
    // #ifdef MP-WEIXIN
    uni.vibrateShort?.({ type: 'light' });
    // #endif
    toast.warning('请先阅读并勾选同意协议');
};

/** 微信一键登录：uni.login 取 code，后端 code2session 解析 openid 并换 token */
const handleLogin = async () => {
    if (loading.value) return;
    if (!agreed.value) {
        remindAgreement();
        return;
    }
    loading.value = true;
    toast.loading('登录中...');
    try {
        const { code } = await uni.login({ provider: 'weixin' });
        if (!code) throw new Error('未获取到微信登录 code');
        const res = await wxLoginApi(code);
        userStore.setLogin(res.token, res.userInfo);
        toast.close();
        toast.success('登录成功');
        // 同步学校：优先本地已选（未登录时选的），其次账号已绑定（userInfo.schoolId，
        // 后端登录/建号时已写库）——否则清缓存后重新登录会因 school 实体为空
        // 而被误判「未选校」，首页数据永不加载
        const schoolId = userStore.school?.id || res.userInfo.schoolId;
        if (schoolId) {
            try {
                const school = await confirmSchoolApi(schoolId);
                userStore.setSchool(school);
            } catch {
                /* 同步失败不阻塞登录，本地学校保留 */
            }
        }
        // 未选择学校 → 先选择并确认学校
        if (!userStore.hasSchool) {
            setTimeout(
                () => uni.navigateTo({ url: '/pages/school/Index' }),
                400
            );
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
            <!-- 顶部品牌渐变区 -->
            <view class="login__top">
                <view class="login__blob login__blob--a"></view>
                <view class="login__blob login__blob--b"></view>
                <view class="login__hero">
                    <view class="login__logo-wrap">
                        <image
                            class="login__logo"
                            src="/static/logo.png"
                            mode="aspectFit"
                        />
                    </view>
                    <text class="login__name">校园循环</text>
                    <text class="login__slogan"
                        >同校二手循环 · 校内当面交易更放心</text
                    >
                </view>
            </view>

            <!-- 信任信号卡 -->
            <view class="login__trust">
                <view class="login__trust-item">
                    <view class="login__trust-icon">
                        <hy-icon name="/static/icons/shield.png" :size="20" />
                    </view>
                    <view class="login__trust-text">
                        <text class="login__trust-title">本校学生实名认证</text>
                        <text class="login__trust-desc"
                            >确认学校后交易，同校更放心</text
                        >
                    </view>
                </view>
                <view class="login__trust-item">
                    <view class="login__trust-icon">
                        <hy-icon name="/static/icons/order.png" :size="20" />
                    </view>
                    <view class="login__trust-text">
                        <text class="login__trust-title">平台创建订单</text>
                        <text class="login__trust-desc"
                            >站内沟通全程留痕，纠纷可申诉</text
                        >
                    </view>
                </view>
                <view class="login__trust-item">
                    <view class="login__trust-icon">
                        <hy-icon
                            name="/static/icons/complaint.png"
                            :size="20"
                        />
                    </view>
                    <view class="login__trust-text">
                        <text class="login__trust-title">线下交易安全管控</text>
                        <text class="login__trust-desc"
                            >公共场所当面验货，48 小时申诉期</text
                        >
                    </view>
                </view>
            </view>

            <!-- 底部：协议勾选 + 登录按钮 -->
            <view class="login__bottom">
                <view
                    class="login__agree"
                    :class="{ 'login__agree--shake': agreeShake }"
                    @tap="agreed = !agreed"
                >
                    <view
                        class="login__checkbox"
                        :class="{ 'login__checkbox--on': agreed }"
                    >
                        <hy-icon
                            v-if="agreed"
                            name="/static/icons/check.png"
                            color="#fff"
                            :size="12"
                        />
                    </view>
                    <view class="login__agree-text">
                        <text>我已阅读并同意</text>
                        <text
                            class="login__agree-link"
                            @tap.stop="openAgreement('user')"
                            >《用户协议》</text
                        >
                        <text>和</text>
                        <text
                            class="login__agree-link"
                            @tap.stop="openAgreement('privacy')"
                            >《微信小程序隐私保护指引》</text
                        >
                    </view>
                </view>

                <hy-button
                    text="微信一键登录"
                    color="#07c160"
                    shape="circle"
                    :loading="loading"
                    :custom-style="{ height: '96rpx', fontSize: '32rpx' }"
                    @click="handleLogin"
                ></hy-button>

                <text class="login__guest" @tap="goGuest"
                    >暂不登录，先逛逛</text
                >

                <view class="login__safety">
                    <hy-icon name="/static/icons/order.png" :size="14" />
                    <text
                        >线下交易请当面验货、保留凭证，遇到异常立即终止交易</text
                    >
                </view>
            </view>
        </view>

        <!-- 协议内容弹窗（自定义弹层：hy-modal 组件链在小程序端多层 virtualHost 嵌套不可控，改为纯 view + fixed） -->
        <view
            v-if="agreementShow"
            class="login__modal-mask"
            @tap="agreementShow = false"
        >
            <view class="login__modal" @tap.stop>
                <view class="login__modal-head">
                    <text class="login__modal-title">{{
                        currentAgreement.title
                    }}</text>
                    <view
                        class="login__modal-close"
                        @tap="agreementShow = false"
                    >
                        <hy-icon
                            name="/static/icons/close.png"
                            color="#929295"
                            :size="14"
                        ></hy-icon>
                    </view>
                </view>
                <scroll-view class="login__agreement" scroll-y>
                    <view
                        v-for="(s, i) in currentAgreement.sections"
                        :key="i"
                        class="login__agreement-item"
                    >
                        <text class="login__agreement-heading">{{
                            s.heading
                        }}</text>
                        <text class="login__agreement-text">{{ s.text }}</text>
                    </view>
                </scroll-view>
                <view class="login__agreement-btn">
                    <hy-button
                        text="同意并继续"
                        type="primary"
                        shape="circle"
                        @click="agreeFromModal"
                    ></hy-button>
                </view>
            </view>
        </view>

        <!-- 微信隐私授权弹层（自定义：拦截原生隐私弹窗，风格与协议弹层统一） -->
        <view v-if="privacyShow" class="login__modal-mask" @tap.stop>
            <view class="login__modal login__privacy" @tap.stop>
                <view class="login__modal-head">
                    <text class="login__modal-title">隐私保护指引</text>
                </view>
                <view class="login__privacy-body">
                    <text class="login__privacy-text"
                        >为完成微信登录与账号创建，我们将处理你的微信登录凭证、微信昵称与头像，以及你主动填写的学校信息。上述信息仅用于创建与识别账号、展示交易身份、保障同校交易安全，存储于境内服务器，不会向任何第三方共享。</text
                    >
                    <text
                        class="login__privacy-link"
                        @tap="openAgreement('privacy')"
                        >查看完整《隐私保护指引》</text
                    >
                </view>
                <view class="login__agreement-btn">
                    <hy-button
                        text="同意并继续"
                        type="primary"
                        shape="circle"
                        @click="agreePrivacy"
                    ></hy-button>
                </view>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.login {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    /* 顶部品牌渐变 */
    &__top {
        position: relative;
        padding: 140rpx 60rpx 120rpx;
        background: linear-gradient(
            160deg,
            #3d7eff 0%,
            #6fa0ff 78%,
            #b8d0ff 100%
        );
        border-radius: 0 0 64rpx 64rpx;
        overflow: hidden;
    }

    /* 装饰圆 */
    &__blob {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);

        &--a {
            width: 320rpx;
            height: 320rpx;
            top: -100rpx;
            right: -80rpx;
        }

        &--b {
            width: 200rpx;
            height: 200rpx;
            bottom: -40rpx;
            left: -60rpx;
            background: rgba(255, 255, 255, 0.08);
        }
    }

    &__hero {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: login-fade-down 0.55s ease-out both;
    }

    &__logo-wrap {
        width: 168rpx;
        height: 168rpx;
        border-radius: 40rpx;
        background: #fff;
        box-shadow: 0 16rpx 40rpx rgba(0, 60, 160, 0.25);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__logo {
        width: 132rpx;
        height: 132rpx;
    }

    &__name {
        margin-top: 28rpx;
        font-size: 48rpx;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 4rpx;
    }

    &__slogan {
        margin-top: 14rpx;
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.85);
    }

    /* 信任信号卡：上叠渐变区 */
    &__trust {
        position: relative;
        margin: -76rpx 40rpx 0;
        padding: 12rpx 32rpx;
        background: var(--hy-background--container, #ffffff);
        border-radius: 24rpx;
        box-shadow: 0 12rpx 32rpx rgba(30, 60, 120, 0.1);
        animation: login-fade-up 0.55s ease-out 0.15s both;
    }

    &__trust-item {
        display: flex;
        align-items: center;
        gap: 20rpx;
        padding: 22rpx 0;

        & + & {
            border-top: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));
        }
    }

    &__trust-icon {
        width: 64rpx;
        height: 64rpx;
        border-radius: 18rpx;
        background: var(--primary-light, rgba(61, 126, 255, 0.08));
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    &__trust-text {
        display: flex;
        flex-direction: column;
        gap: 4rpx;
    }

    &__trust-title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
    }

    &__trust-desc {
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    /* 底部操作区 */
    &__bottom {
        margin-top: auto;
        padding: 48rpx 40rpx calc(56rpx + env(safe-area-inset-bottom));
        display: flex;
        flex-direction: column;
        animation: login-fade-up 0.55s ease-out 0.3s both;
    }

    &__agree {
        display: flex;
        align-items: flex-start;
        gap: 12rpx;
        margin-bottom: 32rpx;
        transition: opacity 0.25s ease;

        &--shake {
            animation: login-shake 0.45s ease;
        }
    }

    &__checkbox {
        width: 34rpx;
        height: 34rpx;
        border-radius: 10rpx;
        border: 2rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));
        background: var(--hy-background--container, #ffffff);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 2rpx;
        transition: all 0.25s ease;

        &--on {
            border-color: var(--primary, #3d7eff);
            background: var(--primary, #3d7eff);
        }
    }

    &__agree-text {
        font-size: 24rpx;
        line-height: 1.6;
        color: var(--hy-text-color--3, #929295);
    }

    &__agree-link {
        color: var(--primary, #3d7eff);
    }

    &__guest {
        margin-top: 28rpx;
        font-size: 26rpx;
        color: var(--hy-text-color--3, #929295);
        text-align: center;
        text-decoration: underline;
    }

    &__safety {
        margin-top: 28rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    /* 协议弹窗 */
    &__modal-mask {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* 微信隐私授权弹层 */
    &__privacy {
        padding-bottom: 36rpx;
    }

    &__privacy-body {
        padding: 24rpx 36rpx 0;
    }

    &__privacy-text {
        font-size: 26rpx;
        line-height: 1.8;
        color: #46464a;
    }

    &__privacy-link {
        display: inline-block;
        margin-top: 16rpx;
        font-size: 24rpx;
        color: var(--primary, #3d7eff);
    }

    &__modal {
        width: 620rpx;
        max-height: 74vh;
        background: #fff;
        border-radius: 24rpx;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: login-modal-in 0.25s ease-out both;
    }

    &__modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 32rpx 32rpx 8rpx;
        flex-shrink: 0;
    }

    &__modal-title {
        font-size: 30rpx;
        font-weight: 600;
        color: #1f2329;
    }

    &__modal-close {
        width: 48rpx;
        height: 48rpx;
        border-radius: 50%;
        background: #f2f3f5;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__agreement {
        max-height: 52vh;
        overflow-y: auto;
        text-align: left;
        padding: 16rpx 32rpx 0;
    }

    &__agreement-item {
        margin-bottom: 24rpx;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    &__agreement-heading {
        font-size: 26rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
    }

    &__agreement-text {
        font-size: 24rpx;
        line-height: 1.7;
        color: var(--hy-text-color--2, #46464a);
    }

    &__agreement-btn {
        padding: 24rpx 40rpx;
        padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
        flex-shrink: 0;
    }
}

@keyframes login-modal-in {
    from {
        opacity: 0;
        transform: scale(0.92) translateY(24rpx);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes login-fade-down {
    from {
        opacity: 0;
        transform: translateY(-32rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes login-fade-up {
    from {
        opacity: 0;
        transform: translateY(32rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes login-shake {
    0%,
    100% {
        transform: translateX(0);
    }
    20% {
        transform: translateX(-10rpx);
    }
    40% {
        transform: translateX(10rpx);
    }
    60% {
        transform: translateX(-6rpx);
    }
    80% {
        transform: translateX(6rpx);
    }
}
</style>
