import { builder } from '../builder'
// @ts-ignore
import { Currency } from '@prisma/client'

const CurrencyEnum = builder.enumType('CurrencyEnum', {
  values: Object.values(Currency) as any[],
})

export default CurrencyEnum
