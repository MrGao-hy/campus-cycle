<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import GoodsCard from '@/components/GoodsCard.vue';
import { getGoodsListApi } from '@/api';
import { useUserStore } from '@/store';
import { ensureLoginAndSchool } from '@/utils/guard';
import { GOODS_CATEGORIES, type Goods } from '@/types';
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
            <!-- 固定头部：学校 + 搜索 + 分类 + 安全提醒（不随列表滚动，
                 天然"吸顶"，彻底规避小程序 WKWebView sticky/fixed 穿透） -->
            <view class="home__header">
                <view class="home__school" @tap="goSchool">
                    <hy-icon
                        name="/static/icons/location.png"
                        :size="13"
                    />
                    <text class="home__school-name">{{
                        userStore.school?.name || '选择学校'
                    }}</text>
                    <hy-icon
                        name="down"
                        color="var(--hy-text-color--3, #929295)"
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
                <view class="home__filter">
                    <hy-tabs
                        :list="GOODS_CATEGORIES.map(name => ({ name }))"
                        :current="category"
                        :scrollable="true"
                        @change="onTabChange"
                    ></hy-tabs>
                </view>

                <!-- 安全提醒 -->
                <view class="home__safety">
                    <hy-notice-bar
                        :text="[
                            '交易安全提醒：请选择校内公共场所当面交易，勿提前转账，勿脱离平台沟通',
                        ]"
                        direction="column"
                        color="var(--warning, #f9ae3d)"
                        bg-color="var(--warning-light, rgba(249,174,61,0.1))"
                        url="/pages/security/Index"
                    ></hy-notice-bar>
                </view>
            </view>

            <!-- 商品列表（scroll-view 原生滚动，内容从头部下方开始） -->
            <scroll-view class="home__scroll" scroll-y>
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
            </scroll-view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.home {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    /* 高度：小程序 tabBar 页 100vh 含 tabBar，需用 100% 跟随 page 视口链；
       H5 tabBar 为 fixed，减 --window-bottom */
    /* #ifdef MP-WEIXIN */
    height: 100%;
    /* #endif */
    /* #ifdef H5 */
    height: calc(100vh - var(--window-bottom, 0px));
    /* #endif */

    /* 固定头部（flex-shrink: 0，不随列表滚动） */
    &__header {
        flex-shrink: 0;
        background: #ffffff;
        z-index: 999;
    }

    /* 商品列表滚动区（scroll-view 原生滚动，双端稳定） */
    &__scroll {
        flex: 1;
        height: 0;
        padding-bottom: 40rpx;
        box-sizing: border-box;

        /* H5 端 uni scroll-view 默认触摸驱动，桌面滚轮不可用；
           覆盖为原生 overflow 滚动（MP 端为原生 scroll-view 不受影响） */
        /* #ifdef H5 */
        :deep(.uni-scroll-view) {
            overflow-y: auto !important;
            height: 100%;
            -webkit-overflow-scrolling: touch;
        }
        /* #endif */
    }

    /* 分类栏（固定头部内，天然吸顶） */
    &__filter {
        background: #ffffff;
        box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.04);
        margin-bottom: 8rpx;
    }

    &__school {
        display: flex;
        align-items: center;
        gap: 8rpx;
        padding: calc(var(--status-bar-height) + 40rpx) 32rpx 0;
        height: 80rpx;

        &--hover {
            opacity: 0.8;
        }
    }

    &__school-name {
        font-size: 30rpx;
        font-weight: 600;
    }

    &__search {
        margin: 20rpx 24rpx 16rpx;
    }

    &__safety {
        padding: 20rpx 24rpx 40rpx;
    }

    &__loading {
        padding: 24rpx;
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        padding: 24rpx 24rpx 0;
    }
}
</style>
