<script setup lang="ts">
import TheRootPages from '@/components/TheRootPages.vue';
import { getFeeSummaryApi, updateProfileApi } from '@/api';
import { uploadImage } from '@/utils/upload';
import { useUserStore } from '@/store';
import { useToast } from '@/utils/toast';
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
<<<<<<< HEAD
    if (!userStore.hasLogin) {
        uni.reLaunch({ url: '/pages/login/Index' });
        return;
    }
    if (!userStore.hasSchool) {
        uni.navigateTo({ url: '/pages/school/Index' });
        return;
    }
    syncNicknameDraft();
=======
    if (!userStore.hasLogin) return;
    // 未选学校时不强制跳转（避免返回死循环），我的页可正常使用；
    // 费用汇总依赖学校维度，未选学校时跳过加载
    if (!userStore.hasSchool) return;
>>>>>>> 2562045febb196af83898a277883bc08a96b5b9b
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
const goProfile = () => uni.navigateTo({ url: '/pages/profile/Index' });
const goLogin = () => uni.navigateTo({ url: '/pages/login/Index' });

/**
 * 需登录的菜单项：未登录时弹确认框引导登录（用原生 showModal —— hy-modal 在小程序端不渲染）
 * 列表本身始终展示（与主流小程序一致：不登录也能看到完整菜单，用到时再引导登录）
 */
const requireLogin = (action: () => void) => {
    if (userStore.hasLogin) {
        action();
        return;
    }
    uni.showModal({
        title: '需要登录',
        content: '该功能需要登录后使用，是否前往登录？',
        confirmText: '去登录',
        cancelText: '再逛逛',
        success: res => {
            if (res.confirm) goLogin();
        },
    });
};

/** 顶部头像 / 昵称 / 设置图标：已登录进资料页，未登录进登录页 */
const onUserTap = () => (userStore.hasLogin ? goProfile() : goLogin());

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
    <the-root-pages>
        <view class="mine">
            <!-- 用户信息（未登录也保持常规菜单样式：默认头像 + 登录/注册入口，
                 不再用整块登录面板占满页面——参考主流小程序「我的」页） -->
            <view class="mine__user">
<<<<<<< HEAD
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
=======
                <view class="mine__user-decor"></view>
                <view class="mine__user-decor mine__user-decor--2"></view>
                <!-- 头像：已登录且已设置头像显示图片；否则显示默认灰人形图标。
                     未登录点击直接进登录页 -->
                <image
                    v-if="userStore.hasLogin && userStore.userInfo?.avatar"
                    :src="userStore.userInfo.avatar"
                    class="mine__avatar"
                    mode="aspectFill"
                    @tap="onUserTap"
                />
                <image
                    v-else
                    src="/static/icons/user.png"
                    class="mine__avatar"
                    mode="aspectFill"
                    @tap="onUserTap"
                />
                <view class="mine__user-info">
                    <view
                        v-if="userStore.hasLogin"
                        class="mine__nickname"
                        @tap="onUserTap"
                    >
                        {{ userStore.userInfo?.nickname || '校园用户' }}
