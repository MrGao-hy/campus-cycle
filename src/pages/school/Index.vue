<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { confirmSchoolApi, getSchoolListApi } from '@/api';
import { useToolsStore, useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { computed, ref } from 'vue';
import type { School } from '@/types';

definePage({
    style: {
        navigationBarTitleText: '选择学校',
    },
});

const toast = useToast();
const userStore = useUserStore();
const tools = useToolsStore();

const keyword = ref('');
const list = ref<School[]>([]);
const loading = ref(true);
const modalShow = ref(false);
const selected = ref<School | null>(null);

const currentSchoolId = computed(() => userStore.school?.id);

const loadList = async () => {
    loading.value = true;
    list.value = await getSchoolListApi(keyword.value);
    loading.value = false;
};
loadList();

const onSearch = (value: string) => {
    keyword.value = value;
    loadList();
};

/** 选择学校 → 二次确认 */
const onTapSchool = (school: School) => {
    if (school.id === currentSchoolId.value) {
        toast.info('当前已选择该学校');
        return;
    }
    selected.value = school;
    modalShow.value = true;
};

const onConfirm = async () => {
    if (!selected.value) return;
    const school = await confirmSchoolApi(selected.value.id);
    userStore.setSchool(school);
    toast.success(`已选择：${school.shortName || school.name}`);
    setTimeout(() => {
        // 从登录流程进入时进入首页；从我的页进入时返回
        uni.switchTab({ url: '/pages/index/Index' });
    }, 500);
};
</script>

<template>
    <the-root-pages>
        <view class="school" :style="{ '--primary': tools.themeColor }">
            <!-- 渐变头部：标题 + 搜索 -->
            <view class="school__header">
                <view class="school__ring school__ring--a"></view>
                <view class="school__ring school__ring--b"></view>
                <view class="school__ring school__ring--c"></view>
                <text class="school__title">选择你的学校</text>
                <text class="school__subtitle"
                    >确认后仅展示本校商品，同校交易更安全</text
                >
                <view class="school__search">
                    <hy-search
                        v-model="keyword"
                        placeholder="搜索学校名称"
                        :show-action="false"
                        @search="
                            (_e: unknown, value: string) => onSearch(value)
                        "
                        @confirm="onSearch"
                        @clear="loadList"
                    ></hy-search>
                </view>
            </view>

            <!-- 当前学校横幅 -->
            <view
                v-if="userStore.school"
                class="school__current"
                hover-class="school__current--hover"
                :hover-stay-time="120"
            >
                <view class="school__current-check">
                    <hy-icon name="/static/icons/check.png" color="#fff" :size="12" />
                </view>
                <view class="school__current-info">
                    <text class="school__current-name">{{
                        userStore.school.name
                    }}</text>
                    <text class="school__current-desc"
                        >当前学校 · 首页仅展示本校商品</text
                    >
                </view>
                <view class="school__current-badge">已确认</view>
            </view>

            <!-- 学校列表 -->
            <view class="school__body">
                <view class="school__group">
                    <text class="school__group-title">全部学校</text>
                    <text v-if="!keyword" class="school__group-count"
                        >共 {{ list.length }} 所</text
                    >
                </view>

                <!-- 骨架屏 -->
                <view v-if="loading" class="school__skeleton">
                    <hy-skeleton
                        theme="paragraph"
                        :row-col="[3, 3]"
                        animation="gradient"
                    ></hy-skeleton>
                </view>

                <template v-else-if="list.length">
                    <view
                        v-for="(school, i) in list"
                        :key="school.id"
                        class="school__item"
                        :class="{
                            'school__item--active':
                                school.id === currentSchoolId,
                        }"
                        :style="{ animationDelay: `${i * 0.06}s` }"
                        hover-class="school__item--hover"
                        :hover-stay-time="120"
                        @tap="onTapSchool(school)"
                    >
                        <view
                            class="school__avatar"
                            :class="{
                                'school__avatar--active':
                                    school.id === currentSchoolId,
                            }"
                        >
                            <text class="school__avatar-text">{{
                                school.shortName.slice(0, 1)
                            }}</text>
                        </view>
                        <view class="school__item-info">
                            <text class="school__item-name">{{
                                school.name
                            }}</text>
                            <text class="school__item-sub"
                                >{{ school.goodsCount }} 件在售</text
                            >
                        </view>
                        <view
                            v-if="school.id === currentSchoolId"
                            class="school__badge"
                            >当前</view
                        >
                        <hy-icon
                            v-else
                            name="/static/icons/right.png"
                            :color="
                                school.id === currentSchoolId
                                    ? 'var(--primary, #3d7eff)'
                                    : 'var(--hy-text-color--3, #929295)'
                            "
                            :size="14"
                        ></hy-icon>
                    </view>
                </template>

                <hy-empty
                    v-else
                    mode="search"
                    description="未找到相关学校，换个关键词试试"
                ></hy-empty>
            </view>

            <!-- 底部说明 -->
            <view class="school__footer">
                <hy-icon name="/static/icons/shield.png" :size="14" />
                <text>学校信息用于同校身份校验，不会对外展示你的位置</text>
            </view>

            <hy-modal
                v-model="modalShow"
                title="确认选择学校"
                :content="`选择「${selected?.name}」后，首页将只展示本校商品。确认选择？`"
                show-cancel-button
                @confirm="onConfirm"
            ></hy-modal>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
