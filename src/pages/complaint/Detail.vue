<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { cancelComplaintApi, getComplaintDetailApi } from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { fmtFullTime } from '@/utils/format';
import {
    APPEAL_STATUS_TAG,
    APPEAL_STATUS_TEXT,
    COMPLAINT_STATUS_TAG,
    COMPLAINT_STATUS_TEXT,
    type ComplaintRow,
} from '@/types';
import type { StepListVo } from '@hy-app/ui/components/hy-steps/typing';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '投诉详情',
    },
});

const toast = useToast();
const userStore = useUserStore();

const id = ref('');
const row = ref<ComplaintRow | null>(null);
const modalShow = ref(false);

const complaint = computed(() => row.value?.complaint);
/** 视角：投诉人 / 被投诉人 */
const isFrom = computed(
    () => complaint.value?.fromUserId === userStore.userInfo?.id
);
const isTo = computed(
    () =>
        !!complaint.value && complaint.value.toUserId === userStore.userInfo?.id
);
/** 待受理/处理中可取消（仅投诉人） */
const canCancel = computed(
    () => isFrom.value && complaint.value?.status === 'PENDING'
);
/** 被投诉人可申诉：未办结且未申诉过 */
const canAppeal = computed(
    () =>
        isTo.value &&
        ['PENDING', 'PROCESSING'].includes(complaint.value?.status || '') &&
        !row.value?.appeals?.length
);

const statusDesc = computed(() => {
    switch (complaint.value?.status) {
        case 'PENDING':
            return '平台将在 24 小时内受理您的投诉，请留意站内消息';
        case 'PROCESSING':
            return '平台正在核实双方提交的材料，处理结果将通过站内消息告知';
        case 'ESTABLISHED':
            return '平台已核实，投诉成立，已对被投诉人作出相应处理';
        case 'NOT_ESTABLISHED':
            return '经平台核实，现有证据不足以支持投诉，投诉不成立';
        case 'CANCELLED':
            return '您已取消该投诉，如后续仍有纠纷可重新发起';
        default:
            return '';
    }
});

/** 流程进度（竖向步骤条） */
const stepList = computed<StepListVo[]>(() => {
    const c = complaint.value;
    if (!c) return [];
    if (c.status === 'CANCELLED') {
        return [
            {
                title: '提交投诉',
                docs: '投诉已提交至平台',
                date: fmtFullTime(c.time),
            },
            {
                title: '投诉已取消',
                docs: c.cancelReason || '投诉人主动取消',
                date: fmtFullTime(c.cancelTime),
                error: true,
            },
        ];
    }
    const appeal = row.value?.appeals?.[0];
    return [
        {
            title: '提交投诉',
            docs: isFrom.value ? '您提交了投诉' : '对方提交了投诉',
            date: fmtFullTime(c.time),
        },
        {
            title: '平台受理',
            docs: c.processTime ? '平台已受理并介入核实' : '24 小时内受理',
            date: c.processTime ? fmtFullTime(c.processTime) : '',
        },
        {
            title: '被投诉人申诉',
            docs: appeal
                ? appeal.fromUserId === userStore.userInfo?.id
                    ? '您已提交申诉，等待平台审核'
                    : '对方已提交申诉'
                : '被投诉人可提交一次申诉',
            date: appeal ? fmtFullTime(appeal.time) : '',
        },
        {
            title: '平台核实处理',
            docs:
                c.status === 'PENDING'
                    ? '等待受理'
                    : c.finishTime
                      ? '核实完成'
                      : '正在核实双方材料',
        },
        {
            title: '处理结果',
            docs: COMPLAINT_STATUS_TEXT[c.status],
            date: fmtFullTime(c.finishTime),
            error: c.status === 'NOT_ESTABLISHED',
        },
    ];
});

/** hy-steps current：当前进行到的节点索引 */
const stepCurrent = computed(() => {
    switch (complaint.value?.status) {
        case 'PENDING':
            return 1;
        case 'PROCESSING':
            return 3;
        case 'ESTABLISHED':
        case 'NOT_ESTABLISHED':
            return 4;
        case 'CANCELLED':
            return 2;
        default:
            return 0;
    }
});

const load = async () => {
    if (!id.value) return;
    try {
        row.value = await getComplaintDetailApi(id.value);
    } catch (e) {
        toast.error((e as Error).message || '投诉记录不存在');
    }
};

onLoad(options => {
    id.value = (options?.id as string) || '';
});
onShow(load);

/** 凭证预览 */
const previewImages = (images: string[], index = 0) => {
    uni.previewImage({ urls: images, current: index });
};

/** 取消投诉 */
const doCancel = async () => {
    if (!complaint.value) return;
    try {
        await cancelComplaintApi(complaint.value.id, '投诉人主动取消');
        toast.success('投诉已取消');
        load();
    } catch (e) {
        toast.error((e as Error).message || '操作失败');
    }
};

