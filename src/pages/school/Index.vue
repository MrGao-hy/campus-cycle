<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { confirmSchoolApi, getSchoolListApi } from '@/api';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { ref } from 'vue';
import type { School } from '@/types';
import { usePageShare } from '@/hooks/useShare';

definePage({
    style: {
        navigationBarTitleText: '选择学校'
    }
});

const toast = useToast();
const userStore = useUserStore();

// 全局分享（hy-app useShare）
const { onShareAppMessage, onShareTimeline } = usePageShare();
defineExpose({ onShareAppMessage, onShareTimeline });

const keyword = ref('');
const list = ref<School[]>([]);
const loading = ref(true);
const modalShow = ref(false);
const selected = ref<School | null>(null);

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
    selected.value = school;
    modalShow.value = true;
};

const onConfirm = async () => {
    if (!selected.value) return;
    const school = await confirmSchoolApi(selected.value.id);
    userStore.setSchool(school);
    toast.success(`已选择：${school.shortName || school.name}`);
    setTimeout(() => {
        // 从登录流程进入时返回首页；从我的页进入时返回
        uni.switchTab({ url: '/pages/index/Index' });
    }, 500);
};
</script>

<template>
    <the-root-pages>
        <view class="school">
            <view class="school__tip">
                <hy-icon name="map" color="var(--hy-primary-color)" :size="16" />
                <text>选择并确认学校后，仅展示本校商品，同校交易更安全</text>
            </view>

            <view class="school__search">
                <hy-search
                    v-model="keyword"
                    placeholder="搜索学校名称"
                    :show-action="false"
                    @search="(_e: unknown, value: string) => onSearch(value)"
                    @confirm="onSearch"
                    @clear="loadList"
                ></hy-search>
            </view>

            <hy-cell v-if="loading" :border="false"></hy-cell>

            <hy-cell v-else :border="false">
                <hy-cell-item
                    v-for="school in list"
                    :key="school.id"
                    clickable
                    :is-right-icon="false"
                    @click="onTapSchool(school)"
                >
                    <template #icon>
                        <hy-avatar :text="school.shortName.slice(0, 1)" random-bg-color :name="school.shortName" shape="square" :size="40"></hy-avatar>
                    </template>
                    <template #title>
                        <view class="school__name-row">
                            <text class="school__name">{{ school.name }}</text>
                            <hy-tag v-if="userStore.school?.id === school.id" label="当前" type="success" size="mini" />
                        </view>
                    </template>
                    <template #sub>
                        <text class="school__sub">在售商品 {{ school.goodsCount }} 件</text>
                    </template>
                    <template #right-icon>
                        <hy-icon name="right" color="var(--hy-info-color)" :size="14"></hy-icon>
                    </template>
                </hy-cell-item>
            </hy-cell>

            <hy-empty v-if="!loading && list.length === 0" mode="search" description="未找到相关学校"></hy-empty>

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
    padding: 24rpx;
    box-sizing: border-box;

    &__tip {
        display: flex;
        align-items: center;
        gap: 10rpx;
        font-size: 24rpx;
        color: var(--hy-info-color, #909193);
        margin-bottom: 20rpx;
    }

    &__search {
        margin-bottom: 20rpx;
    }

    &__name-row {
        display: flex;
        align-items: center;
        gap: 12rpx;
    }

    &__name {
        font-size: 30rpx;
        font-weight: 500;
        color: var(--hy-main-color, #303133);
    }

    &__sub {
        font-size: 24rpx;
        color: var(--hy-info-color, #909193);
    }
}
</style>
