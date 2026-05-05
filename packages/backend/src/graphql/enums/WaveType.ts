import { builder } from '../builder';
// @ts-ignore
import { WaveType } from '@prisma/client';

console.log('WaveType values:', Object.values(WaveType));

const WaveTypeEnum = builder.enumType('WaveTypeEnum', {
    values: Object.values(WaveType) as any[],
});
export default WaveTypeEnum;