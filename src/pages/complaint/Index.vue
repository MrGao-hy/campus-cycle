<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getOrderDetailApi, submitComplaintApi } from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@/utils/toast';
import {
    COMPLAINT_TYPES,
    ORDER_STATUS_TAG,
    ORDER_STATUS_TEXT,
    type ComplaintType,
} from '@/types';
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import type {
    FileVo,
    UploadFileParams,
} from '@hy-app/ui/components/hy-upload/typing';
import type { OrderRow } from '@/types';

definePage({
    style: {
        navigationBarTitleText: '投诉维权',
    },
});

const toast = useToast();
const userStore = useUserStore();

const orderId = ref('');
const row = ref<OrderRow | null>(null);
/** 投诉类型（hy-check-button 单选值） */
const selectedType = ref('');
const content = ref('');
const submitting = ref(false);

/** 投诉类型选项 */
const typeColumns = COMPLAINT_TYPES.map(name => ({
    label: name,
    value: name,
}));

/** 凭证图片（最多 9 张，hy-upload 受控列表，删除由组件内部 splice） */
const fileList = ref<FileVo[]>([]);

const afterRead = (event: UploadFileParams) => {
    const files = Array.isArray(event.file) ? event.file : [event.file];
    files.forEach(f => {
        fileList.value.push({
            status: 'success',
            message: '',
            url: f.url,
        });
    });
};

onLoad(async options => {
    orderId.value = (options?.orderId as string) || '';
    if (orderId.value) {
        row.value = await getOrderDetailApi(orderId.value);
    }
});

/** 被投诉对端 */
const peerName = computed(() => {
    if (!row.value) return '';
    const isBuyer = row.value.order.buyerId === userStore.userInfo?.id;
    return isBuyer ? row.value.seller.nickname : row.value.buyer.nickname;
});

const submit = async () => {
    if (!selectedType.value) {
        toast.warning('请选择投诉类型');
        return;
    }
    if (!content.value.trim()) {
        toast.warning('请描述您遇到的问题');
        return;
    }
    if (submitting.value) return;
    submitting.value = true;
    try {
        await submitComplaintApi({
            orderId: orderId.value || undefined,
            type: selectedType.value as ComplaintType,
            content: content.value.trim(),
            images: fileList.value.map(f => f.url).filter(Boolean) as string[],
        });
        toast.success('投诉已提交，平台将尽快核实处理');
        setTimeout(() => uni.navigateBack(), 600);
    } catch (e) {
        toast.error((e as Error).message || '提交失败');
    } finally {
        submitting.value = false;
    }
};
</script>

<template>
    <the-root-pages>
        <view class="complaint">
            <!-- 通用举报提示 -->
            <view v-if="!row" class="complaint__tip">
                <hy-icon
                    name="/static/icons/order.png"
 :size="16"
                />
                <text
                    >建议从「订单详情 →
                    投诉与维权」进入，关联订单后平台可快速定位核实；通用举报可直接提交</text
                >
            </view>

            <!-- 关联订单信息 -->
            <view v-if="row" class="complaint__order">
                <hy-image
                    :src="row.goods.images[0]"
                    width="120rpx"
                    height="120rpx"
                    radius="12rpx"
                />
                <view class="complaint__order-info">
                    <view class="complaint__order-title">{{
                        row.goods.title
                    }}</view>
                    <view class="complaint__order-meta">
                        <text>交易对象：{{ peerName }}</text>
                        <hy-tag
                            :label="ORDER_STATUS_TEXT[row.order.status]"
                            :type="ORDER_STATUS_TAG[row.order.status].type"
                            :plain="ORDER_STATUS_TAG[row.order.status].plain"
                            size="mini"
                        />
                    </view>
                </view>
            </view>

            <!-- 投诉类型 -->
            <view class="complaint__card">
                <view class="complaint__card-title">投诉类型</view>
                <hy-check-button
                    v-model="selectedType"
                    :columns="typeColumns"
                    select-type="radio"
                    type="error"
                    shape="circle"
                    col="repeat(2, 1fr)"
                    gap="16rpx"
                ></hy-check-button>
            </view>

            <!-- 问题描述 -->
            <view class="complaint__card">
                <view class="complaint__card-title">问题描述</view>
                <hy-textarea
                    v-model="content"
                    placeholder="请描述问题经过：发生了什么、时间地点、涉及金额、对方的承诺与实际行为等（会话内沟通记录可作为凭证）"
                    :maxlength="300"
                    count
                    height="600"
                    border="surround"
                ></hy-textarea>

                <!-- 凭证图片上传 -->
                <view class="complaint__images-label"
                    >上传凭证（最多 9 张，选填）</view
                >
                <hy-upload
                    :file-list="fileList"
                    :max-count="9"
                    multiple
                    :size-type="['compressed']"
                    :width="84"
                    :height="84"
                    @after-read="afterRead"
                >
                    <template #trigger>
                        <view
                            class="complaint__upload-add"
                            hover-class="complaint__upload-add--hover"
                            :hover-stay-time="120"
                        >
                            <view class="complaint__upload-add-icon">
                                <hy-icon
                                    name="/static/icons/camera.png"
 :size="26"
                                ></hy-icon>
                            </view>
                            <text class="complaint__upload-add-text"
                                >上传凭证</text
                            >
                            <text class="complaint__upload-add-count"
                                >{{ fileList.length }}/9</text
                            >
                        </view>
                    </template>
                </hy-upload>
            </view>

            <!-- 维权指南 -->
            <view class="complaint__card">
                <view class="complaint__card-title">维权指南</view>
                <view class="complaint__rule"
                    ><text class="complaint__rule-no">1</text
                    ><text
                        >平台 24 小时内受理，核实后将通过站内消息告知结果</text
                    ></view
                >
                <view class="complaint__rule"
                    ><text class="complaint__rule-no">2</text
                    ><text
                        >保留商品照片、聊天记录、支付凭证，作为维权证据</text
                    ></view
                >
                <view class="complaint__rule"
                    ><text class="complaint__rule-no">3</text
                    ><text
                        >订单完成后 48 小时申诉期内，卖家可对订单提出异议</text
                    ></view
                >
                <view class="complaint__rule"
                    ><text class="complaint__rule-no">4</text
                    ><text>遇人身安全威胁请立即报警或联系学校保卫处</text></view
                >
            </view>

            <view class="complaint__footer">
                <hy-button
                    text="提交投诉"
                    shape="circle"
                    color="var(--primary, #3d7eff)"
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

