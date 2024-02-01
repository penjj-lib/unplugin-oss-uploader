export interface Adapter {
  /**
   * 上传文件接口实现
   */
  upload: (uploadInfo: UploadInfo) => Promise<void>

  /**
   * 生成文件完整的URL地址
   */
  createUrl(uploadInfo: UploadInfo): string
}

export interface UploadInfo {
  filePath: string
  remotePath: string
}
