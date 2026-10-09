<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { checkPublishAllowedApi, publishGoodsApi } from '@/api';
import { uploadImage } from '@/utils/upload';
import { useToast } from '@/utils/toast';
import { GOODS_CATEGORIES, GOODS_CONDITIONS } from '@/types';
import { onShow } from '@dcloudio/uni-app';
import { ensureLoginAndSchool } from '@/utils/guard';
import { computed, ref } from 'vue';
import { useUserStore } from '@/store';

definePage({
    style: {
        navigationBarTitleText: '发布商品',
    },
});

const toast = useToast();
const userStore = useUserStore();

/** 未登录/未选校引导：守卫只判断不跳转（避免返回死循环） */
const goGuard = () => {
    if (!userStore.hasLogin) {
        uni.navigateTo({ url: '/pages/login/Index' });
        return;
    }
    uni.navigateTo({ url: '/pages/school/Index' });
};

/** 未结清手续费 → 禁止发布 */
const publishBlocked = ref(false);
const unpaidAmount = ref(0);
const checkPublish = async () => {
    const res = await checkPublishAllowedApi();
    publishBlocked.value = !res.allowed;
    unpaidAmount.value = res.unpaidAmount;
};
onShow(() => {
    if (!ensureLoginAndSchool()) return;
    checkPublish();
});

const title = ref('');
const price = ref('');
/** 原价（选填，展示划线价） */
const originalPrice = ref('');
const description = ref('');
const images = ref<string[]>([]);
/** 分类（单选值，默认「生活」） */
const category = ref('生活');
/** 成色（单选值，默认「全新」） */
const condition = ref(GOODS_CONDITIONS[0]);
const submitting = ref(false);

/** hy-check-button 选项 */
const categoryColumns = GOODS_CATEGORIES.slice(1).map(name => ({
    label: name,
    value: name,
}));
const conditionColumns = GOODS_CONDITIONS.map(name => ({
    label: name,
    value: name,
}));

const canSubmit = computed(() => {
    return (
        !publishBlocked.value &&
        title.value.trim() &&
        Number(price.value) > 0 &&
        description.value.trim()
    );
});

/** 选择商品图片（本地选图后上传后端，images 存可访问 URL） */
const chooseImage = () => {
    const remain = 3 - images.value.length;
    if (remain <= 0) return;
    uni.chooseImage({
        count: remain,
        success: async res => {
            uni.showLoading({ title: '上传中...', mask: true });
            try {
                for (const p of res.tempFilePaths) {
                    const url = await uploadImage(p);
                    images.value = images.value.concat(url).slice(0, 3);
                }
            } catch (e) {
                toast.warning((e as Error).message || '图片上传失败');
            } finally {
                uni.hideLoading();
            }
        },
    });
};

const removeImage = (index: number) => {
    images.value.splice(index, 1);
};

const goFee = () => {
    uni.navigateTo({ url: '/pages/fee/Index' });
};

