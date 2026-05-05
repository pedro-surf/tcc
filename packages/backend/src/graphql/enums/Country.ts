import { builder } from '../builder';
// @ts-ignore 
import { Country } from '@prisma/client';


const CountryEnum = builder.enumType('CountryEnum', {
    values: Object.values(Country) as any[],
});
export default CountryEnum;