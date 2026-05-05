import { createCreateMutation } from "../utils/createMutation";

createCreateMutation(
  'location',
  'Location',
  (t) => ({
    name: t.string({ required: true }),
    country: t.field({ type: 'CountryEnum', required: true }),
    lat: t.float(),
    lng: t.float(),
  })
);