<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getComplaintDetailApi, submitAppealApi } from '@/api';
import { useToast } from '@/utils/toast';
import { fmtFullTime } from '@/utils/format';
import type { ComplaintRow } from '@/types';
import type {
    FileVo,
    UploadFileParams,
} from '@/uni_modules/hy-app-ui/components/hy-upload/typing';
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '提交申诉',
    },
});

const toast = useToast();

const complaintId = ref('');
const row = ref<ComplaintRow | null>(null);
const content = ref('');
const submitting = ref(false);

/** 申诉凭证（最多 9 张，hy-upload 受控列表） */
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
    complaintId.value = (options?.complaintId as string) || '';
    if (complaintId.value) {
        try {
            row.value = await getComplaintDetailApi(complaintId.value);
        } catch (e) {
            toast.error((e as Error).message || '投诉记录不存在');
        }
    }
});

const submit = async () => {
    if (!content.value.trim()) {
        toast.warning('请填写申诉说明');
        return;
    }
    if (submitting.value) return;
    submitting.value = true;
    try {
        await submitAppealApi({
            complaintId: complaintId.value,
            content: content.value.trim(),
            images: fileList.value.map(f => f.url).filter(Boolean) as string[],
        });
        toast.success('申诉已提交，平台将结合双方材料核实');
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
        <view class="apl">
            <!-- 被投诉信息 -->
            <view v-if="row && row.complaint" class="apl__against">
                <view class="apl__against-head">
                    <hy-tag
                        :label="row.complaint.type"
                        type="error"
                        plain
                        size="mini"
                    />
                    <text class="apl__against-time">{{
                        fmtFullTime(row.complaint.time)
                    }}</text>
                </view>
                <view class="apl__against-title"
                    >来自 {{ row.fromName || '用户' }} 的投诉</view
                >
                <view v-if="row.complaint.goodsTitle" class="apl__against-goods"
                    >关联商品：{{ row.complaint.goodsTitle }}</view
                >
                <view class="apl__against-content">{{
                    row.complaint.content
                }}</view>
            </view>

            <!-- 申诉说明 -->
            <view class="apl__card">
                <view class="apl__card-title">申诉说明</view>
                <hy-textarea
                    v-model="content"
                    placeholder="请说明实际情况：交易经过、您的处理方式、对方描述不实之处等，平台将结合双方材料综合核实（仅有一次申诉机会，请认真填写）"
                    :maxlength="300"
                    count
                    height="500"
                    border="surround"
                ></hy-textarea>

                <view class="apl__images-label"
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
                            class="apl__upload-add"
                            hover-class="apl__upload-add--hover"
                            :hover-stay-time="120"
                        >
                            <view class="apl__upload-add-icon">
                                <hy-icon
                                    name="/static/icons/camera.png"
 :size="26"
                                ></hy-icon>
                            </view>
                            <text class="apl__upload-add-text"
                                >上传凭证</text
                            >
                            <text class="apl__upload-add-count"
                                >{{ fileList.length }}/9</text
                            >
                        </view>
                    </template>
                </hy-upload>
            </view>

            <!-- 申诉须知 -->
            <view class="apl__card">
                <view class="apl__card-title">申诉须知</view>
                <view class="apl__rule"
                    ><text class="apl__rule-no">1</text
                    ><text
                        >仅被投诉人可申诉，每笔投诉仅有一次申诉机会</text
                    ></view
                >
                <view class="apl__rule"
                    ><text class="apl__rule-no">2</text
                    ><text
                        >提交后平台将进入核实处理，一般 48 小时内出结果</text
                    ></view
                >
                <view class="apl__rule"
                    ><text class="apl__rule-no">3</text
                    ><text
                        >站内聊天记录、交易凭证均可作为申诉证据</text
                    ></view
                >
                <view class="apl__rule"
                    ><text class="apl__rule-no">4</text
                    ><text>恶意申诉将被扣除信用分，请如实描述</text></view
                >
            </view>

            <view class="apl__footer">
                <hy-button
                    text="提交申诉"
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

.apl {
    min-height: 100vh;
    padding: 24rpx 24rpx 200rpx;
    box-sizing: border-box;

    &__against {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin-bottom: 24rpx;
        animation: apl-fade-up 0.45s ease both;
    }

    &__against-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 14rpx;
    }

    &__against-time {
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__against-title {
        font-size: 29rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 8rpx;
    }

    &__against-goods {
        font-size: 23rpx;
        color: var(--hy-text-color--3, #929295);
        margin-bottom: 8rpx;
    }

    &__against-content {
        padding: 20rpx 24rpx;
        border-radius: 12rpx;
        background: var(--hy-background, #f8f8f8);
        font-size: 25rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.7;
    }

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin-bottom: 24rpx;
        animation: apl-fade-up 0.45s ease 0.06s both;
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

@keyframes apl-fade-up {
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
/* hy-upload 预览区美化：限定 .apl 作用域 */
.apl .hy-upload__wrap--preview {
    border-radius: 16rpx;
    border: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));
    box-shadow: 0 4rpx 16rpx rgba(30, 60, 120, 0.08);
}

.apl .hy-upload__deletable {
    height: 34rpx;
    width: 34rpx;
    background-color: rgba(0, 0, 0, 0.55);
    border-bottom-left-radius: 22rpx;
}

.apl .hy-upload__deletable--icon {
    transform: scale(0.85);
}
</style>
