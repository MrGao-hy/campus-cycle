import { createSSRApp } from 'vue';
import App from './App.vue';
import pinia from '@/store';
import { useShare } from '@hy-app/ui';

export function createApp() {
    const app = createSSRApp(App);
    app.mixin(
        useShare({
            title: '校园循环',
        })
    );

    app.use(pinia);
    return {
        app,
    };
}
