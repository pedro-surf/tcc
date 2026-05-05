import { builder } from '../builder';
// @ts-ignore 
import { BottomType } from '@prisma/client';

console.log('BottomType values:', Object.values(BottomType));

const BottomTypeEnum = builder.enumType('BottomTypeEnum', {
    values: Object.values(BottomType) as any[],
});
export default BottomTypeEnum;