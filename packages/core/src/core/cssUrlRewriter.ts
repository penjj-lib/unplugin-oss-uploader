// port from vite
// https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/css.ts
import type * as PostCSS from 'postcss'
import { PLUGIN_ID, cssImageSetRE, cssUrlRE } from './constants'

export type CssUrlReplacer = (
  url: string,
  importer?: string,
) => string | Promise<string>

export const UrlRewriterPostcssPlugin: PostCSS.PluginCreator<{
  replacer: CssUrlReplacer
}> = (opts) => {
  if (!opts)
    throw new Error('base or replace is required')

  return {
    postcssPlugin: `${PLUGIN_ID}:css-url-rewriter`,
    Once(root) {
      const promises: Promise<void>[] = []
      root.walkDecls((declaration) => {
        const importer = declaration.source?.input.file
        const isCssUrl = cssUrlRE.test(declaration.value)
        const isCssImageSet = cssImageSetRE.test(declaration.value)

        if (isCssUrl || isCssImageSet) {
          const replacerForDeclaration = (rawUrl: string) => {
            return opts.replacer(rawUrl, importer)
          }
          const rewriterToUse = isCssImageSet
            ? rewriteCssImageSet
            : rewriteCssUrls
          promises.push(
            rewriterToUse(declaration.value, replacerForDeclaration).then(
              (url) => {
                declaration.value = url
              },
            ),
          )
        }
      })
      if (promises.length)
        return Promise.all(promises) as any
    },
  }
}
UrlRewriterPostcssPlugin.postcss = true

async function asyncReplace(
  input: string,
  re: RegExp,
  replacer: (match: RegExpExecArray) => string | Promise<string>,
): Promise<string> {
  let match: RegExpExecArray | null
  let remaining = input
  let rewritten = ''
  // eslint-disable-next-line no-cond-assign
  while ((match = re.exec(remaining))) {
    rewritten += remaining.slice(0, match.index)
    rewritten += await replacer(match)
    remaining = remaining.slice(match.index + match[0].length)
  }
  rewritten += remaining
  return rewritten
}

function rewriteCssUrls(
  css: string,
  replacer: CssUrlReplacer,
): Promise<string> {
  return asyncReplace(css, cssUrlRE, async (match) => {
    const [matched, rawUrl] = match
    return await doUrlReplace(rawUrl.trim(), matched, replacer)
  })
}

const externalRE = /^(https?:)?\/\//
const isExternalUrl = (url: string): boolean => externalRE.test(url)

const dataUrlRE = /^\s*data:/i
const isDataUrl = (url: string): boolean => dataUrlRE.test(url)

const functionCallRE = /^[A-Z_][\w-]*\(/i
const nonEscapedDoubleQuoteRe = /(?<!\\)(")/g
function skipUrlReplacer(rawUrl: string) {
  return (
    isExternalUrl(rawUrl)
    || isDataUrl(rawUrl)
    || rawUrl[0] === '#'
    || functionCallRE.test(rawUrl)
  )
}

async function doUrlReplace(
  rawUrl: string,
  matched: string,
  replacer: CssUrlReplacer,
  funcName: string = 'url',
) {
  let wrap = ''
  const first = rawUrl[0]
  if (first === `"` || first === `'`) {
    wrap = first
    rawUrl = rawUrl.slice(1, -1)
  }

  if (skipUrlReplacer(rawUrl))
    return matched

  let newUrl = await replacer(rawUrl)
  // The new url might need wrapping even if the original did not have it, e.g. if a space was added during replacement
  if (wrap === '' && newUrl !== encodeURI(newUrl))
    wrap = '"'

  // If wrapping in single quotes and newUrl also contains single quotes, switch to double quotes.
  // Give preference to double quotes since SVG inlining converts double quotes to single quotes.
  if (wrap === '\'' && newUrl.includes('\''))
    wrap = '"'

  // Escape double quotes if they exist (they also tend to be rarer than single quotes)
  if (wrap === '"' && newUrl.includes('"'))
    newUrl = newUrl.replace(nonEscapedDoubleQuoteRe, '\\"')

  return `${funcName}(${wrap}${newUrl}${wrap})`
}

// TODO: image and cross-fade could contain a "url" that needs to be processed
// https://drafts.csswg.org/css-images-4/#image-notation
// https://drafts.csswg.org/css-images-4/#cross-fade-function
const cssNotProcessedRE = /(?:gradient|element|cross-fade|image)\(/

async function rewriteCssImageSet(
  css: string,
  replacer: CssUrlReplacer,
): Promise<string> {
  return await asyncReplace(css, cssImageSetRE, async (match) => {
    const [, rawUrl] = match
    const url = await processSrcSet(rawUrl, async ({ url }) => {
      // the url maybe url(...)
      if (cssUrlRE.test(url))
        return await rewriteCssUrls(url, replacer)

      if (!cssNotProcessedRE.test(url))
        return await doUrlReplace(url, url, replacer)

      return url
    })
    return url
  })
}

const blankReplacer = (match: string): string => ' '.repeat(match.length)

const escapedSpaceCharacters = /( |\\t|\\n|\\f|\\r)+/g
const imageSetUrlRE = /^(?:[\w\-]+\(.*?\)|'.*?'|".*?"|\S*)/
const cleanSrcSetRE
  = /(?:url|image|gradient|cross-fade)\([^)]*\)|"([^"]|(?<=\\)")*"|'([^']|(?<=\\)')*'|data:\w+\/[\w.+\-]+;base64,[\w+/=]+/g

function splitSrcSet(srcs: string) {
  const parts: string[] = []
  // There could be a ',' inside of url(data:...), linear-gradient(...), "data:..." or data:...
  const cleanedSrcs = srcs.replace(cleanSrcSetRE, blankReplacer)
  let startIndex = 0
  let splitIndex: number
  do {
    splitIndex = cleanedSrcs.indexOf(',', startIndex)
    parts.push(
      srcs.slice(startIndex, splitIndex !== -1 ? splitIndex : undefined),
    )
    startIndex = splitIndex + 1
  } while (splitIndex !== -1)
  return parts
}

function splitSrcSetDescriptor(srcs: string): ImageCandidate[] {
  return splitSrcSet(srcs)
    .map((s) => {
      const src = s.replace(escapedSpaceCharacters, ' ').trim()
      const url = imageSetUrlRE.exec(src)?.[0] ?? ''

      return {
        url,
        descriptor: src.slice(url.length).trim(),
      }
    })
    .filter(({ url }) => !!url)
}

interface ImageCandidate {
  url: string
  descriptor: string
}

function processSrcSet(
  srcs: string,
  replacer: (arg: ImageCandidate) => Promise<string>,
): Promise<string> {
  return Promise.all(
    splitSrcSetDescriptor(srcs).map(async ({ url, descriptor }) => ({
      url: await replacer({ url, descriptor }),
      descriptor,
    })),
  ).then(joinSrcset)
}

function joinSrcset(ret: ImageCandidate[]) {
  return ret.map(({ url, descriptor }) => `${url} ${descriptor}`).join(', ')
}
