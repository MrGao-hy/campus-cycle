<script setup lang="ts">
import { useToolsStore } from '@/store';
import { computed } from 'vue';

const tools = useToolsStore();

interface IProps {
    height?: string;
}

const props = withDefaults(defineProps<IProps>(), {
    // 高度默认 auto：覆盖 hy-config-provider 自带的 100vh+内部滚动，
    // 让页面滚动回到 page 级（否则 H5 吸顶/onPageScroll 全部失效）
    height: 'auto',
});

/** hex 颜色转 rgba 字符串（支持 #rgb / #rrggbb） */
const hexToRgba = (hex: string, alpha: number): string => {
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h.split('').map((c) => c + c).join('');
    }
    const num = parseInt(h, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** 页面级主题变量：全站自绘样式统一引用（跟随 store.themeColor 换肤） */
const cssVars = computed(() => ({
    '--primary': tools.themeColor,
    '--primary-light': hexToRgba(tools.themeColor, 0.08),
    '--primary-light-2': hexToRgba(tools.themeColor, 0.15),
    '--warning': '#f9ae3d',
    '--warning-light': 'rgba(249, 174, 61, 0.1)',
}));
</script>

<template>
    <hy-config-provider
        :theme="tools.darkMode"
        :theme-color="tools.themeColor"
        :height="height"
        :custom-style="{ overflow: 'visible' }"
    >
        <view :style="cssVars">
            <slot></slot>
        </view>
        <hy-toast></hy-toast>
        <hy-modal></hy-modal>
    </hy-config-provider>
</template>

<style lang="scss" scoped></style>
