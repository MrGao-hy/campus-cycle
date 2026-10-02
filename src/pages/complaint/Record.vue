<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import {
    getComplaintsAgainstMeApi,
    getMyAppealsApi,
    getMyComplaintsApi,
} from '@/api';
import { useToast } from '@/utils/toast';
import {
    APPEAL_STATUS_TAG,
    APPEAL_STATUS_TEXT,
    COMPLAINT_STATUS_TAG,
    COMPLAINT_STATUS_TEXT,
    type AppealRow,
    type ComplaintRow,
} from '@/types';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { fmtFullTime } from '@/utils/format';

definePage({
    style: {
        navigationBarTitleText: '投诉与申诉记录',
    },
});

const toast = useToast();

const current = ref(0);
const tabs = [
    { name: '我的投诉' },
    { name: '被投诉记录' },
    { name: '申诉记录' },
];

const loading = ref(true);
const myComplaints = ref<ComplaintRow[]>([]);
const againstMe = ref<ComplaintRow[]>([]);
const myAppeals = ref<AppealRow[]>([]);

const load = async () => {
    loading.value = true;
    try {
        const [mine, received, appealRows] = await Promise.all([
            getMyComplaintsApi(),
            getComplaintsAgainstMeApi(),
            getMyAppealsApi(),
        ]);
        myComplaints.value = mine;
        againstMe.value = received;
        myAppeals.value = appealRows;
    } catch (e) {
        toast.error((e as Error).message || '加载失败');
    }
    loading.value = false;
};

onLoad(options => {
    const tab = Number(options?.tab);
    if (tab >= 0 && tab <= 2) current.value = tab;
});
onShow(load);

const goDetail = (complaintId: string) => {
    uni.navigateTo({ url: `/pages/complaint/Detail?id=${complaintId}` });
};
</script>

