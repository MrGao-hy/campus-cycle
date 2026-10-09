<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import GoodsCard from '@/components/GoodsCard.vue';
import { getGoodsListApi, confirmSchoolApi, GOODS_PAGE_SIZE } from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@/utils/toast';
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
const toast = useToast();

const keyword = ref('');
const category = ref(0);
const list = ref<Goods[]>([]);
// loading 初始必须为 false：未登录/未选校时 onShow 直接 return 不调 loadList，
// 若初始 true 骨架屏会永远转且挡住引导态；loadList 内部会置 true
const loading = ref(false);
// 触底加载中（与首屏 loading 分开：底部显示"加载中"，不遮挡已有列表）
const loadingMore = ref(false);
// 下拉刷新中（驱动 scroll-view 的 refresher-triggered）
const refreshing = ref(false);
const pageNum = ref(1);
const hasMore = ref(false);

/**
 * 加载商品（schoolId 不传：后端从登录用户绑定的学校取）
 * @param append true=触底追加（pageNum 已由调用方 +1）；false=重置为第一页
 */
const loadList = async (append = false) => {
    if (!userStore.school) return;
    // 触底加载去重：首屏加载中 / 上一次触底未结束 / 已无更多数据 时直接忽略
    if (append && (loading.value || loadingMore.value || !hasMore.value)) {
        return;
    }
    if (append) {
        loadingMore.value = true;
    } else {
        loading.value = true;
        pageNum.value = 1;
    }
    try {
        const res = await getGoodsListApi({
            keyword: keyword.value,
            category: GOODS_CATEGORIES[category.value],
            pageNum: pageNum.value,
            pageSize: GOODS_PAGE_SIZE,
        });
        // 兼容后端返回数组（未升级分页接口时）：统一归一成 {list, hasMore}
        // 否则 res.list 为 undefined → list.value 变 undefined → 模板 list.length
        // 抛错 → 渲染中断 → 页面永远停在骨架屏（表现为"一直在 loading"）
        const rows = Array.isArray(res)
            ? (res as unknown as Goods[])
            : (res?.list ?? []);
        list.value = append ? list.value.concat(rows) : rows;
        hasMore.value = Array.isArray(res)
            ? false
            : (res?.hasMore ?? false);
    } catch {
        // 追加失败保留已加载数据；整页刷新失败才清空
        if (!append) {
            list.value = [];
        }
        hasMore.value = false;
        toast.error('商品加载失败，请稍后重试');
    } finally {
        loading.value = false;
        loadingMore.value = false;
        refreshing.value = false;
    }
};

/** 下拉刷新：重置分页拉第一页 */
const onRefresh = () => {
    refreshing.value = true;
    loadList(false);
};

/** 触底加载下一页 */
const onScrollToLower = () => {
    if (!hasMore.value) return;
    pageNum.value += 1;
    loadList(true);
};

