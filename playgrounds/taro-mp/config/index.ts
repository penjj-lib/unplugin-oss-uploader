import { resolve } from 'node:path'
import process from 'node:process'
import { type UserConfigExport, defineConfig } from '@tarojs/cli'
import assetsLoader from 'unplugin-oss-uploader/webpack'
import { Zones, qiniuAdapter } from 'unplugin-oss-uploader/adapter'
import dotenv from 'dotenv'
import type Chain from 'webpack-chain'
import devConfig from './dev'
import prodConfig from './prod'

dotenv.config({
  path: resolve(process.cwd(), '.env.local'),
})

function webpackChain(chain: Chain) {
  chain.plugin('assets-loader').use(assetsLoader({
    folderName: 'taro-mp',
    adapter: qiniuAdapter({
      secretKey: process.env.VITE_QINIU_SECRET_KEY!,
      accessKey: process.env.VITE_QINIU_ACCESS_KEY!,
      bucket: process.env.VITE_QINIU_BUCKET!,
      domain: process.env.VITE_QINIU_DOMAIN!,
      zone: Zones.Zone_z2,
    }),
  }))
}

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig(async (merge) => {
  const baseConfig: UserConfigExport = {
    projectName: 'taro-mp',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: 'vue3',
    compiler: {
      type: 'webpack5',
      prebundle: {
        enable: true,
      },
    },
    cache: {
      enable: true, // Webpack 持久化缓存配置，建议开启。默认配置请参考：https://docs.taro.zone/docs/config-detail#cache
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        url: {
          enable: false,
          config: {
            limit: 1024, // 设定转换尺寸上限
          },
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
      webpackChain,
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      output: {
        filename: 'js/[name].[hash:8].js',
        chunkFilename: 'js/[name].[chunkhash:8].js',
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css',
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
      webpackChain,
    },
    rn: {
      appName: 'taroDemo',
      postcss: {
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        },
      },
    },
  }
  if (process.env.NODE_ENV === 'development') {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig)
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig)
})
