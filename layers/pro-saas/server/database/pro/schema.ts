// This layer's slice of the `pro` database, as `modules/drizzle-layers`
// discovers it. The tables themselves still live in one file; this re-export
// is what puts them behind `#schema/pro`, the specifier nuxtseo.com's server
// code imports.
export * from '~~/layers/core/server/db/schema'
