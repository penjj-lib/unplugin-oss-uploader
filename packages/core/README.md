# unplugin-oss-uploader

When building, scan the inline static files in the code and upload them to oss.
Because of the size limit of `WeChat mini programs`, it is very useful in mini programs.

使用taro来进行小程序开发，编译css通常会把图片等静态资源构建成内联资源。但是因为小程序的包体积限制，导致无法上传到小程序平台。通常还需要手动把图片资源上传到oss，然后手动替换css中的路径。
此插件在webpack下，通过 webpack-loader 来检测静态资源，并替换路径，最后上传到oss。在vite下，通过 postcss 和 vite 插件来解析并替换css中的资源。

## Install

```bash
npm i unplugin-oss-uploader -D
yarn i unplugin-oss-uploader -D
pnpm i unplugin-oss-uploader -D
```

## Usage with webpack

[taro + webpack demo](/examples/taro-mp)

```ts
// webpack.config.js
import ossUploader from 'unplugin-oss-uploader/webpack'
import { Zones, qiniuAdapter } from 'unplugin-oss-uploader/adapter'

// put in your's webpack config
export default {
  plugins: [
    assetsLoader({
      adapter: qiniuAdapter({
        // Keep your keys safe, recommend using environment variables in devops
        // or write your custom adapter.
        secretKey: process.env.VITE_QINIU_SECRET_KEY!,
        accessKey: process.env.VITE_QINIU_ACCESS_KEY!,
        bucket: process.env.VITE_QINIU_BUCKET!,
        domain: process.env.VITE_QINIU_DOMAIN!,
        zone: Zones.Zone_z2,
      }),
    })
  ]
}
```

## Usage with vite

[vite demo](/examples/web)

```ts
// vite.config.ts
import ossUploader from 'unplugin-oss-uploader/vite'
import { Zones, qiniuAdapter } from 'unplugin-oss-uploader/adapter'

export default defineConfig({
  plugins: [
    ossUploader({
      adapter: qiniuAdapter({
        // Keep your keys safe, recommend using environment variables in devops
        // or write your custom adapter.
        secretKey: process.env.VITE_QINIU_SECRET_KEY!,
        accessKey: process.env.VITE_QINIU_ACCESS_KEY!,
        bucket: process.env.VITE_QINIU_BUCKET!,
        domain: process.env.VITE_QINIU_DOMAIN!,
        zone: Zones.Zone_z2,
      }),
    })
  ]
})
```

## build

```bash
npm run build
```

Now you can check your dist directory and see the compiled inline file paths.

## Supported adapters

Currently supported adapters:

```ts
import { qiniuAdapter, tencentAdapter } from 'unplugin-oss-uploader/adapter'
// qiniuAdapter: qiniu.com
// tencentAdapter: cloud.tencent.com
```

Welcome to PR more adapters.

## Custom adapter

```ts
// myAdapter.ts
import type { Adapter } from 'unplugin-oss-uploader/adapter'

export function myAdapter(options: any): Adapter {
  return {
    async upload(file, name) {
      // Upload the file, when it fails, the build will be interrupted.
    },
    createUrl(filePath) {
      // Generate your filename ready and sync back
      return `https://your-cdn.com/${name}`
    },
  }
}
```
