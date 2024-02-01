import type { WebpackCompiler } from 'unplugin'
import type { LoaderDefinition } from 'webpack'
import { name } from '../../package.json'
import type { Context } from './context'
import { PLUGIN_ID } from './constants'

const loaderName = `${name}/asset-loader`
export const loaderPath = typeof module !== 'undefined'
  ? require.resolve(loaderName)
  : loaderName

function getExportDeclare(isEsm = false) {
  return isEsm ? 'export default ' : 'module.exports='
}

function getContext(compiler: WebpackCompiler) {
  const pluginContext = compiler.$unpluginContext[PLUGIN_ID] as any
  return pluginContext.getContext() as Context
}

// convert assets content to remote url
const assetsLoader: LoaderDefinition = function () {
  const { _compiler, cacheable, resourcePath, environment, async } = this
  const callback = async()
  cacheable && cacheable()
  const context = getContext(_compiler as any as WebpackCompiler)
  context.createTask(resourcePath).then((url) => {
    const declare = getExportDeclare(environment?.module)
    callback(null, `${declare}${JSON.stringify(url)}`)
  })
}

assetsLoader.pitch = function () {
  const { _compiler, resourcePath } = this
  const context = getContext(_compiler as any as WebpackCompiler)
  this.loaders = this.loaders.filter((loader) => {
    return loader.path.includes(name) && context.isIncludes(resourcePath)
  })
}

export default assetsLoader
