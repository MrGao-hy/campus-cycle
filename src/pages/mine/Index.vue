<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getFeeSummaryApi, updateProfileApi } from '@/api';
import { uploadImage } from '@/utils/upload';
import { useUserStore } from '@/store';
import { useToast } from '@hy-app/ui';
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';

definePage({
    style: {
        navigationBarTitleText: '我的',
    },
});

const toast = useToast();
const userStore = useUserStore();

const unpaidAmount = ref(0);
const unpaidCount = ref(0);

onShow(() => {
    if (!userStore.hasLogin) {
        uni.reLaunch({ url: '/pages/login/Index' });
        return;
    }
    if (!userStore.hasSchool) {
        uni.navigateTo({ url: '/pages/school/Index' });
        return;
    }
    syncNicknameDraft();
    loadFee();
});

const loadFee = async () => {
    const summary = await getFeeSummaryApi();
    unpaidAmount.value = summary.unpaidAmount;
    unpaidCount.value = summary.unpaidCount;
};

const goOrders = () => uni.navigateTo({ url: '/pages/order/List' });
const goMyGoods = () => uni.navigateTo({ url: '/pages/goods/Mine' });
const goPublish = () => uni.navigateTo({ url: '/pages/goods/Publish' });
const goFee = () => uni.navigateTo({ url: '/pages/fee/Index' });
const goSecurity = () => uni.navigateTo({ url: '/pages/security/Index' });
const goRecords = () => uni.navigateTo({ url: '/pages/complaint/Record' });
const goSchool = () => uni.navigateTo({ url: '/pages/school/Index' });

/** 直接编辑资料：点头像用微信官方 open-type 换头像；昵称点击进入编辑态 */
const nicknameEditing = ref(false);
const nicknameDraft = ref('');

/** 输入框草稿与登录态同步 */
const syncNicknameDraft = () => {
    nicknameDraft.value = userStore.userInfo?.nickname || '';
};

/** 输入框宽度随内容自适应：中文按 1em、半角按 0.6em 估算 */
const nicknameInputWidth = computed(() => {
    let units = 0;
    for (const ch of nicknameDraft.value) {
        units += /[\u0000-\u00ff]/.test(ch) ? 0.6 : 1;
    }
    const em = Math.max(units, 6); // 空值时给 placeholder 留足宽度
    return `${Math.ceil(em * 34) + 8}rpx`;
});

/** 更新资料并同步本地登录态（提交值合并进返回值，避免后端回包缺字段导致界面不刷新） */
const saveProfile = async (data: { nickname?: string; avatar?: string }) => {
    const profile = await updateProfileApi({
        nickname: data.nickname ?? userStore.userInfo?.nickname,
        avatar: data.avatar ?? userStore.userInfo?.avatar,
    });
    userStore.setLogin(userStore.token, {
        ...profile,
        nickname: data.nickname ?? profile.nickname,
        avatar: data.avatar ?? profile.avatar,
    });
};

/** 微信官方 open-type=chooseAvatar 回调：avatarUrl 为本地临时路径 */
const onChooseAvatar = (e: { detail?: { avatarUrl?: string } }) => {
    const url = e?.detail?.avatarUrl;
    if (url) uploadAvatar(url);
};

const uploadAvatar = async (tempPath: string) => {
    uni.showLoading({ title: '上传中...', mask: true });
    try {
        const url = await uploadImage(tempPath);
        await saveProfile({ avatar: url });
        toast.success('头像已更新');
    } catch (e) {
        toast.warning((e as Error).message || '头像更新失败');
    } finally {
        uni.hideLoading();
    }
};

let nicknameSaving = false;

const editNickname = () => {
    syncNicknameDraft();
    nicknameEditing.value = true;
};

/** 失焦 / 键盘确认时保存。先读事件回传的权威值（快捷填入结果），
 *  再退出编辑态卸载输入框；confirm 与 blur 连续触发用 saving 标记去重 */
const confirmNickname = async (e?: { detail?: { value?: string } }) => {
    if (nicknameSaving) return;
    const name = String(e?.detail?.value ?? nicknameDraft.value).trim();
    nicknameEditing.value = false;
    if (!name || name === userStore.userInfo?.nickname) return;
    nicknameSaving = true;
    try {
        await saveProfile({ nickname: name });
        toast.success('昵称已更新');
    } catch (err) {
        toast.error((err as Error).message || '昵称更新失败');
    } finally {
        nicknameSaving = false;
        syncNicknameDraft();
    }
};

const logout = () => {
    uni.showModal({
        title: '退出登录',
        content: '确定退出当前账号吗？',
        success: res => {
            if (res.confirm) {
                userStore.logout();
                uni.reLaunch({ url: '/pages/login/Index' });
            }
        },
    });
};
</script>

