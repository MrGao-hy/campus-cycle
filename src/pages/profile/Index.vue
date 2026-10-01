<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { ref } from 'vue';
import { updateProfileApi } from '@/api';
import { uploadImage } from '@/utils/upload';

definePage({
    style: {
        navigationBarTitleText: '完善资料',
    },
});

const toast = useToast();
const userStore = useUserStore();

const avatar = ref(userStore.userInfo?.avatar || '');
const nickname = ref(userStore.userInfo?.nickname || '');
const avatarUploading = ref(false);
const saving = ref(false);

/** 选择微信头像（chooseAvatar → 上传 → URL） */
const chooseAvatar = () => {
    const api = (uni as any).chooseAvatar;
    if (typeof api !== 'function') return;
    avatarUploading.value = true;
    api({
        success: async (res: { avatarUrl: string }) => {
            try {
                avatar.value = await uploadImage(res.avatarUrl);
            } catch {
                toast.warning('头像上传失败');
            } finally {
                avatarUploading.value = false;
            }
        },
        fail: () => {
            avatarUploading.value = false;
        },
    });
};

const finish = async () => {
    if (saving.value) return;
    const name = nickname.value.trim();
    if (!name) {
        toast.warning('请填写昵称');
        return;
    }
    saving.value = true;
    try {
        const profile = await updateProfileApi({
            nickname: name,
            avatar: avatar.value || undefined,
        });
        userStore.setLogin(userStore.token, profile);
        toast.success('资料已保存');
        next();
    } catch {
        toast.error('保存失败，请重试');
    } finally {
        saving.value = false;
    }
};

const skip = () => {
    // 跳过资料引导：后续登录不再反复打扰（"我的"页可再编辑）
    uni.setStorageSync('profile_skipped', '1');
    next();
};

/** 未选学校 → 选学校；否则进首页 */
const next = () => {
    if (!userStore.hasSchool) {
        uni.navigateTo({ url: '/pages/school/Index' });
    } else {
        uni.switchTab({ url: '/pages/index/Index' });
    }
};
</script>

<template>
    <the-root-pages>
        <view class="profile">
            <view class="profile__hero">
                <!-- #ifdef MP-WEIXIN -->
                <view class="profile__avatar" @click="chooseAvatar">
                    <image
                        v-if="avatar"
                        class="profile__avatar-img"
                        :src="avatar"
                        mode="aspectFill"
                    />
                    <view v-else class="profile__avatar-placeholder">
                        <hy-icon name="contact" color="#fff" :size="48" />
                        <text>选择头像</text>
                    </view>
                </view>
                <!-- #endif -->
                <text class="profile__title">完善资料</text>
                <text class="profile__desc">设置你的头像和昵称，让同学更容易认出你</text>
            </view>

            <view class="profile__form">
                <view class="profile__field">
                    <text class="profile__label">昵称</text>
                    <input
                        class="profile__input"
                        type="nickname"
                        v-model="nickname"
                        :maxlength="20"
                        placeholder="请输入昵称"
                    />
                </view>
            </view>

            <view class="profile__actions">
                <hy-button
                    text="完成"
                    shape="circle"
                    :loading="saving"
                    :custom-style="{ height: '96rpx', fontSize: '32rpx' }"
                    @click="finish"
                ></hy-button>
                <text class="profile__skip" @click="skip">暂不设置，跳过</text>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.profile {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 60rpx;
    box-sizing: border-box;

    &__hero {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    &__avatar {
        width: 160rpx;
        height: 160rpx;
        border-radius: 50%;
        overflow: hidden;
        background: #d8d8d8;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 32rpx;
    }

    &__avatar-img {
        width: 100%;
        height: 100%;
    }

    &__avatar-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8rpx;
        color: #fff;
        font-size: 22rpx;
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
    }

    &__form {
        width: 100%;
        margin-top: 80rpx;
    }

    &__field {
        display: flex;
        align-items: center;
        background: #f7f8fa;
        border-radius: 24rpx;
        padding: 0 32rpx;
        height: 100rpx;
    }

    &__label {
        width: 120rpx;
        font-size: 30rpx;
        color: var(--hy-main-color, #303133);
        font-weight: 600;
    }

    &__input {
        flex: 1;
        font-size: 30rpx;
        color: var(--hy-main-color, #303133);
    }

    &__actions {
        width: 100%;
        margin-top: auto;
        padding-top: 80rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24rpx;
    }

    &__skip {
        font-size: 26rpx;
        color: var(--hy-info-color, #909193);
        padding: 16rpx 32rpx;
    }
}
</style>
