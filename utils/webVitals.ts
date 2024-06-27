import audits from "~/audits-clean.json";

function simpleMarkdownIt(s: string) {
  // we need to convert links into html for example
  // [Learn more](https://web.dev/lighthouse-largest-contentful-paint/) -> <a href="https://web.dev/lighthouse-largest-contentful-paint/">Learn more</a>
  return s
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a class="underline" target="_blank" href="$2">$1</a>')
    .replace(/\n/g, '<br>')
}

export const webVitals = {
  'first-contentful-paint': {
    name: 'First Contentful Paint',
    descriptionHtml: simpleMarkdownIt(audits['first-contentful-paint'].description),
    score: {
      good: 1800,
      moderate: 3000,
    },
    scoreHuman: {
      good: 'Less than 1.8 second',
      moderate: '1.8 - 3 seconds',
      poor: 'More than 3 seconds',
    },
  },
  'largest-contentful-paint': {
    name: 'Largest Contentful Paint',
    descriptionHtml: simpleMarkdownIt(audits['cumulative-layout-shift'].description),
    score: {
      good: 2500,
      moderate: 4000,
    },
    scoreHuman: {
      good: 'Less than 2.5 seconds',
      moderate: '2.5 - 4 seconds',
      poor: 'More than 4 seconds',
    },
  },
  'cumulative-layout-shift': {
    name: 'Cumulative Layout Shift',
    descriptionHtml: simpleMarkdownIt(audits['cumulative-layout-shift'].description),
    score: {
      good: 0.1,
      moderate: 0.25,
    },
    scoreHuman: {
      good: 'Less than 0.1',
      moderate: '0.1 - 0.25',
      poor: 'More than 0.25',
    },
  },
  'speed-index': {
    name: 'Speed Index',
    descriptionHtml: simpleMarkdownIt(audits['speed-index'].description),
    score: {
      good: 3400,
      moderate: 5800,
    },
    scoreHuman: {
      good: 'Less than 3.4 seconds',
      moderate: '3.4 - 5.8 seconds',
      poor: 'More than 5.8 seconds',
    },
  },
  'total-blocking-time': {
    name: 'Total Blocking Time',
    descriptionHtml: simpleMarkdownIt(audits['total-blocking-time'].description),
    score: {
      good: 200,
      moderate: 600,
    },
    scoreHuman: {
      good: 'Less than 200 milliseconds',
      moderate: '200 - 600 milliseconds',
      poor: 'More than 600 milliseconds',
    },
  },
  'interaction-next-paint': {
    name: 'Interaction Next Paint',
    descriptionHtml: 'Time to Interactive is the amount of time it takes for the page to become fully interactive. <a class="underline" target="_blank" href="https://web.dev/articles/inp">Interaction to Next Paint (INP)</a>.',
    score: {
      good: 200,
      moderate: 500,
    },
    scoreHuman: {
      good: 'Less than 200ms',
      moderate: '200 - 500ms',
      poor: 'More than 500ms',
    },
  },
  'time-to-first-byte': {
    name: 'Time to First Byte',
    descriptionHtml: 'Time to First Byte is the amount of time it takes for the server to respond to a request. <a class="underline" target="_blank" href="https://web.dev/time-to-first-byte">Time to First Byte</a>.',
    score: {
      good: 600,
      moderate: 1200,
    },
    scoreHuman: {
      good: 'Less than 600 milliseconds',
      moderate: '600 - 1200 milliseconds',
      poor: 'More than 1200 milliseconds',
    },
  }
} as const
