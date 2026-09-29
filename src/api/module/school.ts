import { schools } from '@/mock/data';
import { delay } from '@/mock';
import type { School } from '@/types';

/** 学校列表 */
export const getSchoolListApi = (keyword = ''): Promise<School[]> => {
    const list = keyword ? schools.filter(s => s.name.includes(keyword) || s.shortName.includes(keyword)) : [...schools];
    return delay(list);
};

/** 确认学校（选择后仅浏览本校商品） */
export const confirmSchoolApi = (schoolId: string): Promise<School> => {
    const school = schools.find(s => s.id === schoolId);
    return delay(school as School);
};