const goAppeal = () => {
    uni.navigateTo({ url: `/pages/complaint/Appeal?complaintId=${id.value}` });
};
</script>

<template>
    <the-root-pages>
        <view v-if="row && complaint" class="cd">
            <!-- 状态头部 -->
            <view
                class="cd__header"
                :class="`cd__header--${complaint.status.toLowerCase()}`"
            >
                <view class="cd__status-row">
                    <text class="cd__status">{{
                        COMPLAINT_STATUS_TEXT[complaint.status]
                    }}</text>
                    <hy-tag
                        :label="complaint.type"
                        :type="
                            complaint.status === 'CANCELLED' ||
                            complaint.status === 'NOT_ESTABLISHED'
                                ? 'warning'
                                : 'error'
                        "
                        plain
                        size="mini"
                    />
                </view>
                <text class="cd__desc">{{ statusDesc }}</text>
            </view>

            <!-- 流程进度 -->
            <view class="cd__steps">
                <view class="cd__card-title">流程进度</view>
                <hy-steps
                    :list="stepList"
                    :current="stepCurrent"
                    direction="column"
                    :dot="false"
                    icon-size="15"
                ></hy-steps>
            </view>

            <!-- 投诉信息 -->
            <view class="cd__card">
                <view class="cd__card-title">投诉信息</view>
                <view class="cd__info-row">
                    <text class="cd__info-label">投诉人</text>
                    <text class="cd__info-value">{{
                        row.fromName || '我'
                    }}</text>
                </view>
                <view class="cd__info-row">
                    <text class="cd__info-label">被投诉人</text>
                    <text class="cd__info-value">{{
                        row.peerName || '该用户'
                    }}</text>
                </view>
                <view v-if="complaint.goodsTitle" class="cd__info-row">
                    <text class="cd__info-label">关联商品</text>
                    <text class="cd__info-value">{{
                        complaint.goodsTitle
                    }}</text>
                </view>
                <view class="cd__info-row">
                    <text class="cd__info-label">投诉编号</text>
                    <text class="cd__info-value">{{ complaint.id }}</text>
                </view>
                <view class="cd__content">{{ complaint.content }}</view>
                <view v-if="complaint.images?.length" class="cd__images">
                    <hy-image
                        v-for="(img, i) in complaint.images"
                        :key="i"
                        :src="img"
                        width="150rpx"
                        height="150rpx"
                        radius="12rpx"
                        @tap="previewImages(complaint.images!, i)"
                    />
                </view>
            </view>

            <!-- 申诉记录 -->
            <view v-if="row.appeals?.length" class="cd__card">
                <view class="cd__card-title">申诉记录</view>
                <view v-for="a in row.appeals" :key="a.id" class="cd__appeal">
                    <view class="cd__appeal-head">
                        <text class="cd__appeal-title">申诉申辩</text>
                        <hy-tag
                            :label="APPEAL_STATUS_TEXT[a.status]"
                            :type="APPEAL_STATUS_TAG[a.status].type"
                            :plain="APPEAL_STATUS_TAG[a.status].plain"
                            size="mini"
                        />
                    </view>
                    <view class="cd__content">{{ a.content }}</view>
                    <view v-if="a.images?.length" class="cd__images">
                        <hy-image
                            v-for="(img, i) in a.images"
                            :key="i"
                            :src="img"
                            width="150rpx"
                            height="150rpx"
                            radius="12rpx"
                            @tap="previewImages(a.images!, i)"
                        />
                    </view>
                    <view v-if="a.reply" class="cd__reply">
                        <text class="cd__reply-label">平台审核意见</text>
                        <text>{{ a.reply }}</text>
                    </view>
                    <text class="cd__appeal-time">{{
                        fmtFullTime(a.time)
                    }}</text>
                </view>
            </view>

            <!-- 处理结果 -->
            <view
                v-if="complaint.reply || complaint.cancelReason"
                class="cd__card cd__result"
                :class="{
                    'cd__result--ok': complaint.status === 'ESTABLISHED',
                    'cd__result--fail':
                        complaint.status === 'NOT_ESTABLISHED' ||
                        complaint.status === 'CANCELLED',
                }"
            >
                <view class="cd__card-title">
                    {{
                        complaint.status === 'CANCELLED'
                            ? '取消说明'
                            : '平台处理结果'
                    }}
                </view>
                <view class="cd__result-text">{{
                    complaint.reply || complaint.cancelReason
                }}</view>
            </view>

            <!-- 底部操作 -->
            <view v-if="canCancel || canAppeal" class="cd__actions">
                <hy-button
                    v-if="canCancel"
                    text="取消投诉"
                    shape="circle"
                    plain
                    type="info"
                    :custom-style="{ flex: 1 }"
                    @click="modalShow = true"
                ></hy-button>
                <hy-button
                    v-if="canAppeal"
                    text="提交申诉"
                    shape="circle"
                    type="primary"
                    :custom-style="{ flex: 1 }"
                    @click="goAppeal"
                ></hy-button>
            </view>

            <!-- 取消确认（自定义弹层：hy-modal 小程序端不渲染，改纯 view + fixed） -->
            <view
                v-if="modalShow"
                class="complaint__modal-mask"
                @tap="modalShow = false"
            >
                <view class="complaint__modal" @tap.stop>
                    <text class="complaint__modal-title">取消投诉</text>
                    <text class="complaint__modal-content"
                        >取消后投诉流程将终止，如后续仍有纠纷可重新发起投诉。确认取消？</text
                    >
                    <view class="complaint__modal-btns">
                        <view
                            class="complaint__modal-btn complaint__modal-btn--cancel"
                            @tap="modalShow = false"
                            >取消</view
                        >
                        <view
                            class="complaint__modal-btn complaint__modal-btn--confirm"
                            @tap="doCancel"
                            >确认取消</view
                        >
                    </view>
                </view>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;

