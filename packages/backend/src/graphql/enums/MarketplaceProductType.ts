import { builder } from '../builder'
// @ts-ignore
import { MarketplaceProductType } from '@prisma/client'

const MarketplaceProductTypeEnum = builder.enumType(
  'MarketplaceProductTypeEnum',
  {
    values: Object.values(MarketplaceProductType) as any[],
  },
)

export default MarketplaceProductTypeEnum
