import { builder } from '../builder'
// @ts-ignore
import { MediaType } from '@prisma/client'

const MediaTypeEnum = builder.enumType('MediaTypeEnum', {
  values: Object.values(MediaType) as any[],
})
export default MediaTypeEnum
