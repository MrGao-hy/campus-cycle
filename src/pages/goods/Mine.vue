<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import GoodsCard from '@/components/GoodsCard.vue';
import { getMyGoodsApi } from '@/api';
import { useUserStore } from '@/store';
import { ensureLoginAndSchool } from '@/utils/guard';
import type { Goods } from '@/types';
import { onShow } from '@dcloudio/uni-app';
import { usePageShare } from '@/hooks/useShare';
import { computed, ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '我发布的',
    },
});

const userStore = useUserStore();

// 全局分享（hy-app useShare 封装）
const { onShareAppMessage, onShareTimeline } = usePageShare();
defineExpose({ onShareAppMessage, onShareTimeline });

const list = ref<Goods[]>([]);
const loading = ref(true);
const current = ref(0);

const TABS = [
    { name: '全部', status: '' },
    { name: '在售', status: 'ON_SALE' },
    { name: '交易中', status: 'LOCKED' },
    { name: '已售出', status: 'SOLD' },
];

const filtered = computed(() => {
    const st = TABS[current.value].status;
    return st ? list.value.filter(g => g.status === st) : list.value;
});

const countOf = (status: string) =>
    list.value.filter(g => g.status === status).length;

const load = async () => {
    loading.value = true;
    list.value = await getMyGoodsApi(userStore.userInfo?.id);
    loading.value = false;
};

onShow(() => {
    if (!ensureLoginAndSchool()) return;
    load();
});

const onTabChange = (_item: { name: string }, index: number) => {
    current.value = index;
};

const goDetail = (goods: Goods) => {
    uni.navigateTo({ url: `/pages/goods/Detail?id=${goods.id}` });
};

const goPublish = () => {
    uni.navigateTo({ url: '/pages/goods/Publish' });
};
</script>

<template>
    <the-root-pages>
        <view class="my-goods">
            <!-- 顶部发布入口 -->
            <view class="my-goods__header">
                <view class="my-goods__total">
                    共
                    <text class="my-goods__num">{{ list.length }}</text> 件商品
                </view>
                <hy-button
                    type="primary"
                    size="small"
                    shape="circle"
                    :icon="{ name: 'plus' }"
                    @click="goPublish"
                >
                    发布商品
                </hy-button>
            </view>

            <!-- 状态筛选 -->
            <hy-tabs
                :list="TABS"
                :current="current"
                key-name="name"
                @change="onTabChange"
            ></hy-tabs>

            <!-- 列表（已售出置灰不隐藏） -->
            <view v-if="loading" class="my-goods__loading">
                <hy-skeleton
                    theme="paragraph"
                    :row-col="[1, 2, 2]"
                    animation="gradient"
                ></hy-skeleton>
            </view>
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

            <!-- 状态说明 -->
            <view v-if="!loading && list.length" class="my-goods__legend">
                <text
                    >在售 {{ countOf('ON_SALE') }} · 交易中
                    {{ countOf('LOCKED') }} · 已售出 {{ countOf('SOLD') }}</text
                >
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.my-goods {
    min-height: 100vh;
    padding-bottom: 40rpx;

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24rpx 32rpx;
    }

    &__total {
        font-size: 26rpx;
        color: var(--hy-info-color, #909193);
    }

    &__num {
        font-size: 32rpx;
        font-weight: 600;
        color: var(--hy-primary-color, #3d7eff);
    }

    &__loading {
        padding: 24rpx;
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        padding: 24rpx;
    }

    &__legend {
        text-align: center;
        font-size: 22rpx;
        color: var(--hy-info-color, #909193);
        padding: 8rpx 0 24rpx;
    }
}
</style>
