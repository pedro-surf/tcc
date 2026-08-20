import { builder } from '../builder'

const IdealOriginEnum = builder.enumType('IdealOriginEnum', {
  values: ['SPOT', 'FORECAST'] as const,
})

export default IdealOriginEnum
