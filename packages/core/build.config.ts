import { defineBuildConfig } from 'unbuild'

const fixEsmExportDefault = `if (exports.default) {
  const context = module.exports
  module.exports = exports.default
  Object.assign(module.exports, context)
}`

export default defineBuildConfig({
  rollup: {
    emitCJS: true,
    output: {
      exports: 'named',
      footer: (chunk) => {
        if (chunk.fileName.endsWith('.cjs'))
          return fixEsmExportDefault
      },
    },
    inlineDependencies: true,
  },
})