<template>
    <the-root-pages height="100vh">
        <view class="mine">
            <!-- 用户信息 -->
            <view class="mine__user">
                <!-- 微信官方头像填写：open-type=chooseAvatar -->
                <button
                    class="mine__avatar-btn"
                    open-type="chooseAvatar"
                    @chooseavatar="onChooseAvatar"
                >
                    <!-- 有头像 URL 时显示图片（hy-avatar 的 text 优先级高于 src，二者互斥） -->
                    <hy-avatar
                        v-if="userStore.userInfo?.avatar"
                        :src="userStore.userInfo.avatar"
                        :size="56"
                        mode="aspectFill"
                    />
                    <hy-avatar
                        v-else
                        :text="userStore.userInfo?.nickname.slice(0, 1) || '同'"
                        random-bg-color
                        :size="56"
                    />
                    <view class="mine__avatar-badge">
                        <hy-icon name="camera" color="#fff" :size="12" />
                    </view>
                </button>
                <view class="mine__user-info">
                    <view class="mine__nickname">
                        <!-- 平时显示纯文字，点击进入编辑态（type=nickname 支持微信快捷填入，失焦自动保存） -->
                        <input
                            v-if="nicknameEditing"
                            class="mine__nickname-input"
                            type="nickname"
                            :maxlength="20"
                            :focus="true"
                            confirm-type="done"
                            placeholder="点击填写昵称"
                            placeholder-style="color: rgba(255,255,255,0.6)"
                            :style="{ width: nicknameInputWidth }"
                            @input="nicknameDraft = $event.detail.value"
                            @blur="confirmNickname"
                            @confirm="confirmNickname"
                        />
                        <template v-else>
                            <text @tap="editNickname">{{
                                userStore.userInfo?.nickname || '未登录'
                            }}</text>
                            <view
                                class="mine__nickname-edit"
                                @tap="editNickname"
                            >
                                <hy-icon
                                    name="edit"
                                    color="rgba(255, 255, 255, 0.85)"
                                    :size="14"
                                />
                            </view>
                        </template>
                        <hy-tag label="已认证" type="success" size="mini" />
                    </view>
                    <view class="mine__sub" @tap="goSchool">
                        <hy-icon
                            name="map"
                            color="var(--hy-text-color--3, #929295)"
                            :size="13"
                        />
                        <text
                            >{{
                                userStore.school?.name || '选择学校'
                            }}（点击切换）</text
                        >
                    </view>
                    <view class="mine__stats">
                        <text
                            >信用分
                            {{ userStore.userInfo?.creditScore ?? '-' }}</text
                        >
                        <text class="mine__stats-divider">|</text>
                        <text
                            >成功交易
                            {{ userStore.userInfo?.successCount ?? 0 }} 单</text
                        >
                    </view>
                </view>
            </view>

            <!-- 欠费提示 -->
            <view v-if="unpaidAmount > 0" class="mine__fee-warn" @tap="goFee">
                <hy-icon
                    name="warning-fill"
                    color="var(--hy-error, #f56c6c)"
                    :size="16"
                />
                <text class="mine__fee-text"
                    >有 {{ unpaidAmount }} 元手续费未结清（{{
                        unpaidCount
                    }}
                    笔），结清前无法发布新商品</text
                >
                <text class="mine__fee-link">去处理 ›</text>
            </view>

            <!-- 交易入口 -->
            <hy-cell :border="false" custom-class="mine__group">
                <hy-cell-item
                    title="我买到的"
                    sub="购买申请与订单进度"
                    clickable
                    is-right-icon
                    @click="goOrders"
                >
                    <template #icon>
                        <view class="mine__icon"
                            ><hy-icon
                                name="shopping-cart"
                                color="var(--primary, #3d7eff)"
                                :size="20"
                            ></hy-icon
                        ></view>
                    </template>
                </hy-cell-item>
                <hy-cell-item
                    title="我卖出的"
                    sub="待确认申请与手续费账单"
                    clickable
                    is-right-icon
                    @click="goOrders"
                >
                    <template #icon>
                        <view class="mine__icon mine__icon--warn"
                            ><hy-icon
                                name="shop"
                                color="var(--warning, #f9ae3d)"
                                :size="20"
                            ></hy-icon
                        ></view>
                    </template>
                </hy-cell-item>
                <hy-cell-item
                    title="我发布的"
                    sub="在售 / 交易中 / 已售出（置灰）"
                    clickable
                    is-right-icon
                    @click="goMyGoods"
                >
                    <template #icon>
                        <view class="mine__icon mine__icon--green"
                            ><hy-icon
                                name="picture"
                                color="var(--hy-success, #07c160)"
                                :size="20"
                            ></hy-icon
                        ></view>
                    </template>
                </hy-cell-item>
                <hy-cell-item
                    title="发布商品"
                    sub="第一笔成功交易免手续费"
                    clickable
                    is-right-icon
                    @click="goPublish"
                >
                    <template #icon>
                        <view class="mine__icon"
                            ><hy-icon
                                name="plus"
                                color="var(--primary, #3d7eff)"
                                :size="20"
                            ></hy-icon
                        ></view>
                    </template>
                </hy-cell-item>
            </hy-cell>

            <!-- 服务入口 -->
            <hy-cell :border="false" custom-class="mine__group">
                <hy-cell-item
                    title="手续费账单"
                    clickable
                    is-right-icon
                    @click="goFee"
                >
                    <template #icon>
                        <view class="mine__icon mine__icon--red"
                            ><hy-icon
                                name="order"
                                color="var(--hy-error, #f56c6c)"
                                :size="20"
                            ></hy-icon
                        ></view>
                    </template>
                    <template #value>
                        <text v-if="unpaidAmount > 0" class="mine__fee-amount"
                            >待缴 ￥{{ unpaidAmount }}</text
                        >
                    </template>
                </hy-cell-item>
                <hy-cell-item
                    title="安全中心"
                    sub="交易守则 · 举报 · 紧急求助"
                    clickable
                    is-right-icon
                    @click="goSecurity"
                >
                    <template #icon>
                        <view class="mine__icon mine__icon--green"
                            ><hy-icon
                                name="security"
                                color="var(--hy-success, #07c160)"
                                :size="20"
                            ></hy-icon
                        ></view>
                    </template>
                </hy-cell-item>
                <hy-cell-item
                    title="投诉与申诉"
                    sub="投诉记录 · 申诉进度 · 处理结果"
                    clickable
                    is-right-icon
                    @click="goRecords"
                >
                    <template #icon>
                        <view class="mine__icon mine__icon--red"
                            ><hy-icon
                                name="warning"
                                color="var(--hy-error, #f56c6c)"
                                :size="20"
                            ></hy-icon
                        ></view>
                    </template>
                </hy-cell-item>
            </hy-cell>

            <view class="mine__logout">
                <hy-button
                    text="退出登录"
                    plain
                    type="info"
                    shape="circle"
                    :custom-style="{ height: '88rpx' }"
                    @click="logout"
                ></hy-button>
            </view>
        </view>
    </the-root-pages>
