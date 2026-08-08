import { createCreateMutation } from '../utils/createMutation'

createCreateMutation('spot', 'Spot', (t) => ({
  name: t.string({ required: true }),
  difficulty: t.string(),
  description: t.string(),
  locationId: t.string({ required: true }),
  waveType: t.field({ type: 'WaveTypeEnum', required: true }),
  bottomType: t.field({ type: 'BottomTypeEnum', required: true }),
  country: t.field({ type: 'CountryEnum', required: true }),
  lat: t.float(),
  lng: t.float(),
  idealWindDir: t.float(),
  idealSwellDir: t.float(),
}))
