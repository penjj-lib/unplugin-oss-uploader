import { resolve } from 'node:path'
import { readFile, rm } from 'node:fs/promises'
import { build } from 'vite'
import { afterAll, expect, it } from 'vitest'
import vue from '@vitejs/plugin-vue'
import cdnUploader from 'unplugin-oss-uploader/vite'
import { clearPath, mockedAdapter } from './testUtils'

const root = resolve(process.cwd(), 'src/fixture')
const resolveRoot = (...path: string[]) => resolve(root, ...path)

afterAll(() => {
  rm(resolveRoot('./dist'), { recursive: true, force: true })
})

it('vite build', async () => {
  await build({
    root,
    logLevel: 'silent',
    plugins: [
      vue(),
      cdnUploader({
        folderName: 'vite',
        adapter: mockedAdapter(),
      }),
    ],
    resolve: {
      alias: {
        '@': '.',
      },
    },
    build: {
      minify: false,
      outDir: 'dist',
      assetsInlineLimit: 0,
      rollupOptions: {
        external: ['vue'],
        output: {
          preserveModules: false,
          entryFileNames: () => 'vite.js',
          assetFileNames: info => info.name!,
        },
      },
    },
  })

  const js = await readFile(resolveRoot('./dist/vite.js'), 'utf8')
  expect(clearPath(js)).toMatchSnapshot()

  const css = await readFile(resolveRoot('./dist/index.css'), 'utf8')
  expect(clearPath(css)).toMatchSnapshot()
})