>>>>>>> 2562045febb196af83898a277883bc08a96b5b9b
                        <hy-tag label="已认证" type="success" size="mini" />
                    </view>
                    <view v-else class="mine__nickname" @tap="onUserTap">
                        登录 / 注册
                        <hy-icon
                            name="/static/icons/right.png"
                            color="#ffffff"
                            :size="14"
                        />
                    </view>
                    <view class="mine__sub" @tap="goSchool">
                        <hy-icon
                            name="/static/icons/school-cap.png"
                            color="var(--hy-text-color--3, #929295)"
                            :size="16"
                        />
                        <text
                            >{{
                                userStore.school?.name || '选择学校'
                            }}（点击切换）</text
                        >
                    </view>
                    <view v-if="userStore.hasLogin" class="mine__stats">
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
                    <view v-else class="mine__stats"
                        >登录后可发布商品、管理订单</view
                    >
                </view>
                <view class="mine__user-edit" @tap="onUserTap">
                    <hy-icon
                        name="/static/icons/setting-white.png"
                        :size="18"
                    />
                </view>
            </view>

            <!-- 欠费提示 -->
            <view
                v-if="userStore.hasLogin && unpaidAmount > 0"
                class="mine__fee-warn"
                @tap="goFee"
            >
                <hy-icon
                    name="/static/icons/warning.png"
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

            <!-- 交易入口（未登录也展示，点击时引导登录） -->
            <view class="mine__group-title">我的交易</view>
            <view class="mine__group">
                <view class="mine__item" @tap="requireLogin(goOrders)">
                    <view class="mine__item-icon"
                        ><hy-icon
                            name="/static/icons/cart.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">我买到的</text>
                        <text class="mine__item-sub">购买申请与订单进度</text>
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="requireLogin(goOrders)">
                    <view class="mine__item-icon mine__item-icon--warn"
                        ><hy-icon
                            name="/static/icons/sell.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">我卖出的</text>
                        <text class="mine__item-sub"
                            >待确认申请与手续费账单</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="requireLogin(goMyGoods)">
                    <view class="mine__item-icon mine__item-icon--green"
                        ><hy-icon
                            name="/static/icons/picture.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">我发布的</text>
                        <text class="mine__item-sub"
                            >在售 / 交易中 / 已售出（置灰）</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="requireLogin(goPublish)">
                    <view class="mine__item-icon"
                        ><hy-icon
                            name="/static/icons/plus.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">发布商品</text>
                        <text class="mine__item-sub"
                            >第一笔成功交易免手续费</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
            </view>

            <!-- 服务入口 -->
            <view class="mine__group-title">更多服务</view>
            <view class="mine__group">
                <view class="mine__item" @tap="requireLogin(goFee)">
                    <view class="mine__item-icon mine__item-icon--red"
                        ><hy-icon
                            name="/static/icons/bill.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">手续费账单</text>
                    </view>
                    <text v-if="unpaidAmount > 0" class="mine__fee-amount"
                        >待缴 ￥{{ unpaidAmount }}</text
                    >
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="goSecurity">
                    <view class="mine__item-icon mine__item-icon--green"
                        ><hy-icon
                            name="/static/icons/shield.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">安全中心</text>
                        <text class="mine__item-sub"
                            >交易守则 · 举报 · 紧急求助</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
                <view class="mine__item" @tap="requireLogin(goRecords)">
                    <view class="mine__item-icon mine__item-icon--red"
                        ><hy-icon
                            name="/static/icons/complaint.png"
                            :size="22"
                        ></hy-icon
                    ></view>
                    <view class="mine__item-body">
                        <text class="mine__item-title">投诉与申诉</text>
                        <text class="mine__item-sub"
                            >投诉记录 · 申诉进度 · 处理结果</text
                        >
                    </view>
                    <hy-icon
                        name="/static/icons/right.png"
                        color="#c8c9cc"
                        :size="14"
                    ></hy-icon>
                </view>
            </view>

            <!-- 仅已登录显示「退出登录」；未登录不显示底部按钮 ——
                 顶部卡片的「登录 / 注册」入口已承担引导，底部再放一个主按钮
                 既重复又会占据页面底部空间（与主流小程序一致） -->
            <view v-if="userStore.hasLogin" class="mine__logout">
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
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 24rpx;
    padding-bottom: calc(24rpx + env(safe-area-inset-bottom));

    /* 高度链：小程序 tabBar 页 provider 高度 auto（min-height:100%），
       子级任何百分比高度（height/min-height:100%）都会解析为 auto，
       导致 logout margin-top:auto 无剩余空间（底部 110px 空白）；
       改用视口计算：100vh 含 tabBar，减 tabBar 实际高（--window-bottom，
       uni 在 MP 端注入，含安全区，比 100rpx+safe 估算精确）= 可视区高度，
       overflow-y 兜底内容超高时内部滚动（page 已禁页面滚动） */
    /* #ifdef MP-WEIXIN */
    height: calc(100vh - var(--window-bottom, 0px));
    overflow-y: auto;
    /* #endif */
    /* #ifdef H5 */
    min-height: calc(100vh - var(--window-bottom, 0px));
    /* #endif */

    &__user {
        flex-shrink: 0;
        position: relative;
        display: flex;
        align-items: center;
        gap: 24rpx;
        @include hy-gradient-header(135deg, 24rpx);
        padding: 36rpx 32rpx;
        box-shadow: 0 12rpx 32rpx rgba(30, 60, 120, 0.18);
        animation: mine-fade-up 0.45s ease-out both;
        overflow: hidden;
    }

    &__avatar {
        flex-shrink: 0;
        width: 112rpx;
        height: 112rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
    }

    /* 未登录不再用整块登录面板（__login-guide 已移除），
       与已登录共用同一张用户卡片，保持常规菜单样式 */

    &__user-decor {
        position: absolute;
        width: 240rpx;
        height: 240rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        right: -60rpx;
        top: -100rpx;

        &--2 {
            width: 120rpx;
            height: 120rpx;
            right: 70rpx;
            bottom: -70rpx;
            top: auto;
            background: rgba(255, 255, 255, 0.06);
        }
    }

    &__user-edit {
        position: relative;
        z-index: 1;
        width: 56rpx;
        height: 56rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.16);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    &__group-title {
        flex-shrink: 0;
        font-size: 26rpx;
        font-weight: 600;
        color: var(--hy-text-color--3, #929295);
        margin: 20rpx 8rpx 4rpx;
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
        flex-shrink: 0;
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
        flex-shrink: 0;
        @include hy-card(20rpx);
        overflow: hidden;
        margin-top: 12rpx;
    }

    &__item {
        display: flex;
        align-items: center;
        gap: 20rpx;
        padding: 26rpx 28rpx;
        position: relative;

        & + & {
            border-top: 1rpx solid #f2f3f5;
        }
    }

    &__item-icon {
        flex-shrink: 0;
        width: 72rpx;
        height: 72rpx;
        border-radius: 18rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(61, 126, 255, 0.1);

        &--warn {
            background: rgba(249, 174, 61, 0.12);
        }

        &--green {
            background: rgba(7, 193, 96, 0.12);
        }

        &--red {
            background: rgba(245, 108, 108, 0.12);
        }
    }

    &__item-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4rpx;
        min-height: 0;
    }

    &__item-title {
        font-size: 28rpx;
        font-weight: 500;
        color: #1f2329;
        line-height: 1.4;
    }

    &__item-sub {
        font-size: 22rpx;
        color: #929295;
        line-height: 1.4;
    }

    &__fee-amount {
        font-size: 24rpx;
        color: var(--hy-error, #f56c6c);
        font-weight: 600;
        flex-shrink: 0;
    }

    &__logout {
        margin-top: auto;
        padding-top: 24rpx;
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
