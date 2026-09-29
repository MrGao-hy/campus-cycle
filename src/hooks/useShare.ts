import { reactive } from 'vue';
import { useShare } from '@hy-app/ui';

/** 默认分享封面图（5:4 适配小程序分享卡片） */
const SHARE_IMAGE =
    'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Flat%20illustration%20share%20cover%20for%20campus%20second-hand%20marketplace%20app%2C%20university%20students%20trading%20bicycle%2C%20books%20and%20electronics%2C%20blue%20%233D7EFF%20theme%2C%20clean%20minimal%20vector%20style%2C%20soft%20gradient%20background%2C%20no%20text&image_size=landscape_4_3';

interface IShareOptions {
    /** 分享标题，默认「校园循环」 */
    title?: string;
    /** 分享路径，默认首页 */
    path?: string;
}

/**
 * 页面全局分享（基于 @hy-app/ui 的 useShare 封装）
 *
 * 用法：
 * ```ts
 * const { onShareAppMessage, onShareTimeline } = usePageShare();
 * defineExpose({ onShareAppMessage, onShareTimeline });
 * ```
 *
 * shareConfig 为响应式对象，页面加载数据后可直接修改 title / path 实现动态分享
 */
export const usePageShare = (options?: IShareOptions) => {
    const shareConfig = reactive({
        title: options?.title || '校园循环 | 同校二手好物，当面交易更安心',
        path: options?.path || '/pages/index/Index',
        friendImageUrl: SHARE_IMAGE,
        timelineImageUrl: SHARE_IMAGE,
    });

    // hy 的 useShare 在分享触发时才读取 config 属性，
    // 传入响应式对象即可支持数据加载后动态更新分享内容
    return {
        shareConfig,
        ...useShare(shareConfig),
    };
};