.cd {
    min-height: 100vh;
    padding-bottom: 200rpx;

    &__header {
        @include hy-gradient-header(135deg);
        padding: 40rpx 32rpx 48rpx;
        color: #fff;
    }

    &__status-row {
        display: flex;
        align-items: center;
        gap: 16rpx;
    }

    &__status {
        font-size: 40rpx;
        font-weight: 700;
    }

    &__desc {
        display: block;
        margin-top: 12rpx;
        font-size: 25rpx;
        opacity: 0.92;
        line-height: 1.6;
    }

    &__steps,
    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin: 20rpx 24rpx 0;
        animation: cd-fade-up 0.45s ease 0.05s both;
    }

    &__steps {
        position: relative;
        margin-top: -28rpx;
        animation-delay: 0s;
    }

    &__card-title {
        font-size: 29rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 20rpx;
    }

    &__info-row {
        display: flex;
        justify-content: space-between;
        gap: 20rpx;
        padding: 8rpx 0;
    }

    &__info-label {
        font-size: 25rpx;
        color: var(--hy-text-color--3, #929295);
        flex-shrink: 0;
    }

    &__info-value {
        font-size: 25rpx;
        color: var(--hy-text-color--2, #46464a);
        text-align: right;
    }

    &__content {
        margin-top: 12rpx;
        padding: 20rpx 24rpx;
        border-radius: 12rpx;
        background: var(--hy-background, #f8f8f8);
        font-size: 25rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.7;
    }

    &__images {
        display: flex;
        flex-wrap: wrap;
        gap: 14rpx;
        margin-top: 16rpx;
    }

    &__appeal {
        padding: 20rpx 0;
        border-bottom: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));

        &:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
    }

    &__appeal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12rpx;
    }

    &__appeal-title {
        font-size: 27rpx;
        font-weight: 500;
        color: var(--hy-text-color, #000000);
    }

    &__appeal-time {
        display: block;
        margin-top: 12rpx;
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__reply {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        margin-top: 16rpx;
        padding: 16rpx 20rpx;
        border-radius: 12rpx;
        background: var(--hy-background, #f8f8f8);
        font-size: 23rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
    }

    &__reply-label {
        font-size: 21rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__result {
        &--ok {
            border: 1rpx solid var(--hy-success, #07c160);
            background: var(--hy-success--light, rgba(7, 193, 96, 0.06));
        }

        &--fail {
            border: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));
        }
    }

    &__result-text {
        font-size: 25rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.7;
    }

    &__actions {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        gap: 20rpx;
        padding: 16rpx 24rpx;
        @include hy-safe-bottom(16rpx);
        background: var(--hy-background--container, #ffffff);
        box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.06);
    }
}

@keyframes cd-fade-up {
    from {
        opacity: 0;
        transform: translateY(24rpx);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 确认弹层 */
.complaint__modal-mask {
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

.complaint__modal {
    width: 560rpx;
    background: #fff;
    border-radius: 24rpx;
    padding: 44rpx 36rpx 32rpx;
    display: flex;
    flex-direction: column;
    animation: cd-modal-in 0.25s ease-out both;
}

.complaint__modal-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2329;
    text-align: center;
}

.complaint__modal-content {
    margin-top: 20rpx;
    font-size: 26rpx;
    line-height: 1.7;
    color: #46464a;
    text-align: center;
}

.complaint__modal-btns {
    display: flex;
    gap: 20rpx;
    margin-top: 36rpx;
}

.complaint__modal-btn {
    flex: 1;
    height: 84rpx;
    border-radius: 42rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 500;

    &--cancel {
        background: #f2f3f5;
        color: #646a73;
    }

    &--confirm {
        background: linear-gradient(135deg, #3d7eff 0%, #6fa0ff 100%);
        color: #fff;
        box-shadow: 0 8rpx 20rpx rgba(61, 126, 255, 0.3);
    }
}

@keyframes cd-modal-in {
    from {
        opacity: 0;
        transform: scale(0.92) translateY(24rpx);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}
</style>
