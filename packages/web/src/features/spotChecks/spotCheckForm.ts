import * as Yup from 'yup'

export const spotCheckSchema = Yup.object({
  spotId: Yup.string().required('Pick a spot'),
  description: Yup.string().trim().required('Description is required'),
  score: Yup.number()
    .typeError('Score must be a number')
    .min(0, 'Min score is 0')
    .max(10, 'Max score is 10')
    .required('Score is required'),
})

export type SpotCheckFormValues = Yup.InferType<typeof spotCheckSchema>

export type PendingMedia = {
  id: string
  file: File
  previewUrl: string
  kind: 'IMAGE' | 'VIDEO'
}
