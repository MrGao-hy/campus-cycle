<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { checkPublishAllowedApi, publishGoodsApi } from '@/api';
import { useToast } from '@hy-app/ui';
import { GOODS_CATEGORIES, GOODS_CONDITIONS } from '@/types';
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '发布商品',
    },
});

const toast = useToast();

/** 未结清手续费 → 禁止发布 */
const publishBlocked = ref(false);
const unpaidAmount = ref(0);
const checkPublish = async () => {
    const res = await checkPublishAllowedApi();
    publishBlocked.value = !res.allowed;
    unpaidAmount.value = res.unpaidAmount;
};
onShow(checkPublish);

const title = ref('');
const price = ref('');
const description = ref('');
const images = ref<string[]>([]);
const categoryIndex = ref(0);
const conditionIndex = ref(0);
const submitting = ref(false);

const canSubmit = computed(() => {
    return (
        !publishBlocked.value &&
        title.value.trim() &&
        Number(price.value) > 0 &&
        description.value.trim() &&
        images.value.length > 0
    );
});

/** 选择商品图片（mock 环境：真实环境走 uni.uploadFile） */
const chooseImage = () => {
    uni.chooseImage({
        count: 3 - images.value.length,
        success: res => {
            images.value = images.value.concat(res.tempFilePaths).slice(0, 3);
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
            category:
                GOODS_CATEGORIES[categoryIndex.value] === '推荐'
                    ? '生活'
                    : GOODS_CATEGORIES[categoryIndex.value],
            condition: GOODS_CONDITIONS[conditionIndex.value],
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
                                name="close"
                                color="#fff"
                                :size="12"
                            ></hy-icon>
                        </view>
                    </view>
                    <view
                        v-if="images.length < 3"
                        class="publish__image-add"
                        @tap="chooseImage"
                    >
                        <hy-icon
                            name="camera"
                            color="var(--hy-info-color)"
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
                    border="surround"
                    :custom-style="{ marginBottom: '20rpx' }"
                ></hy-input>
                <hy-input
                    v-model="price"
                    type="digit"
                    placeholder="出售价格（元）"
                    border="surround"
                    :custom-style="{ marginBottom: '20rpx' }"
                ></hy-input>
                <hy-textarea
                    v-model="description"
                    placeholder="描述一下商品的购买时间、使用情况、瑕疵问题等，如实描述更容易卖出"
                    :maxlength="300"
                    count
                    auto-height
                    border="surround"
                ></hy-textarea>
            </view>

            <!-- 分类 -->
            <view class="publish__card">
                <view class="publish__card-title">分类</view>
                <view class="publish__chips">
                    <hy-tag
                        v-for="(name, i) in GOODS_CATEGORIES.slice(1)"
                        :key="name"
                        :label="name"
                        :type="categoryIndex === i + 1 ? 'primary' : 'info'"
                        :plain="categoryIndex !== i + 1"
                        shape="circle"
                        @click="categoryIndex = i + 1"
                    ></hy-tag>
                </view>
            </view>

            <!-- 成色 -->
            <view class="publish__card">
                <view class="publish__card-title">成色</view>
                <view class="publish__chips">
                    <hy-tag
                        v-for="(name, i) in GOODS_CONDITIONS"
                        :key="name"
                        :label="name"
                        :type="conditionIndex === i ? 'primary' : 'info'"
                        :plain="conditionIndex !== i"
                        shape="circle"
                        @click="conditionIndex = i"
                    ></hy-tag>
                </view>
            </view>

            <!-- 手续费说明 -->
            <view class="publish__fee">
                <hy-icon
                    name="remind"
                    color="var(--hy-primary-color)"
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
                    color="var(--hy-primary-color)"
                    :disabled="!canSubmit"
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
.publish {
    min-height: 100vh;
    padding: 24rpx 24rpx 180rpx;
    box-sizing: border-box;

    &__blocked {
        margin-bottom: 24rpx;
    }

    &__card {
        background: var(--hy-bg-color, #fff);
        border-radius: 16rpx;
        padding: 24rpx;
        margin-bottom: 24rpx;
    }

    &__card-title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--hy-main-color, #303133);
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
        border: 2rpx dashed var(--hy-border-color, #dcdfe6);
        border-radius: 12rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--hy-info-color, #909193);
    }

    &__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 20rpx;
    }

    &__fee {
        display: flex;
        align-items: flex-start;
        gap: 10rpx;
        font-size: 22rpx;
        color: var(--hy-info-color, #909193);
        line-height: 1.6;
        padding: 0 8rpx;
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
