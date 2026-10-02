<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import GoodsCard from '@/components/GoodsCard.vue';
import { getGoodsListApi } from '@/api';
import { useUserStore } from '@/store';
import { ensureSchool } from '@/utils/guard';
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
    // 浏览无需登录：仅需选择学校（未登录也可浏览本校商品）
    if (!ensureSchool()) return;
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

const goLogin = () => {
    uni.navigateTo({ url: '/pages/login/Index' });
};

const goProfile = () => {
    uni.navigateTo({ url: '/pages/profile/Index' });
};

const goSecurity = () => {
    uni.navigateTo({ url: '/pages/security/Index' });
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
                        name="/static/icons/school-cap.png"
                        :size="16"
                    />
                    <text class="home__school-name">{{
                        userStore.school?.name || '选择学校'
                    }}</text>
                    <hy-icon
                        name="/static/icons/down.png"
                        color="var(--hy-text-color--3, #929295)"
                        :size="12"
                    />
                </view>

                <!-- 用户区：已登录头像 / 未登录登录入口 -->
                <view
                    v-if="userStore.hasLogin"
                    class="home__user"
                    @tap="goProfile"
                >
                    <hy-avatar
                        :text="
                            userStore.userInfo?.nickname.slice(0, 1) || '同'
                        "
                        random-bg-color
                        :name="userStore.userInfo?.nickname"
                        :size="26"
                    />
                </view>
                <view v-else class="home__user-login" @tap="goLogin">
                    <text>登录</text>
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

                <!-- 安全提醒（自定义静态播报条：hy-notice-bar row 模式滚动起点留白、
                     column 模式小程序端单条不渲染，弃用该组件） -->
                <view class="home__safety" @tap="goSecurity">
                    <hy-icon
                        name="/static/icons/warning.png"
                        :size="16"
                    />
                    <text class="home__safety-text"
                        >交易安全提醒：请选择校内公共场所当面交易，勿提前转账，勿脱离平台沟通</text
                    >
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

    /* 高度：小程序 tabBar 页 page 高度链不可靠（page 默认随内容自适应，
       height:100% 会解析为 auto → 内容超高时整页含 header 一起滚动）；
       改用视口计算：100vh 含 tabBar，减 tabBar 高（100rpx + 安全区）固定高度，
       scroll-view 在 flex 剩余空间内滚动，header 天然吸顶 */
    /* #ifdef MP-WEIXIN */
    height: calc(100vh - 100rpx - env(safe-area-inset-bottom));
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

    &__user {
        margin-left: auto;
        display: flex;
        align-items: center;
    }

    &__user-login {
        margin-left: auto;
        height: 56rpx;
        padding: 0 28rpx;
        border-radius: 28rpx;
        background: rgba(255, 255, 255, 0.9);
        border: 1rpx solid rgba(61, 126, 255, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;

        text {
            font-size: 24rpx;
            font-weight: 600;
            color: var(--primary, #3d7eff);
        }
    }

    &__search {
        margin: 20rpx 24rpx 16rpx;
    }

    &__safety {
        margin: 20rpx 24rpx 32rpx;
        padding: 14rpx 20rpx;
        display: flex;
        align-items: center;
        gap: 10rpx;
        background: rgba(249, 174, 61, 0.1);
        border-radius: 12rpx;

        &-text {
            flex: 1;
            font-size: 22rpx;
            line-height: 1.5;
            color: var(--warning, #f9ae3d);
        }
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
