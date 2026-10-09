import { Http } from '@/uni_modules/hy-app-ui';
import { apiConfig } from '@/config/env';

const http = new Http();
const apiMessage = (msg: string, isLogin?: boolean) => {
    uni.showModal({
        title: msg || '数据错误',
        showCancel: false,
        confirmText: isLogin ? '登录' : '我知道了',
        success: res => {
            if (res.confirm && isLogin) {
                uni.navigateTo({
                    url: '/pages/login/Index',
                });
            }
        },
    });
};

http.config = {
    baseURL: apiConfig.baseUrl,
};

// 请求拦截
http.interceptor.request((conf: UniNamespace.RequestOptions) => {
    const token = uni.getStorageSync('member_token');
    if (token) {
        // 合并而非覆盖，避免丢失 Content-Type（POST JSON body 解析依赖它）
        conf.header = {
            ...conf.header,
            token: token,
        };
    }
    // 注意：不在此处统一 showLoading —— 全屏 mask 遮罩会拦截点击导致"卡死"，
    // 且会与页面自身的 loading（如登录页 toast.loading）叠加冲突。
    // loading 由各页面自行控制。
    return conf;
});

// 响应拦截
http.interceptor.response(
    (response: UniNamespace.RequestSuccessCallbackResult) => {
        // 兜底关闭任何残留的原生 loading（页面自控 loading 用 toast，不受影响）
        uni.hideLoading();
        const res = response.data as Record<string, any>;
        if (res && typeof res === 'object' && response.statusCode === 200) {
            // 业务接口调用成功
            if (res.code === 200) {
                return res.data;
            } else {
                const isLoginInterception = res.code === 401;
                apiMessage(res.message, isLoginInterception);
                // 请求接口错误走这里
                return Promise.reject(res.message);
            }
        }
        // 请求接口错误走这里
        return Promise.reject(response);
    },
    (error: UniNamespace.GeneralCallbackResult) => {
        console.error(error);
        uni.hideLoading();
        uni.showModal({
            title: '网络请求错误',
            content: error?.errMsg,
            showCancel: false,
            success: res => {},
        });
        return Promise.reject(error);
    }
);

export default http;
