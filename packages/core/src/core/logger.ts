import process from 'node:process'
import type { ChalkInstance } from 'chalk'
import { name } from '../../package.json'
import type { UploadInfo } from './adapter'

let cache: ChalkInstance
async function resolveChalk() {
  return cache ||= (await import('chalk')).default
}

let silent = false

export function applySilent() {
  silent = true
}

function getShortPath(path: string) {
  return path.replace(process.cwd(), '.')
}

async function log(...args: any[]) {
  if (silent)
    return
  // eslint-disable-next-line no-console
  console.log(`[${name}]`, ...args)
}

export async function logScannedFile(uploadInfo: UploadInfo) {
  const chalk = await resolveChalk()
  const shortPath = getShortPath(uploadInfo.filePath)
  log(chalk.blue('Found asset file:'), chalk.white(shortPath))
}

export async function logUploading(uploadInfo: UploadInfo) {
  const chalk = await resolveChalk()
  const shortPath = getShortPath(uploadInfo.filePath)
  log(chalk.blue('Uploading:'), chalk.yellow(shortPath), ' => ', chalk.green(uploadInfo.remotePath))
}

export async function logUploadStart() {
  const chalk = await resolveChalk()
  log(chalk.yellow('Start uploading...'))
}

export async function logSuccess() {
  const chalk = await resolveChalk()
  log(chalk.green('Successfully!'))
}

export async function logError(e: any) {
  const chalk = await resolveChalk()
  console.error(chalk.red('Error:'), e)
}
