<template></template>

<script setup lang="ts">
import { useUserStore } from '@/store';

// 启动时把持久化的登录态同步到请求层使用的 storage key
// （pinia persist 恢复 token 后，member_token 可能未写入，导致鉴权请求 401 被弹回登录页）
const userStore = useUserStore();
if (userStore.token) {
    uni.setStorageSync('member_token', userStore.token);
}

// 临时排查（确认后删除）：验证 App 级 JS 是否执行
uni.showToast({ title: 'APP JS OK', icon: 'none', duration: 3000 });
</script>

<style lang="scss">
/* 全局浅灰底：卡片白底更立体，贴近闲鱼/电商信息层级 */
page {
    background-color: #f5f6f8;
}

/*
 * 关键：覆盖 hy-config-provider 的 100vh 锁高 + 内部滚动。
 * 该组件不处理 customStyle prop（小程序端透传失效），且滚动发生在组件容器内时
 * onPageScroll 永不触发 → JS 吸顶/滚动监听全部失效。
 * 组件 styleIsolation: shared + addGlobalClass: true，app.wxss 全局规则可穿透。
 *
 * 注意：不能直接 min-height: 100vh——小程序 tabBar 页的 100vh 含 tabBar 高度，
 * 容器恒高于可视区导致页面可滚动（我的/消息页底部空白可滚动的根因）。
 * 小程序端改用 page 100% 链（page 高度 = 可视区，tabBar 已排除）；
 * H5 端 tabBar 为 fixed，需减去 --window-bottom。
 */
/* #ifdef MP-WEIXIN */
page {
    height: 100%;
}
.hy-config-provider {
    height: auto !important;
    min-height: 100% !important;
    overflow: visible !important;
}
/* #endif */
/* #ifdef H5 */
.hy-config-provider {
    height: auto !important;
    min-height: calc(100vh - var(--window-bottom, 0px)) !important;
    overflow: visible !important;
}
/* #endif */
</style>
