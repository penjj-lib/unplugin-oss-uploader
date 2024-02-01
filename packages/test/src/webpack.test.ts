import { resolve } from 'node:path'
import { webpack } from 'webpack'
import { expect, it } from 'vitest'
import { VueLoaderPlugin } from 'vue-loader'
import MiniCssExtract from 'mini-css-extract-plugin'
import cdnUploader from 'unplugin-oss-uploader/webpack'
import Terser from 'terser-webpack-plugin'
import { clearPath, mockedAdapter } from './testUtils'

const testProjRoot = resolve(process.cwd(), 'src/fixture')

it('webpack build', async () => {
  const compiler = webpack({
    plugins: [
      new VueLoaderPlugin(),
      new MiniCssExtract({
        filename: 'style.css',
        chunkFilename: 'style.css',
      }),
      cdnUploader({
        folderName: 'webpack',
        adapter: mockedAdapter(),
      }),
      new Terser({
      }),
    ],
    entry: resolve(testProjRoot, 'index.js'),
    stats: 'none',
    mode: 'production',
    optimization: {
      minimize: false,
    },
    resolve: {
      alias: {
        '@': testProjRoot,
      },
    },
    output: {
      filename: 'webpack.js',
      path: resolve(testProjRoot, 'dist'),
      clean: false,
    },
    externals: ['vue'],
    module: {
      rules: [
        {
          test: /\.vue$/i,
          loader: 'vue-loader',
        },
        {
          test: /\.scss$/i,
          use: ['sass-loader', MiniCssExtract.loader, 'css-loader', 'postcss-loader'],
        },
        {
          test: /\.css$/i,
          use: [MiniCssExtract.loader, 'css-loader', 'postcss-loader'],
        },
      ],
    },
  })
  const { css, js } = await new Promise<{ js: string, css: string }>(
    (resolver, reject) => {
      compiler.compile((_, compile) => {
        if (!compile)
          return reject(new Error('compile error'))
        const { assets } = compile
        resolver({
          js: assets['webpack.js'].source().toString(),
          css: assets['style.css'].source().toString(),
        })
      })
    },
  )

  expect(clearPath(js)).toMatchSnapshot()
  expect(clearPath(css)).toMatchSnapshot()
})
