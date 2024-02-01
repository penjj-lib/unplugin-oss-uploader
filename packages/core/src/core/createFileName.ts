import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

// port from nanoid
// https://github.com/ai/nanoid
const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
function nanoid(size = 21) {
  let id = ''
  let i = size
  while (i--)
    id += urlAlphabet[(Math.random() * 64) | 0]
  return id
}

const names = new Set()
function createUniqueId(name = nanoid(10)): string {
  if (names.size === names.add(name).size)
    return createUniqueId()

  return name
}

export function createUniqueFileName(file: string) {
  const ext = file.split('.').pop()
  return `${createUniqueId()}.${ext}`
}

export async function createMd5SumFileName(file: string) {
  const buffer = await readFile(file)
  const ext = file.split('.').pop()
  const sum = createHash('md5').update(buffer).digest('hex')
  return `${sum}.${ext}`
}
