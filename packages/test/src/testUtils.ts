import process from 'node:process'
import type { Adapter } from 'unplugin-oss-uploader/adapter'

/**
 * Convert assets file path to mocked path
 */
export function mockedAdapter(): Adapter {
  return {
    upload: () => Promise.resolve(),
    createUrl(uploadInfo) {
      return `https://example.com/${uploadInfo.remotePath}`
    },
  }
}

export function clearPath(content: string) {
  return content.replaceAll(process.cwd(), '')
}
