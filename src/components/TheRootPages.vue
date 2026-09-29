<script setup lang="ts">
import { useToolsStore } from '@/store';

const tools = useToolsStore();
</script>

<template>
    <hy-config-provider :theme="tools.darkMode" :theme-color="tools.themeColor">
        <slot></slot>
        <hy-toast></hy-toast>
        <hy-modal></hy-modal>
    </hy-config-provider>
</template>

<style lang="scss" scoped></style>
