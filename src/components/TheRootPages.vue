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
        <!-- 不再挂载 <hy-toast> / <hy-modal>：
             两者都是命令式组件，底层 hy-overlay 是全屏 fixed 节点，
             hy-transition 的 v-if="hasInit" 首次弹出后永久为 true，
             隐藏时只是 opacity 归 0 —— 等于在页面上常驻一层看不见的全屏遮罩，
             把页面内所有 tap 都吞掉（原生 tabBar 层级更高所以还能点）。
             提示统一走 @/utils/toast（原生 uni.showToast），弹窗一律自定义 view + fixed。 -->
        <view :style="cssVars">
            <slot></slot>
        </view>
    </hy-config-provider>
</template>

<style lang="scss" scoped></style>
