import { createCreateMutation } from "../utils/createMutation";

const inputFields = (t: any) => (
    {
        spotId: t.string({ required: true }),
        ideal: t.boolean({ required: true }),
        score: t.float(),
        userId: t.string({ required: true }),
        swell: t.float({ required: true }),
        swellDir: t.float({ required: true }),
        wind: t.float({ required: true }),
        windDir: t.float({ required: true }),
        period: t.float(),
        energy: t.float(),
        temp: t.float(),
        gust: t.string(),
        power: t.string(),
        timestamp: t.field({ type: 'DateTime', required: false }),
    }
)
createCreateMutation(
    'spotForecast',
    'SpotForecast',
    (t) => inputFields(t),
    { bulk: true }
);