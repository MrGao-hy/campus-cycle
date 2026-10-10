<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { useUserStore } from '@/store';
import { useToast } from '@/utils/toast';
import { reactive, ref } from 'vue';
import { updateProfileApi } from '@/api';

definePage({
    style: {
        navigationBarTitleText: '联系方式',
    },
});

const toast = useToast();
const userStore = useUserStore();

/** 联系方式表单（电话/QQ/微信/邮箱至少填写一项，发布商品前置条件） */
const contact = reactive({
    contactPhone: userStore.userInfo?.contact?.contactPhone || '',
    contactQq: userStore.userInfo?.contact?.contactQq || '',
    contactWechat: userStore.userInfo?.contact?.contactWechat || '',
    contactEmail: userStore.userInfo?.contact?.contactEmail || '',
});
const saving = ref(false);

const hasAny = () =>
    !!(
        contact.contactPhone.trim() ||
        contact.contactQq.trim() ||
        contact.contactWechat.trim() ||
        contact.contactEmail.trim()
    );

const save = async () => {
    if (saving.value) return;
    if (!hasAny()) {
        toast.warning('请至少填写一种联系方式');
        return;
    }
    saving.value = true;
    try {
        const profile = await updateProfileApi({
            ...contact,
            nickname: userStore.userInfo?.nickname || '',
        });
        userStore.setLogin(userStore.token, profile);
        toast.success('联系方式已保存');
        setTimeout(() => uni.navigateBack(), 600);
    } catch {
        toast.error('保存失败，请重试');
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <the-root-pages>
        <view class="contact">
            <view class="contact__hero">
                <view class="contact__hero-icon">
                    <hy-icon name="/static/icons/contact.png" :size="40" />
                </view>
                <text class="contact__title">填写联系方式</text>
                <text class="contact__desc"
                    >发布商品前需至少填写一种联系方式，买家确认购买后向您发起交易时才能联系到您</text
                >
            </view>

            <view class="contact__form">
                <view class="contact__field">
                    <view class="contact__label">
                        <hy-icon
                            name="/static/icons/telephone.png"
                            :size="18"
                        />
                        <text>电话</text>
                    </view>
                    <input
                        class="contact__input"
                        type="number"
                        v-model="contact.contactPhone"
                        :maxlength="11"
                        placeholder="请输入手机号"
                    />
                </view>
                <view class="contact__field">
                    <view class="contact__label">
                        <hy-icon name="/static/icons/comment.png" :size="18" />
                        <text>QQ</text>
                    </view>
                    <input
                        class="contact__input"
                        type="number"
                        v-model="contact.contactQq"
                        :maxlength="12"
                        placeholder="请输入 QQ 号"
                    />
                </view>
                <view class="contact__field">
                    <view class="contact__label">
                        <hy-icon name="/static/icons/message.png" :size="18" />
                        <text>微信</text>
                    </view>
                    <input
                        class="contact__input"
                        v-model="contact.contactWechat"
                        :maxlength="30"
                        placeholder="请输入微信号"
                    />
                </view>
                <view class="contact__field">
                    <view class="contact__label">
                        <hy-icon name="/static/icons/send.png" :size="18" />
                        <text>邮箱</text>
                    </view>
                    <input
                        class="contact__input"
                        v-model="contact.contactEmail"
                        :maxlength="50"
                        placeholder="请输入邮箱"
                    />
                </view>
            </view>

            <view class="contact__tip">
                <hy-icon
                    name="/static/icons/shield.png"
                    color="var(--primary, #3d7eff)"
                    :size="16"
                />
                <text>联系方式仅在你确认交易后对买家展示，平时严格保密</text>
            </view>

            <view class="contact__actions">
                <hy-button
                    text="保存"
                    shape="circle"
                    color="var(--primary, #3d7eff)"
                    :loading="saving"
                    :custom-style="{ height: '96rpx', fontSize: '32rpx' }"
                    @click="save"
                ></hy-button>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.contact {
    min-height: 100vh;
    padding: 40rpx 48rpx;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;

    &__hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    &__hero-icon {
        @include hy-icon-badge(120rpx, 32rpx);
        margin-bottom: 24rpx;
    }

    &__title {
        font-size: 40rpx;
        font-weight: 700;
        color: var(--hy-main-color, #303133);
    }

    &__desc {
        margin-top: 16rpx;
        font-size: 26rpx;
        color: var(--hy-info-color, #909193);
        line-height: 1.6;
    }

    &__form {
        width: 100%;
        margin-top: 56rpx;
    }

    &__field {
        display: flex;
        align-items: center;
        gap: 20rpx;
        background: var(--hy-background--container, #ffffff);
        border-radius: 24rpx;
        padding: 0 32rpx;
        height: 100rpx;
        margin-bottom: 24rpx;
        box-shadow: 0 8rpx 28rpx rgba(30, 60, 120, 0.06);

        &:last-child {
            margin-bottom: 0;
        }
    }

    &__label {
        display: flex;
        align-items: center;
        gap: 8rpx;
        width: 140rpx;
        flex-shrink: 0;
        font-size: 28rpx;
        color: var(--hy-main-color, #303133);
        font-weight: 600;
    }

    &__input {
        flex: 1;
        font-size: 28rpx;
        color: var(--hy-main-color, #303133);
    }

    &__tip {
        display: flex;
        align-items: flex-start;
        gap: 12rpx;
        font-size: 22rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
        padding: 20rpx 24rpx;
        margin-top: 40rpx;
        background: var(--primary-light, rgba(61, 126, 255, 0.06));
        border-radius: 16rpx;
    }

    &__actions {
        width: 100%;
        margin-top: auto;
        padding-top: 56rpx;
        @include hy-safe-bottom(24rpx);
    }
}
</style>
