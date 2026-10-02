/**
 * 统一消息提示：直接走原生 uni.showToast / uni.showLoading。
 *
 * ⚠️ 为什么不用 @hy-app/ui 的 useToast：
 * 它是命令式 API（uni.$emit），依赖页面上挂一个全局 <hy-toast> 组件。
 * 该组件内部是 hy-overlay（position: fixed; width/height: 100% 全屏）
 * + hy-transition（渲染条件 v-if="hasInit"，首次弹出后永久为 true，
 *   隐藏时只是 opacity 归 0），并且 hy-transition 上绑了 @tap.stop。
 * 结果：任何一次 toast 之后，页面上就常驻一层「看不见的全屏遮罩」，
 * 吞掉页面内所有点击——表现为按钮全部点不动，只有原生 tabBar 还能点
 * （tabBar 是原生组件，层级高于普通 view）。
 *
 * 这里提供与 useToast 完全同名的方法，页面只需改 import 来源即可。
 */

export interface IToastOptions {
    /** 显示时长（毫秒），默认 2000 */
    duration?: number;
    /** loading 是否显示透明蒙层（默认 false，避免再次引入遮挡） */
    mask?: boolean;
}

const show = (msg: string, opt?: IToastOptions) => {
    uni.showToast({
        title: msg,
        icon: 'none',
        duration: opt?.duration ?? 2000,
    });
};

const withIconNone = (msg: string, opt?: IToastOptions) => show(msg, opt);

export const useToast = () => ({
    /** 纯文本提示 */
    show,
    info: (msg: string, opt?: IToastOptions) => withIconNone(msg, opt),
    success: (msg: string, opt?: IToastOptions) => {
        uni.showToast({
            title: msg,
            icon: 'success',
            duration: opt?.duration ?? 2000,
        });
    },
    error: (msg: string, opt?: IToastOptions) => withIconNone(msg, opt),
    warning: (msg: string, opt?: IToastOptions) => withIconNone(msg, opt),
    primary: (msg: string, opt?: IToastOptions) => withIconNone(msg, opt),
    loading: (msg = '加载中...', opt?: IToastOptions) => {
        uni.showLoading({ title: msg, mask: opt?.mask ?? false });
    },
    close: () => {
        uni.hideLoading();
        uni.hideToast();
    },
});
