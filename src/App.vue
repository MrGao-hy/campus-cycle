<template></template>

<script setup lang="ts">
import { useUserStore } from '@/store';

// 启动时把持久化的登录态同步到请求层使用的 storage key
// （pinia persist 恢复 token 后，member_token 可能未写入，导致鉴权请求 401 被弹回登录页）
const userStore = useUserStore();
if (userStore.token) {
    uni.setStorageSync('member_token', userStore.token);
}
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
 */
.hy-config-provider {
    height: auto !important;
    min-height: 100vh !important;
    overflow: visible !important;
}
</style>
