import http from '@/api/request';
import type { School } from '@/types';

/** 学校列表（keyword 模糊搜索，空串返回全部） */
export const getSchoolListApi = (keyword = ''): Promise<School[]> => {
    return http.get<School[]>('/school/list', { keyword });
};

/** 确认学校（选择后仅浏览本校商品） */
export const confirmSchoolApi = (schoolId: string): Promise<School> => {
    return http.post<School>('/school/confirm', { schoolId });
};
