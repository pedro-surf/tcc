import { useQueryClient } from '@tanstack/react-query'
import { Field, Form, Formik } from 'formik'
import { useMemo, useState } from 'react'
import { FormField } from '../../components/forms/FormField'
import { FormSelect } from '../../components/forms/FormSelect'
import SpotLocationPicker from '../../components/map/SpotLocationPicker'
import WindRose from '../../WindRose'
import '../../WindRose.css'
import {
  useCreateSpotMutation,
  useGetLocationsQuery,
} from '../../generated/graphql'
import { uploadMediaFile } from '../spotChecks/uploadMedia'
import {
  bottomTypeOptions,
  countryOptions,
  spotFormInitialValues,
  spotFormSchema,
  toSpotCreateInput,
  toleranceOptions,
  waveTypeOptions,
  type SpotFormValues,
} from './spotForm'
import './CreateSpot.css'

type PendingMedia = {
  id: string
  file: File
  previewUrl: string
  kind: 'IMAGE' | 'VIDEO'
}

type Props = {
  onCreated?: () => void
  onCancel?: () => void
}

export function CreateSpot({ onCreated, onCancel }: Props) {
  const queryClient = useQueryClient()
  const [media, setMedia] = useState<PendingMedia[]>([])
  const [mediaError, setMediaError] = useState<string | null>(null)

  const locationsQuery = useGetLocationsQuery({
    take: 100,
    skip: 0,
  })

  const createSpot = useCreateSpotMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetSpots'] })
      onCreated?.()
    },
  })

  const locationOptions = useMemo(
    () =>
      (locationsQuery.data?.locations ?? []).map((location) => ({
        value: location.id,
        label: `${location.name} (${location.country})`,
      })),
    [locationsQuery.data?.locations],
  )

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    const next: PendingMedia[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setMediaError('Only pictures or videos are allowed')
        continue
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        kind: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      })
    }
    if (next.length) {
      setMediaError(null)
      setMedia((prev) => [...prev, ...next])
    }
  }

  const removeMedia = (id: string) => {
    setMedia((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== id)
    })
  }

  return (
    <section className="create-spot">
      <header className="create-spot__header">
        <div>
          <h2>Create spot</h2>
          <p>
            Add a surf break with description, media, tolerances, and ideal
            wind/swell directions.
          </p>
        </div>
      </header>

      <Formik<SpotFormValues>
        initialValues={spotFormInitialValues}
        validationSchema={spotFormSchema}
        onSubmit={async (values, helpers) => {
          setMediaError(null)
          try {
            const uploaded = []
            for (const item of media) {
              uploaded.push(await uploadMediaFile(item.file))
            }

            await createSpot.mutateAsync({
              data: toSpotCreateInput(
                values,
                uploaded.map((item) => ({
                  mediaUrl: item.mediaUrl,
                  mediaType: item.mediaType,
                  mimeType: item.mimeType,
                })),
              ),
            })
            media.forEach((item) => URL.revokeObjectURL(item.previewUrl))
            setMedia([])
            helpers.resetForm()
          } catch (error) {
            helpers.setStatus(
              error instanceof Error ? error.message : 'Failed to create spot',
            )
          } finally {
            helpers.setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting, values, setFieldValue, status, errors, touched }) => (
          <Form className="create-spot__form">
            <div className="create-spot__grid">
              <Field name="name">
                {({ field, form }: any) => (
                  <FormField
                    label="Name"
                    required
                    placeholder="e.g. Praia Mole"
                    field={field}
                    form={form}
                  />
                )}
              </Field>

              <Field name="locationId">
                {({ field, form }: any) => (
                  <FormSelect
                    label="Location"
                    required
                    options={locationOptions}
                    placeholder={
                      locationsQuery.isLoading
                        ? 'Loading locations…'
                        : 'Select a location'
                    }
                    field={field}
                    form={form}
                  />
                )}
              </Field>

              <Field name="country">
                {({ field, form }: any) => (
                  <FormSelect
                    label="Country"
                    required
                    options={countryOptions}
                    field={field}
                    form={form}
                  />
                )}
              </Field>

              <Field name="waveType">
                {({ field, form }: any) => (
                  <FormSelect
                    label="Wave type"
                    required
                    options={waveTypeOptions}
                    field={field}
                    form={form}
                  />
                )}
              </Field>

              <Field name="bottomType">
                {({ field, form }: any) => (
                  <FormSelect
                    label="Bottom type"
                    required
                    options={bottomTypeOptions}
                    field={field}
                    form={form}
                  />
                )}
              </Field>

              <Field name="difficulty">
                {({ field, form }: any) => (
                  <FormField
                    label="Difficulty"
                    placeholder="e.g. intermediate"
                    field={field}
                    form={form}
                  />
                )}
              </Field>

              <Field name="strongSwellTolerance">
                {({ field, form }: any) => (
                  <FormSelect
                    label="Strong swell tolerance (1–5)"
                    required
                    options={toleranceOptions}
                    field={{
                      ...field,
                      value: String(field.value),
                      onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
                        setFieldValue(
                          'strongSwellTolerance',
                          Number(e.target.value),
                        ),
                    }}
                    form={form}
                  />
                )}
              </Field>

              <Field name="strongWindTolerance">
                {({ field, form }: any) => (
                  <FormSelect
                    label="Strong wind tolerance (1–5)"
                    required
                    options={toleranceOptions}
                    field={{
                      ...field,
                      value: String(field.value),
                      onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
                        setFieldValue(
                          'strongWindTolerance',
                          Number(e.target.value),
                        ),
                    }}
                    form={form}
                  />
                )}
              </Field>
            </div>

            <div className="create-spot__location">
              <span className="form-field__label">
                Location on map <span aria-hidden="true">*</span>
              </span>
              <SpotLocationPicker
                value={
                  values.lat && values.lng
                    ? {
                        lat: Number(values.lat),
                        lng: Number(values.lng),
                      }
                    : null
                }
                onChange={(coords) => {
                  void setFieldValue('lat', String(coords.lat), true)
                  void setFieldValue('lng', String(coords.lng), true)
                }}
              />
              {(touched.lat || touched.lng) && (errors.lat || errors.lng) ? (
                <span className="form-field__error">
                  {String(errors.lat || errors.lng)}
                </span>
              ) : !values.lat || !values.lng ? (
                <span className="form-field__hint">
                  Pick a point on the map before submitting.
                </span>
              ) : null}
            </div>

            <Field name="description">
              {({ field, form }: any) => (
                <label className="form-field">
                  <span className="form-field__label">Description</span>
                  <textarea
                    {...field}
                    className="form-field__input"
                    rows={3}
                    placeholder="Local knowledge, hazards, best tide…"
                  />
                  {form.touched.description && form.errors.description ? (
                    <span className="form-field__error">
                      {String(form.errors.description)}
                    </span>
                  ) : null}
                </label>
              )}
            </Field>

            <label className="create-spot__secret">
              <input
                type="checkbox"
                checked={values.secret}
                onChange={(e) => setFieldValue('secret', e.target.checked)}
              />
              <span>
                <strong>Secret spot</strong> — only you and your friends can see
                it
              </span>
            </label>

            <div className="create-spot__media">
              <div className="create-spot__media-head">
                <span className="form-field__label">Spot media</span>
                <label className="btn btn-secondary create-spot__file-btn">
                  Add picture / video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
              {media.length === 0 ? (
                <p className="create-spot__media-empty">
                  Optional cover media. Spot checks can fill in later.
                </p>
              ) : (
                <ul className="create-spot__media-list">
                  {media.map((item) => (
                    <li key={item.id} className="create-spot__media-item">
                      {item.kind === 'VIDEO' ? (
                        <video src={item.previewUrl} controls muted />
                      ) : (
                        <img src={item.previewUrl} alt={item.file.name} />
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => removeMedia(item.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {mediaError ? (
                <span className="form-status form-status--error">{mediaError}</span>
              ) : null}
            </div>

            <div className="create-spot__roses">
              <WindRose
                label="Ideal wind"
                size={160}
                value={values.idealWindDir}
                onChange={(deg) => setFieldValue('idealWindDir', deg)}
              />
              <WindRose
                label="Ideal swell"
                size={160}
                value={values.idealSwellDir}
                onChange={(deg) => setFieldValue('idealSwellDir', deg)}
              />
            </div>

            <div className="form-actions">
              {onCancel ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || createSpot.isPending}
              >
                {isSubmitting || createSpot.isPending
                  ? 'Creating…'
                  : 'Create spot'}
              </button>
              {status ? (
                <span className="form-status form-status--error">{status}</span>
              ) : null}
              {createSpot.isError ? (
                <span className="form-status form-status--error">
                  {(createSpot.error as Error).message ||
                    'Failed to create spot'}
                </span>
              ) : null}
            </div>
          </Form>
        )}
      </Formik>
    </section>
  )
}

export default CreateSpot
