import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import inspect from 'vite-plugin-inspect'
import assetsUploader from 'unplugin-oss-uploader/vite'
import { Zones, qiniuAdapter } from 'unplugin-oss-uploader/adapter'
import imagemin from 'unplugin-imagemin/vite'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.')
  return {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    plugins: [
      vue(),
      inspect(),
      imagemin({
        beforeBundle: true,
      }),
      assetsUploader({
        // recommended to set `command === 'build'` in vite dev mode after your test passed.
        enable: command === 'build',
        folderName: 'vite-web',
        adapter: qiniuAdapter({
          secretKey: env.VITE_QINIU_SECRET_KEY,
          accessKey: env.VITE_QINIU_ACCESS_KEY,
          bucket: env.VITE_QINIU_BUCKET,
          domain: env.VITE_QINIU_DOMAIN,
          zone: Zones.Zone_z2,
        }),
      }),
    ],
    server: {
      host: true,
    },
  }
})