onShow(async () => {
    // 冷启动兜底：token/账号已绑定学校（userInfo.schoolId 有值）但 school 实体丢失
    // （清缓存/storage 异常/旧版本）时，自动恢复学校实体，避免首页一直停在引导态
    if (!userStore.school && userStore.userInfo?.schoolId) {
        try {
            const school = await confirmSchoolApi(userStore.userInfo.schoolId);
            userStore.setSchool(school);
        } catch {
            /* 恢复失败不阻塞，页面保留引导态，用户可手动选择 */
        }
    }
    // 商品列表依赖登录用户绑定的学校：未登录/未选校时不强制跳转（避免返回死循环），
    // 商品区引导登录/选择学校
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
    uni.navigateTo({
        url: '/pages/school/Index',
        fail: err => {
            console.error('[home] navigateTo /pages/school/Index 失败', err);
            toast.error(`打开失败：${err.errMsg || '未知错误'}`);
        },
    });
};

/** 未登录/未选校引导：守卫只判断不跳转，由按钮主动引导 */
const goGuard = () => {
    if (!userStore.hasLogin) {
        uni.navigateTo({ url: '/pages/login/Index' });
        return;
    }
    goSchool();
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
                <!-- 顶行：学校（左）+ 已登录头像（右，同排不单独占行，
                     与学校首字圆标明显区分） -->
                <view class="home__top">
                    <view
                        class="home__school"
                        hover-class="home__school--hover"
                        :hover-stay-time="120"
                        @tap="goSchool"
                    >
                        <view class="home__school-logo">{{
                            userStore.school?.shortName?.slice(0, 1) || '校'
                        }}</view>
                        <text class="home__school-name">{{
                            userStore.school?.name || '选择学校'
                        }}</text>
                        <hy-icon
                            name="/static/icons/down.png"
                            color="var(--hy-text-color--3, #929295)"
                            :size="12"
                        />
                    </view>

                    <!-- 用户区：已登录显示头像（未登录不常驻登录按钮，保持顶部干净；
                         登录入口在"我的"页引导卡，浏览中触发登录操作时再引导）
                         头像统一为图标/图片，不用首字圆标——与学校 logo（渐变首字）
                         视觉区分，避免误认为两个学校 logo -->
                    <view
                        v-if="userStore.hasLogin"
                        class="home__user"
                        @tap="goProfile"
                    >
                        <image
                            v-if="userStore.userInfo?.avatar"
                            :src="userStore.userInfo.avatar"
                            class="home__avatar"
                            mode="aspectFill"
                        />
                        <image
                            v-else
                            src="/static/icons/user.png"
                            class="home__avatar"
                            mode="aspectFill"
                        />
                    </view>
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
                    <hy-icon name="/static/icons/warning.png" :size="16" />
                    <text class="home__safety-text"
                        >交易安全提醒：请选择校内公共场所当面交易，勿提前转账，勿脱离平台沟通</text
                    >
                </view>
            </view>

            <!-- 未登录/未选校引导：必须放在 scroll-view 之外。
                 小程序端 scroll-view 是手势识别器，开启下拉刷新后内容不足一屏时，
                 下拉手势判定会吞掉内部子元素的 tap（表现为按钮点不动），
                 引导态本身也不需要滚动，独立展示即可 -->
            <view
                v-if="!userStore.hasLogin || !userStore.hasSchool"
                class="home__school-guide"
            >
                <view class="home__school-guide-logo">
                    <hy-icon
                        :name="
                            userStore.hasLogin
                                ? '/static/icons/check.png'
                                : '/static/icons/lock.png'
                        "
                        color="#fff"
                        :size="22"
                    />
                </view>
                <text class="home__school-guide-title">{{
                    userStore.hasLogin ? '先选择你的学校' : '登录后查看本校好物'
                }}</text>
                <text class="home__school-guide-desc">{{
                    userStore.hasLogin
                        ? '选择后仅展示本校商品，同校交易更安全'
                        : '登录并选择学校后，浏览同校二手好物'
                }}</text>
                <view
                    class="home__school-guide-btn"
                    hover-class="home__school-guide-btn--hover"
                    :hover-stay-time="120"
                    @tap="goGuard"
                    >{{ userStore.hasLogin ? '去选择' : '去登录' }}</view
                >
            </view>

            <!-- 商品列表（scroll-view 原生滚动，内容从头部下方开始；
                 下拉刷新与触底加载由 pageNum/hasMore 驱动。
                 refresher 仅在有数据时开启：空态下开启会让下拉手势抢占点击） -->
            <scroll-view
                v-else
                class="home__scroll"
                scroll-y
                :refresher-enabled="list.length > 0"
                :refresher-triggered="refreshing"
                refresher-background="#f5f6f8"
                @refresherrefresh="onRefresh"
                @scrolltolower="onScrollToLower"
            >
                <view v-if="loading" class="home__skeleton">
                    <view v-for="i in 4" :key="i" class="home__skeleton-card">
                        <view class="home__skeleton-img"></view>
                        <view class="home__skeleton-title"></view>
                        <view class="home__skeleton-price"></view>
                    </view>
                </view>
                <view v-else-if="list.length" class="home__list-wrap">
                    <view class="home__list">
                        <goods-card
                            v-for="item in list"
                            :key="item.id"
                            :goods="item"
                            @click="goDetail(item)"
                        ></goods-card>
                    </view>
                    <!-- 分页尾部：加载中 / 上拉提示 / 没有更多 -->
                    <view class="home__footer">
                        <text v-if="loadingMore" class="home__footer-text"
                            >加载中…</text
                        >
                        <text v-else-if="hasMore" class="home__footer-text"
                            >上拉加载更多</text
                        >
                        <text v-else class="home__footer-text">没有更多了</text>
                    </view>
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
       改用视口计算：100vh 含 tabBar，减 tabBar 实际高（--window-bottom，
       uni 在 MP 端注入，含安全区，比 100rpx+safe 估算精确）固定高度，
       scroll-view 在 flex 剩余空间内滚动，header 天然吸顶 */
    /* #ifdef MP-WEIXIN */
    height: calc(100vh - var(--window-bottom, 0px));
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

    &__top {
        display: flex;
        align-items: center;
        padding: calc(var(--status-bar-height) + 40rpx) 32rpx 0;
    }

    &__school {
        display: flex;
        align-items: center;
        gap: 8rpx;
        height: 80rpx;

        &--hover {
            opacity: 0.8;
        }
    }

    &__school-name {
        font-size: 30rpx;
        font-weight: 600;
    }

    /* 学校首字 Logo：每校首字不同（不重复），品牌渐变圆标 */
    &__school-logo {
        width: 44rpx;
        height: 44rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #3d7eff, #6fa8ff);
        color: #ffffff;
        font-size: 22rpx;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4rpx 10rpx rgba(61, 126, 255, 0.3);
    }

    &__user {
        margin-left: auto;
        display: flex;
        align-items: center;
    }

    &__avatar {
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        background: #f2f3f5;
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

    /* 商品卡骨架屏（自绘：与 GoodsCard 同尺寸同间距，蓝主题淡色呼吸动画；
       弃用 hy-skeleton 段落式——与商品列表形态不符，且第三方组件在 MP 端渲染不可控） */
    &__skeleton {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        padding: 24rpx 24rpx 0;

        &-card {
            width: calc(50% - 10rpx);
            margin-bottom: 20rpx;
            background: #ffffff;
            border-radius: 16rpx;
            padding: 20rpx;
            box-sizing: border-box;
        }

        &-img {
            width: 100%;
            height: 340rpx;
            border-radius: 12rpx;
            background: linear-gradient(
                90deg,
                #f0f2f6 25%,
                #e6e9f2 37%,
                #f0f2f6 63%
            );
            background-size: 400% 100%;
            animation: home-skeleton-shimmer 1.4s ease infinite;
        }

        &-title {
            margin-top: 16rpx;
            height: 28rpx;
            width: 76%;
            border-radius: 8rpx;
            background: linear-gradient(
                90deg,
                #f0f2f6 25%,
                #e6e9f2 37%,
                #f0f2f6 63%
            );
            background-size: 400% 100%;
            animation: home-skeleton-shimmer 1.4s ease infinite;
        }

        &-price {
            margin-top: 14rpx;
            height: 30rpx;
            width: 42%;
            border-radius: 8rpx;
            background: linear-gradient(
                90deg,
                #f0f2f6 25%,
                #e6e9f2 37%,
                #f0f2f6 63%
            );
            background-size: 400% 100%;
            animation: home-skeleton-shimmer 1.4s ease infinite 0.15s;
        }
    }

    @keyframes home-skeleton-shimmer {
        0% {
            background-position: 100% 50%;
        }
        100% {
            background-position: 0 50%;
        }
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        padding: 24rpx 24rpx 0;
    }

    /* 分页尾部提示（加载中 / 上拉加载更多 / 没有更多了） */
    &__footer {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20rpx 0 4rpx;
    }

    &__footer-text {
        font-size: 24rpx;
        color: #9aa0a6;
    }

    /* 未选学校引导态（守卫不再强制跳转，由页面引导主动选择） */
    &__school-guide {
        margin: 120rpx 48rpx 0;
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

    &__more {
        padding: 8rpx 0 24rpx;
        text-align: center;

        &-text {
            font-size: 24rpx;
            color: var(--hy-text-color--3, #929295);
        }
    }
}
</style>
