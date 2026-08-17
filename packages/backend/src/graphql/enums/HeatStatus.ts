import { builder } from '../builder'
// @ts-ignore
import { HeatStatus } from '@prisma/client'

const HeatStatusEnum = builder.enumType('HeatStatusEnum', {
  values: Object.values(HeatStatus) as any[],
})

export default HeatStatusEnum