const submit = async () => {
    if (!canSubmit.value || submitting.value) return;
    submitting.value = true;
    try {
        await publishGoodsApi({
            title: title.value.trim(),
            price: Number(price.value),
            originalPrice:
                Number(originalPrice.value) > 0
                    ? Number(originalPrice.value)
                    : undefined,
            category: category.value,
            condition: condition.value,
            description: description.value.trim(),
            images: images.value,
        });
        toast.success('发布成功');
        setTimeout(() => uni.switchTab({ url: '/pages/index/Index' }), 600);
    } catch (e) {
        toast.error((e as Error).message || '发布失败');
        checkPublish();
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
    <the-root-pages>
        <view class="publish">
            <!-- 未登录/未选校：引导态（守卫不强制跳转，避免返回死循环） -->
            <view
                v-if="!userStore.hasLogin || !userStore.hasSchool"
                class="publish__guard"
            >
                <view class="publish__guard-logo">
                    <hy-icon
                        :name="
                            userStore.hasLogin
                                ? '/static/icons/check.png'
                                : '/static/icons/lock.png'
                        "
                        color="#fff"
                        :size="24"
                    />
                </view>
                <text class="publish__guard-title">{{
                    userStore.hasLogin ? '先选择你的学校' : '登录后发布商品'
                }}</text>
                <text class="publish__guard-desc">{{
                    userStore.hasLogin
                        ? '选择学校后可发布商品'
                        : '登录后即可发布你的闲置好物'
                }}</text>
                <view
                    class="publish__guard-btn"
                    hover-class="publish__guard-btn--hover"
                    :hover-stay-time="120"
                    @tap="goGuard"
                    >{{ userStore.hasLogin ? '去选择' : '去登录' }}</view
                >
            </view>
            <template v-else>
            <!-- 欠费拦截提示 -->
            <view v-if="publishBlocked" class="publish__blocked">
                <hy-warn
                    title="存在未结清手续费"
                    type="error"
                    theme="light"
                    show-icon
                    :description="`您有 ${unpaidAmount} 元手续费未结清，结清前无法发布新商品`"
                ></hy-warn>
                <hy-button
                    text="去缴手续费"
                    type="error"
                    size="small"
                    :custom-style="{ marginTop: '16rpx' }"
                    @click="goFee"
                ></hy-button>
            </view>

            <!-- 商品图片 -->
            <view class="publish__card">
                <view class="publish__card-title"
                    >商品图片（最多3张，首图为封面）</view
                >
                <view class="publish__images">
                    <view
                        v-for="(imgUrl, i) in images"
                        :key="i"
                        class="publish__image"
                    >
                        <hy-image
                            :src="imgUrl"
                            width="100%"
                            height="100%"
                            radius="12rpx"
                        />
                        <view
                            class="publish__image-close"
                            @tap="removeImage(i)"
                        >
                            <hy-icon
                                name="/static/icons/close.png"
                                color="#fff"
                                :size="12"
                            ></hy-icon>
                        </view>
                    </view>
                    <view
                        v-if="images.length < 3"
                        class="publish__image-add"
                        hover-class="publish__image-add--hover"
                        :hover-stay-time="120"
                        @tap="chooseImage"
                    >
                        <hy-icon
                            name="/static/icons/camera.png"
 :size="28"
                        ></hy-icon>
                        <text>添加图片</text>
                    </view>
                </view>
            </view>

            <!-- 基本信息 -->
            <view class="publish__card">
                <view class="publish__card-title">基本信息</view>
                <hy-input
                    v-model="title"
                    placeholder="商品标题（品牌型号 + 成色）"
                    :maxlength="30"
                    :custom-style="{ marginBottom: '20rpx' }"
                ></hy-input>
                <hy-input
                    v-model="price"
                    type="digit"
                    placeholder="出售价格（元）"
                    :custom-style="{ marginBottom: '20rpx' }"
                ></hy-input>
                <hy-input
                    v-model="originalPrice"
                    type="digit"
                    placeholder="原价（选填，用于展示划线价）"
                    :custom-style="{ marginBottom: '20rpx' }"
                ></hy-input>
                <hy-textarea
                    v-model="description"
                    placeholder="描述一下商品的购买时间、使用情况、瑕疵问题等，如实描述更容易卖出"
                    :maxlength="300"
                    confirmType="return"
                    count
                ></hy-textarea>
            </view>

            <!-- 分类 -->
            <view class="publish__card">
                <view class="publish__card-title">分类</view>
                <hy-check-button
                    v-model="category"
                    :columns="categoryColumns"
                    select-type="radio"
                    type="primary"
                    shape="circle"
                    col="repeat(3, 1fr)"
                    gap="16rpx"
                ></hy-check-button>
            </view>

            <!-- 成色 -->
            <view class="publish__card">
                <view class="publish__card-title">成色</view>
                <hy-check-button
                    v-model="condition"
                    :columns="conditionColumns"
                    select-type="radio"
                    type="primary"
                    shape="circle"
                    col="repeat(2, 1fr)"
                    gap="16rpx"
                ></hy-check-button>
            </view>

            <!-- 手续费说明 -->
            <view class="publish__fee">
                <hy-icon
                    name="/static/icons/remind.png"
                    color="var(--primary, #3d7eff)"
                    :size="16"
                />
                <text
                    >成交后平台将按成交价 6% 向卖家收取手续费（最低 1 元、最高
                    20 元），首笔成功交易免手续费，账单在订单完成后生成</text
                >
            </view>

            <view class="publish__footer">
                <hy-button
                    text="发布"
                    shape="circle"
                    color="var(--primary, #3d7eff)"
                    :disabled="!canSubmit"
                    :loading="submitting"
                    :custom-style="{ height: '92rpx', fontSize: '32rpx' }"
                    @click="submit"
                ></hy-button>
                <hy-safe-bottom></hy-safe-bottom>
            </view>
            </template>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.publish {
    min-height: 100vh;
    padding: 24rpx 24rpx 180rpx;
    box-sizing: border-box;

    &__blocked {
        margin-bottom: 24rpx;
    }

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin-bottom: 24rpx;
        animation: publish-fade-up 0.45s ease 0.06s both;
    }

    &__card-title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 20rpx;
    }

    &__images {
        display: flex;
        gap: 20rpx;
    }

    &__image {
        position: relative;
        width: 180rpx;
        height: 180rpx;
    }

    &__image-close {
        position: absolute;
        top: -12rpx;
        right: -12rpx;
        width: 36rpx;
        height: 36rpx;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__image-add {
        width: 180rpx;
        height: 180rpx;
        border: 2rpx dashed var(--primary-light-2, rgba(61, 126, 255, 0.3));
        border-radius: 12rpx;
        background: var(--primary-light, rgba(61, 126, 255, 0.04));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
        transition: background-color 0.2s ease;

        &--hover {
            background: var(--primary-light, rgba(61, 126, 255, 0.1));
        }
    }

    &__fee {
        display: flex;
        align-items: flex-start;
        gap: 12rpx;
        font-size: 22rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
        padding: 20rpx 24rpx;
        margin-bottom: 24rpx;
        background: var(--primary-light, rgba(61, 126, 255, 0.06));
        border-radius: 16rpx;
        animation: publish-fade-up 0.45s ease 0.12s both;
    }

    &__footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 16rpx 24rpx;
        padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
        background: var(--hy-background--container, #ffffff);
        box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
    }

    /* 未登录/未选校引导态 */
    &__guard {
        margin: 100rpx 48rpx 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;

        &-logo {
            width: 96rpx;
            height: 96rpx;
            border-radius: 28rpx;
            background: linear-gradient(135deg, #3d7eff, #6fa8ff);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 12rpx 32rpx rgba(61, 126, 255, 0.3);
        }

        &-title {
            margin-top: 32rpx;
            font-size: 34rpx;
            font-weight: 600;
            color: #1f2329;
        }

        &-desc {
            margin-top: 12rpx;
            font-size: 26rpx;
            color: #8a9099;
            line-height: 1.6;
        }

        &-btn {
            margin-top: 40rpx;
            padding: 0 56rpx;
            height: 80rpx;
            border-radius: 40rpx;
            background: var(--primary, #3d7eff);
            color: #ffffff;
            font-size: 30rpx;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10rpx 24rpx rgba(61, 126, 255, 0.28);

            &--hover {
                opacity: 0.85;
            }
        }
    }
}

@keyframes publish-fade-up {
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
