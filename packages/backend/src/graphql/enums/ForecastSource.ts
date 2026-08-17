import { builder } from '../builder'
import { ForecastSource } from '@prisma/client'

const ForecastSourceEnum = builder.enumType('ForecastSourceEnum', {
  values: Object.values(ForecastSource) as any[],
})

export default ForecastSourceEnum
