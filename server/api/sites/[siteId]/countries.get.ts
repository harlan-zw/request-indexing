import { asc, avg, between, count, desc, gt, like, sum } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import {
  siteDateCountryAnalytics,
  sites,
} from '~/server/database/schema'
import { userPeriodRange } from '~/server/app/models/User'
import countries from '~/server/data/countries'

export default defineEventHandler(async (e) => {
  // extract from db
  const user = await authenticateUser(e)
  const { siteId } = getRouterParams(e, { decode: true })
  const site = await useDrizzle().query.sites.findFirst({
    where: eq(sites.publicId, siteId),
  })
  if (!site) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Site not found',
    })
  }
  const db = useDrizzle()
  const { filters, offset, q, sort, pageSize } = getQueryAsyncDataTable<'top-level' | 'new' | 'lost' | 'improving' | 'declining'>(e)
  const range = userPeriodRange(user)
  const _where = [
    eq(siteDateCountryAnalytics.siteId, site.siteId),
  ]
  if (q?.length)
    _where.push(like(siteDateCountryAnalytics.country, `%${q}%`))

  const sq = db
    .select({
      country: siteDateCountryAnalytics.country,
      currClicks: sum(siteDateCountryAnalytics.clicks).as('currClicks'),
      currImpressions: sum(siteDateCountryAnalytics.impressions).as('currImpressions'),
      currCtr: avg(siteDateCountryAnalytics.ctr).as('currCtr'),
      currPosition: avg(siteDateCountryAnalytics.position).as('currPosition'),
    })
    .from(siteDateCountryAnalytics)
    .where(and(
      between(siteDateCountryAnalytics.date, range.period.startDate, range.period.endDate),
      ..._where,
    ))
    .groupBy(siteDateCountryAnalytics.country)
    .as('sq')

  const sq2 = db
    .select({
      country: siteDateCountryAnalytics.country,
      prevClicks: sum(siteDateCountryAnalytics.clicks).as('prevClicks'),
      prevImpressions: sum(siteDateCountryAnalytics.impressions).as('prevImpressions'),
      prevCtr: avg(siteDateCountryAnalytics.ctr).as('prevCtr'),
      prevPosition: avg(siteDateCountryAnalytics.position).as('prevPosition'),
    })
    .from(siteDateCountryAnalytics)
    .where(and(
      between(siteDateCountryAnalytics.date, range.prevPeriod.startDate, range.prevPeriod.endDate),
      ..._where,
    ))
    .groupBy(siteDateCountryAnalytics.country)
    .as('sq2')

  const countriesSq = db.select({
    country: siteDateCountryAnalytics.country,
    clicks: sq.currClicks,
    clicksPercent: sql`CASE WHEN (${sq.currClicks} + ${sq2.prevClicks}) = 0 THEN 0 ELSE ROUND(((CAST(${sq.currClicks} AS REAL) - ${sq2.prevClicks}) / ((CAST(${sq.currClicks} AS REAL) + ${sq2.prevClicks}) / 2)) * 100, 2) END`.as('clicksPercent'),
    impressions: sq.currImpressions,
    ctr: sq.currCtr,
    position: sq.currPosition,
    prevPosition: sq2.prevPosition,
    prevImpressions: sq2.prevImpressions,
    prevCtr: sq2.prevCtr,
    prevClicks: sq2.prevClicks,
  })
    .from(siteDateCountryAnalytics)
    .leftJoin(sq, eq(siteDateCountryAnalytics.country, sq.country))
    .leftJoin(sq2, eq(siteDateCountryAnalytics.country, sq2.country))
    .where(and(
      eq(siteDateCountryAnalytics.siteId, site.siteId),
    ))
    .groupBy(siteDateCountryAnalytics.country)
    .as('countriesSq')

  console.log(filters)
  let finalWhere
  if (filters.includes('new')) {
    finalWhere = and(
      gt(countriesSq.clicks, 0),
      eq(countriesSq.prevClicks, 0),
    )
  }
  else if (filters.includes('lost')) {
    finalWhere = and(
      eq(countriesSq.clicks, 0),
      gt(countriesSq.prevClicks, 0),
    )
  }
  else if (filters.includes('improving')) {
    finalWhere = gt(countriesSq.clicks, countriesSq.prevClicks)
  }
  else if (filters.includes('declining')) {
    finalWhere = gt(countriesSq.prevClicks, countriesSq.clicks)
  }
  if (filters.includes('with-clicks')) {
    finalWhere = and(
      finalWhere,
      gt(countriesSq.clicks, 5),
      gt(countriesSq.prevClicks, 5),
    )
  }
  console.log({ sort })

  const rows = await useDrizzle().select()
    .from(countriesSq)
    .orderBy(sort.column ? (sort.direction === 'asc' ? asc(countriesSq[sort.column]) : desc(countriesSq[sort.column])) : desc(countriesSq.clicks))
    .offset(offset)
    .where(finalWhere)
    .limit(pageSize)

  const totals = await useDrizzle().select({
    count: count().as('total'),
    clicks: sum(countriesSq.clicks).as('clicks'),
  })
    .from(countriesSq)
    .where(finalWhere)
  return {
    rows: rows.map((row) => {
      const alpha3Code = row.country
      const country = countries.find(c => c['alpha-3'].toLowerCase() === alpha3Code)
      return {
        ...row,
        percent: (row.clicks / totals[0].clicks) * 100,
        countryCodeGsc: alpha3Code,
        country: country?.name || alpha3Code,
        countryCode: country?.['alpha-2'] || alpha3Code,
      }
    }),
    total: totals[0].count,
  }
})
