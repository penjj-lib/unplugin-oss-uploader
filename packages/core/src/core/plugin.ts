import { createUnplugin } from 'unplugin'
import { createFilter } from '@rollup/pluginutils'
import type { ResolveFn } from 'vite'
import { type CssUrlReplacer, UrlRewriterPostcssPlugin } from './cssUrlRewriter'
import { DEFAULT_ASSETS_RE, PLUGIN_ID } from './constants'
import { loaderPath } from './webpackLoader'
import { Context } from './context'
import type { Adapter } from './adapter'
import { createMd5SumFileName } from './createFileName'
import { applySilent, logUploadStart } from './logger'

export interface UserOptions {
  /**
   * should include files
   */
  exclude?: ReadonlyArray<string | RegExp> | string | RegExp | null
  /**
   * should exclude files
   */
  include?: ReadonlyArray<string | RegExp> | string | RegExp | null
  /**
   * OSS adapter
   * @example
   * ```ts
   * import { ossUploader } from 'unplugin-oss-uploader/vite'
   * import { qiniuAdapter } from 'unplugin-oss-uploader/adapter'
   *
   * plugins: [
   *   ossUploader({
   *     adapter: qiniuAdapter({
   *       // ...
   *     })
   *   })
   * ]
   * ```
   */
  adapter: Adapter

  /**
   * file prefix, set to false to disable. default is current timestamp
   */
  folderName?: (() => string) | string | false

  /**
   * create upload filename
   */
  createFilename?: (file: string) => string | Promise<string>

  /**
   * should enable plugin, default is true
   */
  enable?: boolean

  /**
   * disable logger
   */
  silent?: boolean

  /**
   * upload limit
   */
  uploadLimit?: number
}

function createDateFolder() {
  return `${new Date().toLocaleDateString().replaceAll('/', '-')}`
}

export const plugin = createUnplugin<UserOptions>((
  {
    include,
    exclude,
    adapter,
    uploadLimit,
    enable = true,
    silent = false,
    folderName = createDateFolder,
    createFilename = createMd5SumFileName,
  },
  { framework },
) => {
  if (!adapter)
    throw new Error('unplugin-oss-uploader: `options.adapter` is required.')

  if (!enable) {
    return {
      name: PLUGIN_ID,
    }
  }

  if (silent)
    applySilent()

  const filter = createFilter(include, exclude)
  const context = new Context(
    adapter,
    filter,
    folderName,
    createFilename,
    uploadLimit,
  )

  let resolveUrl: ResolveFn
  let replacer: CssUrlReplacer
  let assetsInclude: (file: string) => boolean
  let isServe = false

  return {
    name: PLUGIN_ID,

    getContext() {
      return context
    },

    vite: {
      enforce: 'post',
      config(config) {
        const css = config.css ||= {}
        const postcss = (css.postcss as any) ||= {}
        const plugins = postcss.plugins ||= []
        plugins.push(UrlRewriterPostcssPlugin({
          replacer: (url, importer) => {
            return replacer(url, importer)
          },
        }))
        return config
      },
      configResolved(config) {
        assetsInclude = config.assetsInclude
        resolveUrl = config.createResolver({
          preferRelative: true,
          tryIndex: false,
          extensions: [],
        })
        isServe = config.command === 'serve'
        replacer = async (url, importer) => {
          const decodedUrl = decodeURI(url)
          const resolved = await resolveUrl(decodedUrl, importer)
          if (resolved)
            return context.createTask(resolved, isServe)

          return url
        }
      },
      generateBundle(_, bundle, isWrite) {
        if (!isWrite)
          return
        Object.keys(bundle).forEach((key) => {
          if (assetsInclude(key))
            delete bundle[key]
        })
      },
    },

    webpack(compiler) {
      compiler.options.module.rules.push({
        test: DEFAULT_ASSETS_RE,
        type: 'javascript/auto',
        loader: loaderPath,
      })
    },

    transformInclude(id) {
      // webpack will handle asset file by `unplugin-oss-uploader/asset-loader`.
      return framework === 'vite' && assetsInclude(id) && filter(id)
    },

    async transform(_, id) {
      return `export default "${await context.createTask(id, isServe)}"`
    },

    writeBundle() {
      if (context.files.length)
        logUploadStart()

      context.uploadAll()
    },
  }
})
