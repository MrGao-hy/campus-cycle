import { createPinia } from 'pinia';
import { createUnistorage } from 'pinia-plugin-unistorage';

const pinia = createPinia();
pinia.use(createUnistorage());

export * from './modules/tools';
export * from './modules/user';
export default pinia;
