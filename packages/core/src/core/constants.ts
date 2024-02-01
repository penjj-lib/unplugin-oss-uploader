// port from vite
// https://github.com/vitejs/vite/blob/main/packages/vite/src/node/constants.ts
//   looked up by mrmime.
import { name } from '../../package.json'

export const KNOWN_ASSET_TYPES = [
  // images
  'apng',
  'png',
  'jpe?g',
  'jfif',
  'pjpeg',
  'pjp',
  'gif',
  'svg',
  'ico',
  'webp',
  'avif',

  // media
  'mp4',
  'webm',
  'ogg',
  'mp3',
  'wav',
  'flac',
  'aac',
  'opus',

  // fonts
  'woff2?',
  'eot',
  'ttf',
  'otf',

  // other
  'webmanifest',
  'pdf',
  'txt',
]

export const DEFAULT_ASSETS_RE = new RegExp(
  `\\.(${KNOWN_ASSET_TYPES.join('|')})(\\?.*)?$`,
)

export const CSS_LANGS_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/

// https://drafts.csswg.org/css-syntax-3/#identifier-code-point
export const cssUrlRE = /(?<=^|[^\w\-\u0080-\uFFFF])url\((\s*('[^']+'|"[^"]+")\s*|[^'")]+)\)/

// Assuming a function name won't be longer than 256 chars
export const cssImageSetRE = /(?<=image-set\()((?:[\w\-]{1,256}\([^)]*\)|[^)])*)(?=\))/

export const assetUrlRE = /__VITE_ASSET__([a-zA-Z\d$]+)__(?:\$_(.*?)__)?/g

export const PLUGIN_ID = name
