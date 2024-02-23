import { GoogleAdsApi } from 'google-ads-api'

export async function fetchKeywordHistorialData(keywords: string[]) {
  const { adsApiToken: developer_token } = useRuntimeConfig().google
  const client = new GoogleAdsApi({
    client_id: '743046733183-jk9sd5qc1ekhm251gm4pfoov1sqoh6c5.apps.googleusercontent.com',
    client_secret: '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',
    developer_token,
  })

  const customer = client.Customer({
    customer_id: '6406286023',
    refresh_token: '1//0gag2sFjmrq48CgYIARAAGBASNwF-L9Ir44NxrNuDTwdg0chIzSAiNEidI3G-DwwdPvvqd5h-ex3wn9fVr4VoT47InHDxl9sqNMA',
  })

  return await customer.keywordPlanIdeas.generateKeywordHistoricalMetrics({
    keywords,
    customer_id: '6406286023',
    keyword_plan_network: 'GOOGLE_SEARCH', // Specify the network
  }).catch((err) => {
    return err
  })
}
