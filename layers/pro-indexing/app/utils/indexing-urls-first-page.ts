/**
 * Page size the URLs page and `TableIndexingUrls` mount with.
 *
 * nuxtseo.com also ships a route middleware that seeds this first page into
 * the SSR payload. That seeding needs a server-side handle on the gscdump
 * browser proxy, which this app does not have, so the table takes its first
 * page on the client like every other Search Console read here.
 */
export const INDEXING_URLS_PAGE_SIZE = 25
