<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import GoodsCard from '@/components/GoodsCard.vue';
import { getUserDetailApi } from '@/api';
import { useUserStore } from '@/store';
import { fmtTime } from '@/utils/format';
import type { UserDetail } from '@/types';
import { onLoad } from '@dcloudio/uni-app';
import { ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '用户主页',
    },
});

const userStore = useUserStore();

const userId = ref('');
const detail = ref<UserDetail | null>(null);
const loading = ref(true);

const isSelf = ref(false);

const load = async () => {
    loading.value = true;
    detail.value = await getUserDetailApi(userId.value);
    isSelf.value = detail.value?.profile.id === userStore.userInfo?.id;
    loading.value = false;
};

onLoad(async options => {
    userId.value = (options?.id as string) || '';
    if (!userId.value) return;
    await load();
});

const goGoodsDetail = (goodsId: string) => {
    uni.navigateTo({ url: `/pages/goods/Detail?id=${goodsId}` });
};

const goChat = () => {
    if (!detail.value) return;
    const profile = detail.value.profile;
    // 进商品发起会话：取该用户最新在售商品作为会话锚点
    const goods = detail.value.onSaleGoods[0];
    if (goods) {
        uni.navigateTo({ url: `/pages/chat/Detail?goodsId=${goods.id}` });
        return;
    }
    uni.showToast({ title: '对方暂无在售商品，暂无法发起会话', icon: 'none' });
};
</script>

<template>
    <the-root-pages>
        <view v-if="detail" class="ud">
            <!-- 用户信息卡 -->
            <view class="ud__head">
                <view class="ud__head-main">
                    <hy-avatar
                        :text="detail.profile.nickname.slice(0, 1)"
                        random-bg-color
                        :name="detail.profile.nickname"
                        :size="64"
                    />
                    <view class="ud__head-info">
                        <view class="ud__name">
                            {{ detail.profile.nickname }}
                            <hy-tag
                                v-if="isSelf"
                                label="我"
                                type="primary"
                                size="mini"
                            />
                        </view>
                        <view class="ud__school">
                            <hy-icon name="/static/icons/map.png" color="var(--hy-info-color)" :size="13" />
                            <text>{{ detail.profile.schoolName || '未设置学校' }}</text>
                        </view>
                        <view class="ud__stats">
                            <text>信用分 {{ detail.profile.creditScore }}</text>
                            <text class="ud__stats-divider">|</text>
                            <text>成交 {{ detail.profile.successCount }} 单</text>
                        </view>
                    </view>
                </view>
                <hy-button
                    v-if="!isSelf"
                    text="聊一聊"
                    size="small"
                    type="primary"
                    @click="goChat"
                />
            </view>

            <!-- 在售商品 -->
            <view class="ud__section">
                <view class="ud__section-title">
                    在售商品（{{ detail.onSaleGoods.length }}）
                </view>
                <view v-if="detail.onSaleGoods.length" class="ud__goods">
                    <GoodsCard
                        v-for="goods in detail.onSaleGoods"
                        :key="goods.id"
                        :goods="goods"
                        @click="goGoodsDetail(goods.id)"
                    />
                </view>
                <view v-else class="ud__empty">暂无在售商品</view>
            </view>

            <!-- 收到的评价 -->
            <view class="ud__section">
                <view class="ud__section-title">
                    收到的评价（{{ detail.reviews.length }}）
                </view>
                <view v-if="detail.reviews.length" class="ud__reviews">
                    <view
                        v-for="review in detail.reviews"
                        :key="review.id"
                        class="ud__review"
                    >
                        <view class="ud__review-head">
                            <hy-avatar
                                :text="review.fromNickname.slice(0, 1)"
                                random-bg-color
                                :name="review.fromNickname"
                                :size="32"
                            />
                            <text class="ud__review-name">{{
                                review.fromNickname
                            }}</text>
                            <hy-rate
                                :model-value="review.rate"
                                readonly
                                :size="12"
                                active-color="#FFB300"
                            ></hy-rate>
                        </view>
                        <view class="ud__review-content">{{ review.content }}</view>
                        <view class="ud__review-time">{{
                            fmtTime(review.time)
                        }}</view>
                    </view>
                </view>
                <view v-else class="ud__empty">暂无评价</view>
            </view>
        </view>
    </the-root-pages>
</template>

<style scoped lang="scss">
.ud {
    padding: 24rpx;

    &__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 32rpx;
        background: var(--hy-card-bg-color);
        border-radius: 20rpx;
    }

    &__head-main {
        display: flex;
        align-items: center;
        gap: 24rpx;
    }

    &__head-info {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    &__name {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 32rpx;
        font-weight: 600;
    }

    &__school {
        display: flex;
        align-items: center;
        gap: 6rpx;
        font-size: 24rpx;
        color: var(--hy-info-color);
    }

    &__stats {
        display: flex;
        align-items: center;
        gap: 12rpx;
        font-size: 24rpx;
        color: var(--hy-text-2-color);
    }

    &__stats-divider {
        color: var(--hy-border-color);
    }

    &__section {
        margin-top: 24rpx;
    }

    &__section-title {
        margin: 8rpx 0 20rpx;
        font-size: 30rpx;
        font-weight: 600;
    }

    &__goods {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        row-gap: 20rpx;

        .goods-card {
            width: 48.5%;
        }
    }

    &__empty {
        padding: 48rpx 0;
        text-align: center;
        font-size: 26rpx;
        color: var(--hy-text-3-color);
    }

    &__reviews {
        background: var(--hy-card-bg-color);
        border-radius: 20rpx;
        padding: 0 24rpx;
    }

    &__review {
        padding: 24rpx 0;
        border-bottom: 1rpx solid var(--hy-border-color);

        &:last-child {
            border-bottom: none;
        }
    }

    &__review-head {
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    &__review-name {
        flex: 1;
        font-size: 26rpx;
    }

    &__review-content {
        margin-top: 12rpx;
        font-size: 26rpx;
        line-height: 1.6;
    }

    &__review-time {
        margin-top: 8rpx;
        font-size: 22rpx;
        color: var(--hy-text-3-color);
    }
}
</style>
