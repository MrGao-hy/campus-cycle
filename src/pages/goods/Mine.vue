<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import GoodsCard from '@/components/GoodsCard.vue';
import GoodsSkeleton from '@/components/GoodsSkeleton.vue';
import PageGuard from '@/components/PageGuard.vue';
import { getMyGoodsApi } from '@/api';
import { useUserStore } from '@/store';
import { ensureLoginAndSchool } from '@/utils/guard';
import type { IGoods } from '@/types';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '我发布的',
        // 下拉刷新：列表常用操作，原生下拉比按钮刷新更符合移动端习惯
        enablePullDownRefresh: true,
    },
});

const userStore = useUserStore();

const list = ref<IGoods[]>([]);
// 初始 false：未登录/未选校时 onShow 直接 return，若初始 true 骨架屏永远转
const loading = ref(false);
const current = ref(0);

const TABS = [
    { name: '全部', status: '' },
    { name: '在售', status: 'ON_SALE' },
    { name: '交易中', status: 'LOCKED' },
    { name: '已售出', status: 'SOLD' },
    { name: '已下架', status: 'OFF_SHELF' },
];

const filtered = computed(() => {
    const st = TABS[current.value].status;
    return st ? list.value.filter(g => g.status === st) : list.value;
});

const countOf = (status: string) =>
    list.value.filter(g => g.status === status).length;

const load = async () => {
    loading.value = true;
    list.value = await getMyGoodsApi();
    loading.value = false;
};

onShow(() => {
    if (!ensureLoginAndSchool()) return;
    load();
});

/** 下拉刷新 */
onPullDownRefresh(async () => {
    try {
        await load();
    } finally {
        uni.stopPullDownRefresh();
    }
});

const onTabChange = (_item: { name: string }, index: number) => {
    current.value = index;
};

const goDetail = (goods: IGoods) => {
    uni.navigateTo({ url: `/pages/goods/Detail?id=${goods.id}` });
};

const goPublish = () => {
    uni.navigateTo({ url: '/pages/goods/Publish' });
};

/** 守卫页权益点（仅展示，无业务含义） */
const guardTips = [
    '在售 / 已售商品一键管理',
    '支持下架、删除，随时调整',
    '交易完成自动结算手续费',
];

/** 底部状态统计：状态色标与全站 tag 语义一致（绿=正常，橙=进行中，灰=终态） */
const LEGEND = [
    { label: '在售', status: 'ON_SALE', color: '#07c160' },
    { label: '交易中', status: 'LOCKED', color: '#f9ae3d' },
    { label: '已售出', status: 'SOLD', color: '#929295' },
    { label: '已下架', status: 'OFF_SHELF', color: '#c0c4cc' },
] as const;

/** 未登录/未选校引导：守卫只判断不跳转（避免返回死循环） */
const goGuard = () => {
    if (!userStore.hasLogin) {
        uni.navigateTo({ url: '/pages/login/Index' });
        return;
    }
    uni.navigateTo({ url: '/pages/school/Index' });
};
</script>

<template>
    <the-root-pages>
        <view class="my-goods">
            <!-- 未登录/未选校：引导态（守卫不强制跳转，避免返回死循环） -->
            <page-guard
                v-if="!userStore.hasLogin || !userStore.hasSchool"
                :icon="
                    userStore.hasLogin
                        ? '/static/icons/school-cap.png'
                        : '/static/icons/lock.png'
                "
                :title="
                    userStore.hasLogin ? '先选择你的学校' : '登录后查看发布'
                "
                :desc="
                    userStore.hasLogin
                        ? '选择学校后可管理你发布的商品'
                        : '登录后可管理你发布的商品'
                "
                :button-text="userStore.hasLogin ? '去选择' : '去登录'"
                :tips="guardTips"
                @action="goGuard"
            ></page-guard>
            <template v-else>
                <!-- 顶部发布入口 -->
                <view class="my-goods__header">
                    <view class="my-goods__total">
                        共
                        <text class="my-goods__num">{{ list.length }}</text>
                        件商品
                    </view>
                    <hy-button
                        size="small"
                        shape="circle"
                        :icon="{ name: 'plus', color: '#ffffff' }"
                        hover-class="none"
                        :custom-style="{
                            background: 'rgba(255, 255, 255, 0.22)',
                            color: '#ffffff',
                            border: '1rpx solid rgba(255, 255, 255, 0.5)',
                        }"
                        @click="goPublish"
                    >
                        发布商品
                    </hy-button>
                </view>

                <!-- 状态筛选（吸顶，滚动时保持可见；5 个短标签均分整行，无需滚动） -->
                <view class="my-goods__filter">
                    <hy-tabs
                        :list="TABS"
                        :current="current"
                        key-name="name"
                        :scrollable="false"
                        :active-style="{ fontWeight: '600' }"
                        @change="onTabChange"
                    ></hy-tabs>
                </view>

                <!-- 列表（已售出置灰不隐藏；下架/上架/删除操作在商品详情页进行）
                     用法与首页一致：goods-card 自适应两列，不再包额外布局层 -->
                <goods-skeleton v-if="loading"></goods-skeleton>
                <view v-else-if="filtered.length" class="my-goods__list">
                    <goods-card
                        v-for="item in filtered"
                        :key="item.id"
                        :goods="item"
                        @click="goDetail(item)"
                    ></goods-card>
                </view>
                <hy-empty
                    v-else
                    mode="shop"
                    :description="
                        current === 0
                            ? '还没有发布过商品，去发布一件吧'
                            : '该状态下暂无商品'
                    "
                ></hy-empty>

                <!-- 状态说明：彩色圆点 + 数量，一眼扫出库存结构 -->
                <view v-if="!loading && list.length" class="my-goods__legend">
                    <view
                        v-for="leg in LEGEND"
                        :key="leg.status"
                        class="my-goods__legend-item"
                    >
                        <view
                            class="my-goods__legend-dot"
                            :style="{ background: leg.color }"
                        ></view>
                        <text class="my-goods__legend-text"
                            >{{ leg.label }} {{ countOf(leg.status) }}</text
                        >
                    </view>
                </view>
            </template>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.my-goods {
    min-height: 100vh;
    @include hy-safe-bottom(40rpx);

    &__header {
        @include hy-gradient-header(135deg, 0 0 32rpx 32rpx);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 36rpx 32rpx;
        animation: my-goods-fade-up 0.45s ease both;
    }

    &__filter {
        position: sticky;
        top: 0;
        z-index: 50;
        background: var(--hy-background-color, #f5f6f8);
        padding-bottom: 4rpx;
    }

    &__total {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.85);
    }

    &__num {
        font-size: 44rpx;
        font-weight: 700;
        color: #ffffff;
        margin: 0 6rpx;
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        padding: 24rpx 24rpx 0;
    }

    &__legend {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12rpx 32rpx;
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
        padding: 8rpx 24rpx 24rpx;
    }

    &__legend-item {
        display: flex;
        align-items: center;
        gap: 8rpx;
    }

    &__legend-dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        flex-shrink: 0;
    }

    /* 未登录/未选校引导态已抽离为 PageGuard 组件 */
}

@keyframes my-goods-fade-up {
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
