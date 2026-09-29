// pinia-plugin-unistorage 未提供类型声明，此处补充模块与 persist 选项类型
import 'pinia';

declare module 'pinia' {
    export interface DefineStoreOptionsBase<S, Store> {
        /** 是否启用 unistorage 持久化 */
        persist?: boolean;
    }
}

declare module 'pinia-plugin-unistorage' {
    import type { PiniaPluginContext } from 'pinia';

    export function createUnistorage(globalOptions?: Record<string, any>): (context: PiniaPluginContext) => void;
    export function createPersistedState(globalOptions?: Record<string, any>): (context: PiniaPluginContext) => void;
}
