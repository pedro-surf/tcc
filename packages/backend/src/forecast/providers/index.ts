import type { ForecastProvider } from '../types'
import { openMeteoMarineProvider } from './openMeteoMarine'
import { worldWeatherOnlineProvider } from './worldWeatherOnline'

/**
 * All providers are axios HTTP calls, same pattern as the OpenAI weekly outlook.
 * Copernicus Marine has no REST JSON API (Python toolbox only), so it is not
 * a deployable Node provider.
 */
export function getForecastProvider(): ForecastProvider {
  const name = (process.env.FORECAST_PROVIDER || 'open-meteo').trim().toLowerCase()
  if (name === 'wwo' || name === 'worldweatheronline') {
    return worldWeatherOnlineProvider
  }
  if (name === 'copernicus' || name === 'copernicus-marine') {
    throw new Error(
      'Copernicus Marine has no JSON REST API and cannot run in this Node backend. Use FORECAST_PROVIDER=open-meteo (default) or FORECAST_PROVIDER=wwo.',
    )
  }
  return openMeteoMarineProvider
}
