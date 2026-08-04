import * as Yup from 'yup'
import {
  BottomTypeEnum,
  CountryEnum,
  WaveTypeEnum,
  type SpotCreateInput,
} from '../../generated/graphql'
import type { SelectOption } from '../../components/forms/FormSelect'

export type SpotFormValues = {
  name: string
  locationId: string
  country: CountryEnum | ''
  waveType: WaveTypeEnum | ''
  bottomType: BottomTypeEnum | ''
  lat: string
  lng: string
  difficulty: string
}

export const spotFormInitialValues: SpotFormValues = {
  name: '',
  locationId: '',
  country: '',
  waveType: '',
  bottomType: '',
  lat: '',
  lng: '',
  difficulty: '',
}

const enumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const countryValues = Object.values(CountryEnum)
const waveTypeValues = Object.values(WaveTypeEnum)
const bottomTypeValues = Object.values(BottomTypeEnum)

export const countryOptions: SelectOption[] = countryValues.map((value) => ({
  value,
  label: enumLabel(value),
}))

export const waveTypeOptions: SelectOption[] = waveTypeValues.map((value) => ({
  value,
  label: enumLabel(value),
}))

export const bottomTypeOptions: SelectOption[] = bottomTypeValues.map(
  (value) => ({ value, label: enumLabel(value) }),
)

export const spotFormSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  locationId: Yup.string().required('Location is required'),
  country: Yup.mixed<CountryEnum>()
    .oneOf([...countryValues], 'Country is required')
    .required('Country is required'),
  waveType: Yup.mixed<WaveTypeEnum>()
    .oneOf([...waveTypeValues], 'Wave type is required')
    .required('Wave type is required'),
  bottomType: Yup.mixed<BottomTypeEnum>()
    .oneOf([...bottomTypeValues], 'Bottom type is required')
    .required('Bottom type is required'),
  lat: Yup.number()
    .typeError('Latitude must be a number')
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .required('Latitude is required'),
  lng: Yup.number()
    .typeError('Longitude must be a number')
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .required('Longitude is required'),
  difficulty: Yup.string().trim(),
})

export function toSpotCreateInput(values: SpotFormValues): SpotCreateInput {
  return {
    name: values.name.trim(),
    locationId: values.locationId,
    country: values.country as CountryEnum,
    waveType: values.waveType as WaveTypeEnum,
    bottomType: values.bottomType as BottomTypeEnum,
    lat: Number(values.lat),
    lng: Number(values.lng),
    difficulty: values.difficulty.trim() || undefined,
  }
}
