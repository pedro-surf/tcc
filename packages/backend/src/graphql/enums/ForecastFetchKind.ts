import { builder } from '../builder'
import { ForecastFetchKind } from '@prisma/client'

const ForecastFetchKindEnum = builder.enumType('ForecastFetchKindEnum', {
  values: Object.values(ForecastFetchKind) as any[],
})

export default ForecastFetchKindEnum
