import { apiConfig } from '@/config/env';

/**
 * 上传本地图片到后端，返回可访问 URL
 * @param tempPath 本地临时文件路径（chooseImage / chooseAvatar 返回）
 */
export const uploadImage = (tempPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: `${apiConfig.baseUrl}/goods/upload`,
            filePath: tempPath,
            name: 'file',
            header: { token: uni.getStorageSync('member_token') || '' },
            success: res => {
                try {
                    const data = JSON.parse(res.data) as { code: number; message: string; data?: string };
                    if (data.code === 200 && data.data) {
                        resolve(data.data);
                    } else {
                        reject(new Error(data.message || '上传失败'));
                    }
                } catch {
                    reject(new Error('上传失败，请重试'));
                }
            },
            fail: err => reject(new Error(err.errMsg || '上传失败')),
        });
    });
};
