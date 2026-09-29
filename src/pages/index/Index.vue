<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import GoodsCard from '@/components/GoodsCard.vue';
import { getGoodsListApi } from '@/api';
import { useUserStore } from '@/store';
import { ensureLoginAndSchool } from '@/utils/guard';
import { GOODS_CATEGORIES, type Goods } from '@/types';
import { usePageShare } from '@/hooks/useShare';
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';

definePage({
    style: {
        navigationStyle: 'custom',
    },
    type: 'home',
});

const userStore = useUserStore();

const keyword = ref('');
const category = ref(0);
const list = ref<Goods[]>([]);
const loading = ref(true);

const loadList = async () => {
    if (!userStore.school) return;
    loading.value = true;
    list.value = await getGoodsListApi({
        schoolId: userStore.school.id,
        keyword: keyword.value,
        category: GOODS_CATEGORIES[category.value],
    });
    loading.value = false;
};

onShow(() => {
    if (!ensureLoginAndSchool()) return;
    loadList();
});

const onSearch = (value: string) => {
    keyword.value = value;
    loadList();
};

const onTabChange = (item: { name: string }, index: number) => {
    category.value = index;
    loadList();
};

const goDetail = (goods: Goods) => {
    uni.navigateTo({ url: `/pages/goods/Detail?id=${goods.id}` });
};

const goSchool = () => {
    uni.navigateTo({ url: '/pages/school/Index' });
};
</script>

<template>
    <the-root-pages>
        <view class="home">
            <hy-sticky>
                <!-- 学校切换 -->
                <view class="home__school" @tap="goSchool">
                    <hy-icon
                        name="map-fill"
                        color="var(--hy-primary-color)"
                        :size="18"
                    />
                    <text class="home__school-name">{{
                        userStore.school?.name || '选择学校'
                    }}</text>
                    <hy-icon
                        name="down"
                        color="var(--hy-info-color)"
                        :size="12"
                    />
                </view>

                <!-- 搜索 -->
                <view class="home__search">
                    <hy-search
                        v-model="keyword"
                        placeholder="搜索本校二手好物"
                        :show-action="false"
                        @search="
                            (_e: unknown, value: string) => onSearch(value)
                        "
                        @confirm="onSearch"
                        @clear="loadList"
                    ></hy-search>
                </view>

                <!-- 分类 -->
                <hy-tabs
                    :list="GOODS_CATEGORIES.map(name => ({ name }))"
                    :current="category"
                    :scrollable="true"
                    @change="onTabChange"
                ></hy-tabs>
            </hy-sticky>

            <!-- 安全提醒（商品页强制展示） -->
            <view class="home__safety">
                <hy-notice-bar
                    :text="[
                        '交易安全提醒：请选择校内公共场所当面交易，勿提前转账，勿脱离平台沟通',
                    ]"
                    color="var(--hy-warning-color, #f9ae3d)"
                    bg-color="var(--hy-warning-light, rgba(249,174,61,0.1))"
                    url="/pages/security/Index"
                ></hy-notice-bar>
            </view>

            <!-- 商品双列列表（已售出置灰不隐藏） -->
            <view v-if="loading" class="home__loading">
                <hy-skeleton
                    theme="paragraph"
                    :row-col="[1, 2, 2]"
                    animation="gradient"
                ></hy-skeleton>
            </view>
            <view v-else-if="list.length" class="home__list">
                <goods-card
                    v-for="item in list"
                    :key="item.id"
                    :goods="item"
                    @click="goDetail(item)"
                ></goods-card>
            </view>
            <hy-empty
                v-else
                mode="shop"
                description="本校暂无相关商品，去发布一件吧"
            ></hy-empty>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.home {
    min-height: 100vh;
    padding-bottom: 40rpx;

    &__school {
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: calc(var(--status-bar-height) + 40rpx) 32rpx 0;
        height: 80rpx;
    }

    &__school-name {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--hy-main-color, #303133);
    }

    &__search {
        padding: 20rpx 24rpx 0;
    }

    &__safety {
        padding: 20rpx 24rpx 0;
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
}
</style>
