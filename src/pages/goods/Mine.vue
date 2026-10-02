<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import GoodsCard from '@/components/GoodsCard.vue';
import { getMyGoodsApi } from '@/api';
import { useUserStore } from '@/store';
import { ensureLoginAndSchool } from '@/utils/guard';
import type { Goods } from '@/types';
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '我发布的',
    },
});

const userStore = useUserStore();

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
            <view
                v-if="!userStore.hasLogin || !userStore.hasSchool"
                class="my-goods__guard"
            >
                <view class="my-goods__guard-logo">
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
                <text class="my-goods__guard-title">{{
                    userStore.hasLogin ? '先选择你的学校' : '登录后查看发布'
                }}</text>
                <text class="my-goods__guard-desc">{{
                    userStore.hasLogin
                        ? '选择学校后可管理你发布的商品'
                        : '登录后可管理你发布的商品'
                }}</text>
                <view
                    class="my-goods__guard-btn"
                    hover-class="my-goods__guard-btn--hover"
                    :hover-stay-time="120"
                    @tap="goGuard"
                    >{{ userStore.hasLogin ? '去选择' : '去登录' }}</view
                >
            </view>
            <template v-else>
            <!-- 顶部发布入口 -->
            <view class="my-goods__header">
                <view class="my-goods__total">
                    共
                    <text class="my-goods__num">{{ list.length }}</text> 件商品
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

            <!-- 状态筛选（吸顶，滚动时保持可见） -->
            <view class="my-goods__filter">
                <hy-tabs
                    :list="TABS"
                    :current="current"
                    key-name="name"
                    @change="onTabChange"
                ></hy-tabs>
            </view>

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
            </template>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.my-goods {
    min-height: 100vh;
    padding-bottom: 40rpx;

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

    &__loading {
        padding: 24rpx;
        animation: my-goods-fade-up 0.45s ease 0.06s both;
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        padding: 24rpx;
        animation: my-goods-fade-up 0.45s ease 0.06s both;
    }

    &__legend {
        text-align: center;
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
        padding: 8rpx 0 24rpx;
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