.school {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    background: var(--hy-background, #f5f6f8);

    /* 渐变头部（深蓝质感，装饰圆环） */
    &__header {
        position: relative;
        padding: 56rpx 40rpx 88rpx;
        background: linear-gradient(
            135deg,
            var(--primary, #3d7eff) 0%,
            #2d6bf0 55%,
            #1e56c8 100%
        );
        border-radius: 0 0 48rpx 48rpx;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: school-fade-down 0.5s ease-out both;
    }

    &__ring {
        position: absolute;
        border: 3rpx solid rgba(255, 255, 255, 0.18);
        border-radius: 50%;

        &--a {
            width: 320rpx;
            height: 320rpx;
            top: -120rpx;
            right: -80rpx;
        }

        &--b {
            width: 200rpx;
            height: 200rpx;
            top: -40rpx;
            right: 140rpx;
            border-width: 2rpx;
            opacity: 0.7;
        }

        &--c {
            width: 140rpx;
            height: 140rpx;
            bottom: -60rpx;
            left: -40rpx;
            border-width: 2rpx;
            opacity: 0.6;
        }
    }

    &__title {
        position: relative;
        font-size: 44rpx;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 2rpx;
    }

    &__subtitle {
        position: relative;
        margin-top: 12rpx;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.85);
    }

    /* 搜索框上提叠压渐变底缘 */
    &__search {
        position: relative;
        margin: 36rpx -20rpx -72rpx;
        background: #fff;
        border-radius: 20rpx;
        box-shadow: 0 12rpx 32rpx rgba(14, 42, 110, 0.18);
        overflow: hidden;
    }

    /* 当前学校横幅（主色渐变） */
    &__current {
        position: relative;
        margin: 100rpx 32rpx 0;
        padding: 26rpx 28rpx;
        display: flex;
        align-items: center;
        gap: 20rpx;
        border-radius: 24rpx;
        background: linear-gradient(
            120deg,
            var(--primary, #3d7eff) 0%,
            #2d6bf0 100%
        );
        box-shadow: 0 12rpx 28rpx rgba(61, 126, 255, 0.28);
        animation: school-fade-up 0.5s ease-out 0.1s both;
    }

    &__current-check {
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.28);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    &__current-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4rpx;
        min-width: 0;
    }

    &__current-name {
        font-size: 28rpx;
        font-weight: 600;
        color: #ffffff;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__current-desc {
        font-size: 22rpx;
        color: rgba(255, 255, 255, 0.8);
    }

    &__current-badge {
        flex-shrink: 0;
        padding: 6rpx 20rpx;
        border-radius: 999rpx;
        background: #ffffff;
        color: var(--primary, #3d7eff);
        font-size: 22rpx;
        font-weight: 600;
    }

    /* 列表区 */
    &__body {
        position: relative;
        margin: 40rpx 32rpx 0;
        flex: 1;
    }

    &__group {
        display: flex;
        align-items: baseline;
        gap: 12rpx;
        padding: 0 8rpx 20rpx;
    }

    &__group-title {
        font-size: 28rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
    }

    &__group-count {
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    &__skeleton {
        padding: 8rpx 0;
    }

    /* 独立卡片 */
    &__item {
        display: flex;
        align-items: center;
        gap: 24rpx;
        padding: 28rpx;
        margin-bottom: 20rpx;
        border-radius: 24rpx;
        border: 2rpx solid transparent;
        background: var(--hy-background--container, #ffffff);
        box-shadow: 0 6rpx 20rpx rgba(30, 60, 120, 0.05);
        transition:
            background-color 0.25s ease,
            border-color 0.25s ease,
            transform 0.25s ease;
        animation: school-fade-up 0.45s ease-out both;

        /* 选中：主色描边 + 浅底 */
        &--active {
            border-color: var(--primary, #3d7eff);
            background: rgba(61, 126, 255, 0.07);
            box-shadow: 0 8rpx 24rpx rgba(61, 126, 255, 0.14);
        }

        /* 按压反馈 */
        &--hover {
            background: var(--primary-light-2, rgba(61, 126, 255, 0.12));
            transform: scale(0.985);
        }
    }

    /* 首字渐变方块（品牌统一） */
    &__avatar {
        width: 84rpx;
        height: 84rpx;
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: linear-gradient(
            135deg,
            var(--primary, #3d7eff) 0%,
            #2d6bf0 100%
        );
        box-shadow: 0 6rpx 14rpx rgba(61, 126, 255, 0.24);

        &--active {
            background: linear-gradient(135deg, #ffffff 0%, #e8f1ff 100%);

            .school__avatar-text {
                color: var(--primary, #3d7eff);
            }
        }
    }

    &__avatar-text {
        font-size: 36rpx;
        font-weight: 700;
        color: #ffffff;
    }

    &__item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        min-width: 0;
    }

    &__item-name {
        font-size: 30rpx;
        font-weight: 600;
        color: var(--hy-text-color, #000000);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__item-sub {
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }

    /* 当前胶囊 */
    &__badge {
        flex-shrink: 0;
        padding: 6rpx 18rpx;
        border-radius: 999rpx;
        background: var(--primary, #3d7eff);
        color: #ffffff;
        font-size: 22rpx;
        font-weight: 600;
    }

    /* 底部说明 */
    &__footer {
        margin-top: auto;
        padding: 32rpx 40rpx calc(32rpx + env(safe-area-inset-bottom));
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: var(--hy-text-color--3, #929295);
    }
}

@keyframes school-fade-down {
    from {
        opacity: 0;
        transform: translateY(-24rpx);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes school-fade-up {
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
