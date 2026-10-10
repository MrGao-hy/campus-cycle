// #ifndef H5 || APP_PLUS
export type MINI_ENV = 'develop' | 'trial' | 'release';
const { miniProgram } = uni.getAccountInfoSync();
export const mini_env: MINI_ENV = miniProgram.envVersion;
// #endif

// #ifdef H5
export enum H5_ENV {
    DEVELOP = 'develop',
    PRODUCTION = 'production',
}
export const h5_env: H5_ENV = import.meta.env.MODE as H5_ENV;
// #endif

// #ifdef APP_PLUS
export enum APP_ENV {
    DEVELOP = 'development',
    PRODUCTION = 'production',
}
export const app_env: APP_ENV = import.meta.env.MODE as APP_ENV;
// #endif

let apiConfig: IEnvConf;

interface IEnvConf {
    baseUrl: string;
    decoBaseUrl?: string;
    /** 是否启用微信登录 mock（true=本地联调稳定匿名账号；false=走真实 code2session，需与后端 WX_MOCK=false 一致） */
    wxMock: boolean;
}

interface IConfig {
    [key: string]: IEnvConf;
}

const config: IConfig = {
    // 开发环境配置（H5 / App，小程序端使用下方 develop/trial/release）
    // #ifdef H5 || APP_PLUS
    development: {
        baseUrl: '/api',
        wxMock: true,
    },
    // 生产环境配置
    production: {
        baseUrl: '/api',
        wxMock: false,
    },
    // #endif
    // #ifndef H5 || APP_PLUS
    // 开发版：真机预览/真机调试必须走局域网 IP（手机上的 127.0.0.1 是手机自己，
    // 连不到 Mac 上的后端 → 报「网络错误」）。换网络后改这里；模拟器同样可用。
    // 注意：后端端口是 8080（Nacos 控制台在 8848，勿混淆）。
    develop: {
        baseUrl: 'http://127.0.0.1:9000',
        decoBaseUrl: 'https://xryy.hfykcloud.com:99/pamirs', // 装修接口地址
        // 已配置真实小程序 AppID/AppSecret（wx1d337ce3ce3bae15），走真实 code2session
        wxMock: false,
    },
    // 体验版
    trial: {
        baseUrl: 'http://192.168.3.10:8080',
        decoBaseUrl: 'https://xryy.hfykcloud.com:99/pamirs',
        wxMock: false,
    },
    // 正式版（上线时替换为已备案域名，并置 wxMock: false）
    release: {
        baseUrl: 'https://your-domain.com',
        decoBaseUrl: 'https://xryy.hfykcloud.com:99/pamirs',
        wxMock: false,
    },
    // #endif
};

// #ifndef H5 || APP_PLUS
apiConfig = config[mini_env];
// #endif

// #ifdef H5
apiConfig = config[h5_env];
// #endif

// #ifdef APP_PLUS
apiConfig = config[app_env];
// #endif

export { apiConfig };
