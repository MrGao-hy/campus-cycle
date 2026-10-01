import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages';

export default defineUniPages({
    globalStyle: {
        navigationBarTitleText: '校园循环',
        navigationBarBackgroundColor: '@navBgColor',
        navigationBarTextStyle: '@navTxtStyle',
        backgroundColor: '@bgColor',
        backgroundTextStyle: '@bgTxtStyle',
        backgroundColorTop: '@bgColorTop',
        backgroundColorBottom: '@bgColorBottom',
    },
    tabBar: {
        color: '#7A7E83',
        selectedColor: '#3D7EFF',
        borderStyle: 'black',
        backgroundColor: '@bgColor',
        list: [
            {
                pagePath: 'pages/index/Index',
                text: '首页',
                iconPath: 'static/tabbar/home.png',
                selectedIconPath: 'static/tabbar/home-active.png',
            },
            {
                pagePath: 'pages/message/Index',
                text: '消息',
                iconPath: 'static/tabbar/message.png',
                selectedIconPath: 'static/tabbar/message-active.png',
            },
            {
                pagePath: 'pages/mine/Index',
                text: '我的',
                iconPath: 'static/tabbar/mine.png',
                selectedIconPath: 'static/tabbar/mine-active.png',
            },
        ],
    },
    easycom: {
        autoscan: true,
        custom: {
            '^hy-(.*)': '@hy-app/ui/components/hy-$1/hy-$1.vue',
        },
    },
});
