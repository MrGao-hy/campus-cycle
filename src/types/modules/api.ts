export interface IPage<T> {
    hasMore: boolean;
    list: T[];
    pageNum: number;
    pageSize: number;
    pages: number;
    total: number;
}

export interface ISearchParam {
    pageNum: string;
    pageSize: string;
    keyword?: string;
}