</template>

<style lang="scss" scoped>
@use '../../styles/design.scss' as *;
.mine {
    min-height: 100vh;
    padding: 24rpx;
    box-sizing: border-box;

    &__user {
        display: flex;
        align-items: center;
        gap: 24rpx;
        @include hy-gradient-header(135deg, 24rpx);
        padding: 36rpx 32rpx;
        box-shadow: 0 12rpx 32rpx rgba(30, 60, 120, 0.18);
        animation: mine-fade-up 0.45s ease-out both;
    }

    &__user-info {
        flex: 1;
    }

    &__avatar-btn {
        position: relative;
        flex-shrink: 0;
        padding: 0;
        margin: 0;
        background: transparent;
        border-radius: 50%;
        line-height: 1;
        font-size: 0;
        overflow: visible;

        &::after {
            border: none;
        }
    }

    &__avatar-badge {
        position: absolute;
        right: -6rpx;
        bottom: -2rpx;
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.45);
        border: 2rpx solid rgba(255, 255, 255, 0.6);
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    &__nickname {
        display: flex;
        align-items: center;
        gap: 12rpx;
        font-size: 34rpx;
        font-weight: 700;
        color: #fff;
    }

    &__nickname-input {
        /* 宽度由行内样式按内容长度动态计算，此处不再写死 */
        height: 48rpx;
        min-height: 0;
        font-size: 34rpx;
        font-weight: 700;
        color: #fff;
        background: transparent;
    }

    &__nickname-edit {
        display: flex;
        align-items: center;
    }

    &__sub {
        display: flex;
        align-items: center;
        gap: 8rpx;
        margin-top: 10rpx;
        font-size: 23rpx;
        color: rgba(255, 255, 255, 0.85);
    }

    &__stats {
        display: flex;
        align-items: center;
        gap: 16rpx;
        margin-top: 12rpx;
        font-size: 23rpx;
        color: rgba(255, 255, 255, 0.85);
    }

    &__stats-divider {
        opacity: 0.5;
    }

    &__fee-warn {
        display: flex;
        align-items: center;
        gap: 10rpx;
        background: var(--hy-error--light, rgba(245, 108, 108, 0.08));
        border: 1rpx solid var(--hy-error, #f56c6c);
        border-radius: 16rpx;
        padding: 18rpx 20rpx;
        margin-top: 20rpx;
        animation: mine-fade-up 0.45s ease-out 0.08s both;
    }

    &__fee-text {
        flex: 1;
        font-size: 23rpx;
        color: var(--hy-error, #f56c6c);
        line-height: 1.5;
    }

    &__fee-link {
        font-size: 23rpx;
        color: var(--hy-error, #f56c6c);
        flex-shrink: 0;
    }

    &__group {
        @include hy-card(20rpx);
        overflow: hidden;
        margin-top: 24rpx;
    }

    &__icon {
        @include hy-icon-badge(60rpx, 16rpx);

        &--warn {
            background: var(--warning-light, rgba(249, 174, 61, 0.1));
        }

        &--green {
            background: rgba(7, 193, 96, 0.1);
        }

        &--red {
            background: var(--hy-error--light, rgba(245, 108, 108, 0.1));
        }
    }

    &__fee-amount {
        font-size: 24rpx;
        color: var(--hy-error, #f56c6c);
        font-weight: 600;
    }

    &__logout {
        @include hy-safe-bottom(48rpx);
        margin-top: 24rpx;
    }
}

@keyframes mine-fade-up {
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