.complaint {
    min-height: 100vh;
    padding: 24rpx 24rpx 200rpx;
    box-sizing: border-box;

    &__tip {
        display: flex;
        align-items: flex-start;
        gap: 12rpx;
        margin-bottom: 24rpx;
        padding: 20rpx 24rpx;
        background: var(--primary-light, rgba(61, 126, 255, 0.08));
        border-radius: 16rpx;
        font-size: 24rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
        animation: complaint-fade-up 0.45s ease both;
    }

    &__order {
        @include hy-card(20rpx);
        display: flex;
        gap: 20rpx;
        padding: 24rpx;
        margin-bottom: 24rpx;
        animation: complaint-fade-up 0.45s ease both;
    }

    &__order-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 10rpx;
    }

    &__order-title {
        font-size: 28rpx;
        font-weight: 500;
        color: var(--hy-text-color, #000000);
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
    }

    &__order-meta {
        display: flex;
        align-items: center;
        gap: 12rpx;
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin-bottom: 24rpx;
        animation: complaint-fade-up 0.45s ease 0.06s both;
    }

    &__card-title {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 16rpx;
    }

    &__images-label {
        font-size: 24rpx;
        color: var(--hy-text-color--3, #929295);
        margin: 20rpx 0 16rpx;
    }

    &__upload-add {
        width: 168rpx;
        height: 168rpx;
        margin: 0 8px 8px 0;
        box-sizing: border-box;
        border: 4rpx dashed var(--primary-light-2, rgba(61, 126, 255, 0.35));
        border-radius: 16rpx;
        background: var(--primary-light, rgba(61, 126, 255, 0.06));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6rpx;
        transition:
            background-color 0.2s ease,
            transform 0.15s ease;
    }

    &__upload-add--hover {
        background: var(--primary-light, rgba(61, 126, 255, 0.14));
        transform: scale(0.96);
    }

    &__upload-add-icon {
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        background: var(--hy-background--container, #ffffff);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4rpx 10rpx rgba(30, 60, 120, 0.1);
    }

    &__upload-add-text {
        font-size: 22rpx;
        color: var(--primary, #3d7eff);
        font-weight: 500;
    }

    &__upload-add-count {
        font-size: 20rpx;
        color: var(--hy-text-color--3, #929295);
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

@keyframes complaint-fade-up {
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

<style lang="scss">
/* hy-upload 预览区美化：组件 styleIsolation 为 shared，页面样式可穿透；
   限定 .complaint 作用域，避免影响其他页面 */
.complaint .hy-upload__wrap--preview {
    border-radius: 16rpx;
    border: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));
    box-shadow: 0 4rpx 16rpx rgba(30, 60, 120, 0.08);
}

.complaint .hy-upload__deletable {
    height: 34rpx;
    width: 34rpx;
    background-color: rgba(0, 0, 0, 0.55);
    border-bottom-left-radius: 22rpx;
}

.complaint .hy-upload__deletable--icon {
    transform: scale(0.85);
}
</style>
