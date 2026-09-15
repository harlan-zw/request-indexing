import type { ComputedRef } from 'vue'
import type { FaviconBacking } from './useFaviconBacking'
import { beforeEach, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, onMounted } from 'vue'
import { colorMode } from '../../../../tests/setup/nuxt-imports'
import { useFaviconBacking } from './useFaviconBacking'

// A returning visitor's favicon is already in the browser cache, so the
// server-rendered `<img>` is `complete` before hydration attaches a listener
// and no `load` event ever fires. The component samples the element from
// `onMounted` instead. Passing a hand-built `new Event('load')` down that path
// handed the canvas `e.target`, which is `null` on a synthetic event, and
// `drawImage(null)` threw out of `onMounted` — every dashboard page rendered
// Nuxt's 500 instead. So the sampler takes the element, and nothing else can
// reach the canvas.

const drawn: unknown[] = []
let ink: [number, number, number] = [0, 0, 0]

// happy-dom has no 2D context. Stand in for the browser's: record what was
// drawn, and refuse anything that is not an image the way Chrome does.
beforeEach(() => {
  drawn.length = 0
  ink = [0, 0, 0]
  colorMode.value = 'light'
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage(source: unknown) {
      if (!(source instanceof HTMLImageElement))
        throw new TypeError('Failed to execute \'drawImage\' on \'CanvasRenderingContext2D\': The provided value is not of type \'(CSSImageValue or HTMLCanvasElement or HTMLImageElement or ...)\'')
      drawn.push(source)
    },
    getImageData: (_x: number, _y: number, w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = ink[0]
        data[i + 1] = ink[1]
        data[i + 2] = ink[2]
        data[i + 3] = 255
      }
      return { data }
    },
  })) as never
})

/** Mount a favicon-shaped consumer that samples a cached image on mount. */
function sampleOnMount(domain: string, image: HTMLImageElement) {
  let backing!: ComputedRef<FaviconBacking>
  const app = createApp(defineComponent({
    setup() {
      const state = useFaviconBacking(() => domain)
      backing = state.backing
      onMounted(() => state.sample(image))
      return () => h('span')
    },
  }))
  app.mount(document.createElement('div'))
  return backing
}

function cachedImage() {
  const image = document.createElement('img')
  Object.defineProperty(image, 'naturalWidth', { value: 32 })
  Object.defineProperty(image, 'naturalHeight', { value: 32 })
  return image
}

it('samples the cached image element itself, never an event', () => {
  const image = cachedImage()
  sampleOnMount('black-ink.test', image)
  expect(drawn).toEqual([image])
})

it('backs a black favicon with a light tile on a dark theme', () => {
  colorMode.value = 'dark'
  ink = [0, 0, 0]
  expect(sampleOnMount('dark-glyph.test', cachedImage()).value).toBe('light')
})

it('leaves a brand-coloured favicon bare in both themes', () => {
  ink = [120, 130, 140]
  expect(sampleOnMount('brand-colour.test', cachedImage()).value).toBe('none')
  colorMode.value = 'dark'
  expect(sampleOnMount('brand-colour-dark.test', cachedImage()).value).toBe('none')
})

it('skips an image with no decoded bytes rather than sampling a blank canvas', () => {
  const image = document.createElement('img')
  expect(sampleOnMount('not-decoded.test', image).value).toBe('none')
  expect(drawn).toEqual([])
})
