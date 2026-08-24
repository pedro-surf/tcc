import type { ForecastProvider } from '../types'
import { openMeteoMarineProvider } from './openMeteoMarine'
import { worldWeatherOnlineProvider } from './worldWeatherOnline'

export function getForecastProvider(): ForecastProvider {
  const name = (process.env.FORECAST_PROVIDER || 'open-meteo').trim().toLowerCase()
  if (name === 'wwo' || name === 'worldweatheronline') {
    return worldWeatherOnlineProvider
  }
  if (name === 'copernicus' || name === 'copernicus-marine') {
    throw new Error(
      'Copernicus Marine has no JSON REST API. Use FORECAST_PROVIDER=open-meteo (default) or FORECAST_PROVIDER=wwo.',
    )
  }
  return openMeteoMarineProvider
}
