import COS from 'cos-nodejs-sdk-v5'
import type { Adapter } from '../core/adapter'

interface TencentConfig {
  bucket: string
  secretId: string
  secretKey: string
  domain: string
  /**
   * @see https://cloud.tencent.com/document/product/436/6224
   */
  region: string
  /**
   * 触发分块上传的阈值
   */
  sliceSize?: number
}

export function tencentAdapter(config: TencentConfig): Adapter {
  const client = new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey,
  })
  return {
    createUrl(uploadInfo) {
      // TODO: throw error if domain is not valid
      const domain = config.domain
      if (domain.endsWith('/') || uploadInfo.remotePath.startsWith('/'))
        return domain + uploadInfo.remotePath

      return `${domain}/${uploadInfo.remotePath}`
    },

    async upload(uploadInfo) {
      await client.uploadFile({
        FilePath: uploadInfo.filePath,
        SliceSize: config.sliceSize,
        Key: uploadInfo.remotePath,
        Bucket: config.bucket,
        Region: config.region,
      })
    },
  }
}
