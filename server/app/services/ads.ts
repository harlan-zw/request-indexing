import { GoogleAdsApi } from 'google-ads-api'

export async function fetchKeywordHistorialData(keywords: string[]) {
  const { adsApiToken: developer_token, adsCustomerId: customer_id, adsClientId: client_id, adsClientSecret: client_secret, adsRefreshToken: refresh_token } = useRuntimeConfig().google
  const client = new GoogleAdsApi({
    client_id,
    client_secret,
    developer_token,
  })

  const customer = client.Customer({
    customer_id,
    refresh_token,
  })

  const res = await customer.keywordPlanIdeas.generateKeywordHistoricalMetrics({
    keywords,
    customer_id,
    keyword_plan_network: 'GOOGLE_SEARCH',
  }).catch((err) => {
    return { err }
  }).then(res => res.results)
  return res
}

export async function fetchKeywordIdeas(keyword: string | string[]) {
  const { adsApiToken: developer_token, adsCustomerId: customer_id, adsClientId: client_id, adsClientSecret: client_secret, adsRefreshToken: refresh_token } = useRuntimeConfig().google
  console.log({
    client_id,
    client_secret,
    developer_token,
    customer_id,
    refresh_token,
  })

  const client = new GoogleAdsApi({
    client_id,
    client_secret,
    developer_token,
  })

  const customer = client.Customer({
    customer_id,
    refresh_token,
  })

  const res = await customer.keywordPlanIdeas.generateKeywordIdeas({
    keyword_seed: { keywords: Array.isArray(keyword) ? keyword : [keyword] },
    customer_id,
    keyword_plan_network: 'GOOGLE_SEARCH',
    page_size: 100,
    historical_metrics_options: {
      include_average_cpc: true,
    },
  })
  console.log('got res', res)
  // update usage for the response

  return res
}
