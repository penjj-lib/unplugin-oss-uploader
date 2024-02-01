import { createReadStream } from 'node:fs'
import qiniu from 'qiniu'
import type { Adapter } from '../core/adapter'

export const Zones = qiniu.zone

interface QiniuConfig {
  bucket: string
  accessKey: string
  secretKey: string
  domain: string
  zone: qiniu.conf.Zone
}

/**
 * Adapter for https://www.qiniu.com/
 */
export function qiniuAdapter(config: QiniuConfig): Adapter {
  qiniu.conf.ACCESS_KEY = config.accessKey
  qiniu.conf.SECRET_KEY = config.secretKey

  const mac = new qiniu.auth.digest.Mac()
  const qiniuConf = new qiniu.conf.Config({
    zone: config.zone,
  })
  const uploader = new qiniu.form_up.FormUploader(qiniuConf)
  const putExtra = new qiniu.form_up.PutExtra()

  return {
    createUrl(uploadInfo) {
      const domain = config.domain || ''
      if (domain.endsWith('/') || uploadInfo.remotePath.startsWith('/'))
        return domain + uploadInfo.remotePath

      return `${domain}/${uploadInfo.remotePath}`
    },

    async upload(uploadInfo) {
      const stream = createReadStream(uploadInfo.filePath)
      const pubPolicy = new qiniu.rs.PutPolicy({
        scope: `${config.bucket}:${uploadInfo.remotePath}`,
      })
      const uploadToken = pubPolicy.uploadToken(mac)

      return new Promise((resolve, reject) => {
        uploader.putStream(
          uploadToken,
          uploadInfo.remotePath,
          stream,
          putExtra,
          (err, res, { statusCode }) => {
            if (err)
              return reject(err)

            if (statusCode !== 200)
              return reject(res)

            resolve()
          },
        )
      })
    },
  }
}
