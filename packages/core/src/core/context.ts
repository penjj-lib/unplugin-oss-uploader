import { join } from 'node:path/posix'
import type { Adapter, UploadInfo } from './adapter'
import { logError, logScannedFile, logSuccess, logUploading } from './logger'

export class Context {
  private prefix: string
  private cache = new Map<string, UploadInfo>()
  // immediate mode uploaded files
  private uploaded = new Set<string>()

  constructor(
    private adapter: Adapter,
    public isIncludes: (file: string) => boolean,
    folderName: false | string | (() => string),
    private createFilename: (file: string) => string | Promise<string>,
    private uploadLimit?: number,
  ) {
    const prefix = typeof folderName === 'function' ? folderName() : folderName
    this.prefix = prefix || ''
  }

  get files() {
    return [...this.cache.values()]
  }

  private async doUpload(uploadInfo: UploadInfo) {
    logUploading(uploadInfo)
    return this.adapter.upload(uploadInfo)
  }

  private async createUploadInfo(filePath: string): Promise<UploadInfo> {
    const fileName = await this.createFilename(filePath)
    return {
      filePath,
      remotePath: join(this.prefix, fileName),
    }
  }

  async uploadAll(): Promise<void> {
    if (!this.files.length)
      return
    try {
      await Promise.all(
        this.files.map(item => this.doUpload(item)),
      )
      logSuccess()
    }
    catch (e) {
      logError(e)
    }
  }

  // generate remote url by file content or name, add upload task.
  async createTask(filePath: string, immediate = false): Promise<string> {
    // remove query
    const normalized = filePath.replace(/\?\w+$/, '')
    let info = this.cache.get(normalized)
    if (!info) {
      info = await this.createUploadInfo(normalized)
      logScannedFile(info)
      this.cache.set(normalized, info)
      if (immediate && this.uploaded.size < this.uploaded.add(normalized).size)
        this.doUpload(info)
    }
    return this.adapter.createUrl(info)
  }
}