<template>
    <the-root-pages>
        <view class="crd">
            <!-- Tab 切换 -->
            <view class="crd__tabs">
                <hy-tabs
                    v-model:current="current"
                    :list="tabs"
                    :scrollable="false"
                    line-width="24"
                ></hy-tabs>
            </view>

            <!-- 我的投诉 -->
            <template v-if="current === 0">
                <hy-empty
                    v-if="!loading && !myComplaints.length"
                    mode="order"
                    description="暂无投诉记录"
                ></hy-empty>
                <view
                    v-for="c in myComplaints"
                    :key="c.complaint.id"
                    class="crd__card"
                    hover-class="crd__card--hover"
                    :hover-stay-time="120"
                    @tap="goDetail(c.complaint.id)"
                >
                    <view class="crd__head">
                        <hy-tag
                            :label="c.complaint.type"
                            type="error"
                            plain
                            size="mini"
                        />
                        <hy-tag
                            :label="COMPLAINT_STATUS_TEXT[c.complaint.status]"
                            :type="
                                COMPLAINT_STATUS_TAG[c.complaint.status].type
                            "
                            :plain="
                                COMPLAINT_STATUS_TAG[c.complaint.status].plain
                            "
                            size="mini"
                        />
                    </view>
                    <view class="crd__title"
                        >对 {{ c.peerName || '该用户' }} 的投诉</view
                    >
                    <view v-if="c.complaint.goodsTitle" class="crd__goods">{{
                        c.complaint.goodsTitle
                    }}</view>
                    <view class="crd__content">{{ c.complaint.content }}</view>
                    <view class="crd__foot">
                        <text>{{ fmtFullTime(c.complaint.time) }}</text>
                        <view class="crd__more">
                            <text>查看进度</text>
                            <hy-icon
                                name="/static/icons/right.png"
                                color="var(--hy-text-color--3, #929295)"
                                :size="12"
                            />
                        </view>
                    </view>
                </view>
            </template>

            <!-- 被投诉记录 -->
            <template v-if="current === 1">
                <hy-empty
                    v-if="!loading && !againstMe.length"
                    mode="order"
                    description="没有被投诉记录，继续保持良好交易习惯"
                ></hy-empty>
                <view
                    v-for="c in againstMe"
                    :key="c.complaint.id"
                    class="crd__card"
                    hover-class="crd__card--hover"
                    :hover-stay-time="120"
                    @tap="goDetail(c.complaint.id)"
                >
                    <view class="crd__head">
                        <hy-tag
                            :label="c.complaint.type"
                            type="error"
                            plain
                            size="mini"
                        />
                        <hy-tag
                            :label="COMPLAINT_STATUS_TEXT[c.complaint.status]"
                            :type="
                                COMPLAINT_STATUS_TAG[c.complaint.status].type
                            "
                            :plain="
                                COMPLAINT_STATUS_TAG[c.complaint.status].plain
                            "
                            size="mini"
                        />
                    </view>
                    <view class="crd__title"
                        >来自 {{ c.fromName || '用户' }} 的投诉</view
                    >
                    <view v-if="c.complaint.goodsTitle" class="crd__goods">{{
                        c.complaint.goodsTitle
                    }}</view>
                    <view class="crd__content">{{ c.complaint.content }}</view>
                    <view
                        v-if="
                            (c.complaint.status === 'PENDING' ||
                                c.complaint.status === 'PROCESSING') &&
                            !c.appeals?.length
                        "
                        class="crd__appeal-tip"
                    >
                        <hy-icon
                            name="/static/icons/remind.png"
                            color="var(--warning, #f9ae3d)"
                            :size="14"
                        />
                        <text>您尚未申诉，可在详情页提交申辩说明</text>
                    </view>
                    <view class="crd__foot">
                        <text>{{ fmtFullTime(c.complaint.time) }}</text>
                        <view class="crd__more">
                            <text>{{
                                c.appeals?.length ? '查看申诉' : '去处理'
                            }}</text>
                            <hy-icon
                                name="/static/icons/right.png"
                                color="var(--hy-text-color--3, #929295)"
                                :size="12"
                            />
                        </view>
                    </view>
                </view>
            </template>

            <!-- 申诉记录 -->
            <template v-if="current === 2">
                <hy-empty
                    v-if="!loading && !myAppeals.length"
                    mode="comment"
                    description="暂无申诉记录"
                ></hy-empty>
                <view
                    v-for="a in myAppeals"
                    :key="a.appeal.id"
                    class="crd__card"
                    hover-class="crd__card--hover"
                    :hover-stay-time="120"
                    @tap="goDetail(a.appeal.complaintId)"
                >
                    <view class="crd__head">
                        <hy-tag
                            v-if="a.complaint"
                            :label="a.complaint.type"
                            type="error"
                            plain
                            size="mini"
                        />
                        <hy-tag
                            :label="APPEAL_STATUS_TEXT[a.appeal.status]"
                            :type="APPEAL_STATUS_TAG[a.appeal.status].type"
                            :plain="APPEAL_STATUS_TAG[a.appeal.status].plain"
                            size="mini"
                        />
                    </view>
                    <view class="crd__title"
                        >对「{{ a.complaint?.type || '投诉' }}」的申诉</view
                    >
                    <view class="crd__goods"
                        >投诉人：{{ a.complainantName || '用户' }}</view
                    >
                    <view class="crd__content">{{ a.appeal.content }}</view>
                    <view v-if="a.appeal.reply" class="crd__reply">
                        <text class="crd__reply-label">平台审核意见</text>
                        <text>{{ a.appeal.reply }}</text>
                    </view>
                    <view class="crd__foot">
                        <text>{{ fmtFullTime(a.appeal.time) }}</text>
                        <view class="crd__more">
                            <text>查看详情</text>
                            <hy-icon
                                name="/static/icons/right.png"
                                color="var(--hy-text-color--3, #929295)"
                                :size="12"
                            />
                        </view>
                    </view>
                </view>
            </template>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;

.crd {
    min-height: 100vh;
    padding-bottom: 40rpx;

    &__tabs {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--hy-background--container, #ffffff);
    }

    &__card {
        @include hy-card(20rpx);
        padding: 24rpx;
        margin: 20rpx 24rpx 0;
        transition: transform 0.15s ease;
        animation: crd-fade-up 0.4s ease both;
    }

    &__card--hover {
        transform: scale(0.98);
    }

    &__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12rpx;
        margin-bottom: 16rpx;
    }

    &__title {
        font-size: 29rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        margin-bottom: 8rpx;
    }

    &__goods {
        font-size: 23rpx;
        color: var(--hy-text-color--3, #929295);
        margin-bottom: 8rpx;
    }

    &__content {
        font-size: 25rpx;
        color: var(--hy-text-color--2, #46464a);
        line-height: 1.6;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
    }

    &__appeal-tip {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-top: 16rpx;
        padding: 14rpx 20rpx;
        border-radius: 12rpx;
        background: var(--warning-light, rgba(249, 174, 61, 0.1));
        font-size: 23rpx;
        color: var(--warning, #f9ae3d);
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

    &__foot {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 18rpx;
        padding-top: 18rpx;
        border-top: 1rpx solid var(--hy-text-color--4, rgba(0, 0, 0, 0.1));
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__more {
        display: flex;
        align-items: center;
        gap: 4rpx;
        color: var(--primary, #3d7eff);
    }
}

@keyframes crd-fade-up {
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
