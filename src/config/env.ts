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
    // 开发版（微信开发者工具：本机回环地址即可；真机预览请改为局域网 IP，如 http://192.168.3.10:9000）
    // 注意：后端端口是 9000，8080 已被 Nacos 控制台占用，勿改回 8080
    develop: {
        baseUrl: 'http://127.0.0.1:9000',
        decoBaseUrl: 'https://xryy.hfykcloud.com:99/pamirs', // 装修接口地址
        wxMock: true,
    },
    // 体验版
    trial: {
        baseUrl: 'http://127.0.0.1:9000',
        decoBaseUrl: 'https://xryy.hfykcloud.com:99/pamirs',
        wxMock: true,
    },
    // 正式版（上线时替换为已备案域名，并置 wxMock: false）
    release: {
        baseUrl: 'http://127.0.0.1:9000',
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
