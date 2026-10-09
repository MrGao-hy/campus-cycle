<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import GoodsCard from '@/components/GoodsCard.vue';
import {
    getMyGoodsApi,
    offShelfGoodsApi,
    onShelfGoodsApi,
    deleteGoodsApi,
} from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@/utils/toast';
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
const toast = useToast();

const list = ref<Goods[]>([]);
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

/**
 * 下架 / 重新上架：仅 ON_SALE / OFF_SHELF 可操作（交易中、已售出不展示操作条）。
 * 二次确认后调接口并刷新列表。
 */
const onToggleShelf = (goods: Goods) => {
    const isOff = goods.status === 'OFF_SHELF';
    uni.showModal({
        title: isOff ? '重新上架' : '下架商品',
        content: isOff
            ? '确认将商品重新上架展示吗？'
            : '下架后买家将不可见，可随时重新上架',
        confirmText: isOff ? '重新上架' : '下架',
        cancelText: '再想想',
        success: async res => {
            if (!res.confirm) return;
            try {
                if (isOff) {
                    await onShelfGoodsApi(goods.id);
                    toast.success('已重新上架');
                } else {
                    await offShelfGoodsApi(goods.id);
                    toast.success('已下架');
                }
                await load();
            } catch (e) {
                toast.error((e as Error).message || '操作失败，请重试');
            }
        },
    });
};

/** 删除商品：二次确认（不可恢复）后调接口并刷新列表 */
const onDelete = (goods: Goods) => {
    uni.showModal({
        title: '删除商品',
        content: '删除后不可恢复，确认删除该商品吗？',
        confirmText: '删除',
        cancelText: '再想想',
        confirmColor: '#f53f3f',
        success: async res => {
            if (!res.confirm) return;
            try {
                await deleteGoodsApi(goods.id);
                toast.success('已删除');
                await load();
            } catch (e) {
                toast.error((e as Error).message || '删除失败，请重试');
            }
        },
    });
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

            <!-- 列表（已售出置灰不隐藏；在售/已下架卡片下方显示操作条） -->
            <view v-if="loading" class="my-goods__loading">
                <hy-skeleton
                    theme="paragraph"
                    :row-col="[1, 2, 2]"
                    animation="gradient"
                ></hy-skeleton>
            </view>
            <view v-else-if="filtered.length" class="my-goods__list">
                <view
                    v-for="item in filtered"
                    :key="item.id"
                    class="my-goods__cell"
                >
                    <goods-card
                        :goods="item"
                        @click="goDetail(item)"
                    ></goods-card>
                    <!-- 操作条：仅可操作状态展示（在售可下架/删除，已下架可重新上架/删除） -->
                    <view
                        v-if="
                            item.status === 'ON_SALE' ||
                            item.status === 'OFF_SHELF'
                        "
                        class="my-goods__ops"
                        @tap.stop
                    >
                        <view
                            class="my-goods__op"
                            hover-class="my-goods__op--hover"
                            @tap="onToggleShelf(item)"
                        >
                            <text>{{
                                item.status === 'OFF_SHELF'
                                    ? '重新上架'
                                    : '下架'
                            }}</text>
                        </view>
                        <view
                            class="my-goods__op my-goods__op--danger"
                            hover-class="my-goods__op--hover"
                            @tap="onDelete(item)"
                        >
                            <text>删除</text>
                        </view>
                    </view>
                </view>
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
                    {{ countOf('LOCKED') }} · 已售出 {{ countOf('SOLD') }} ·
                    已下架 {{ countOf('OFF_SHELF') }}</text
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

    /* 商品单元：卡片 + 操作条（宽度与 GoodsCard 对齐：calc(50% - 10rpx)） */
    &__cell {
        width: calc(50% - 10rpx);
        margin-bottom: 24rpx;
        display: flex;
        flex-direction: column;
    }

    /* 操作条：白底圆角，下架/删除两按钮左右均分 */
    &__ops {
        display: flex;
        margin-top: 12rpx;
        background: #ffffff;
        border-radius: 14rpx;
        padding: 8rpx;
        gap: 8rpx;
    }

    &__op {
        flex: 1;
        height: 60rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10rpx;
        background: var(--primary-light, rgba(61, 126, 255, 0.08));
        font-size: 24rpx;
        font-weight: 500;
        color: var(--primary, #3d7eff);

        &--danger {
            background: rgba(245, 63, 63, 0.08);
            color: #f53f3f;
        }

        &--hover {
            opacity: 0.75;
        }
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
