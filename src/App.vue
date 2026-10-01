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
</style>
