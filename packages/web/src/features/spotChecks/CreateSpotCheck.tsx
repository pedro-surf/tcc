import { Field, Form, Formik } from 'formik'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FormField } from '../../components/forms/FormField'
import { FormSelect } from '../../components/forms/FormSelect'
import { useAuth } from '../../auth/AuthContext'
import {
  useCreateSpotCheckMutation,
  useGetSpotsQuery,
} from '../../generated/graphql'
import {
  spotCheckSchema,
  type PendingMedia,
  type SpotCheckFormValues,
} from './spotCheckForm'
import { uploadMediaFile } from './uploadMedia'
import './CreateSpotCheck.css'

type Props = {
  onCreated?: () => void
  onCancel?: () => void
  onRequireAuth?: () => void
  defaultSpotId?: string
}

export function CreateSpotCheck({
  onCreated,
  onCancel,
  onRequireAuth,
  defaultSpotId,
}: Props) {
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const [media, setMedia] = useState<PendingMedia[]>([])
  const [mediaError, setMediaError] = useState<string | null>(null)

  const spotsQuery = useGetSpotsQuery(
    { take: 100, skip: 0 },
    { enabled: !defaultSpotId },
  )
  const createSpotCheck = useCreateSpotCheckMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['GetSpotChecks'] })
      await queryClient.invalidateQueries({ queryKey: ['SpotChecksBySpot'] })
      onCreated?.()
    },
  })

  const spotOptions = useMemo(
    () =>
      (spotsQuery.data?.spots ?? []).map((spot) => ({
        value: spot.id,
        label: spot.name,
      })),
    [spotsQuery.data?.spots],
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

  if (!isAuthenticated) {
    return (
      <section className="create-spot-check">
        <header className="create-spot-check__header">
          <h2>Spot check</h2>
          <p>Sign in to post a picture or video from the lineup.</p>
        </header>
        <button type="button" className="btn btn-primary" onClick={onRequireAuth}>
          Sign in
        </button>
      </section>
    )
  }

  return (
    <section className="create-spot-check">
      <header className="create-spot-check__header">
        <div>
          <h2>New spot check</h2>
          <p>Share conditions with a photo or short video.</p>
        </div>
      </header>

      <Formik<SpotCheckFormValues>
        initialValues={{
          spotId: defaultSpotId ?? '',
          description: '',
          score: 5,
        }}
        enableReinitialize
        validationSchema={spotCheckSchema}
        onSubmit={async (values, helpers) => {
          setMediaError(null)
          if (media.length === 0) {
            setMediaError('Add at least one picture or video')
            helpers.setSubmitting(false)
            return
          }

          try {
            const uploaded = []
            for (const item of media) {
              uploaded.push(await uploadMediaFile(item.file))
            }

            await createSpotCheck.mutateAsync({
              data: {
                spotId: values.spotId,
                description: values.description.trim(),
                score: Number(values.score),
                media: uploaded.map((item) => ({
                  mediaUrl: item.mediaUrl,
                  mediaType: item.mediaType,
                  mimeType: item.mimeType,
                })),
              },
            })

            media.forEach((item) => URL.revokeObjectURL(item.previewUrl))
            setMedia([])
            helpers.resetForm()
          } catch (error) {
            helpers.setStatus(
              error instanceof Error ? error.message : 'Failed to create spot check',
            )
          } finally {
            helpers.setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form className="create-spot-check__form">
            <div className="create-spot-check__grid">
              {defaultSpotId ? null : (
                <Field name="spotId">
                  {({ field, form }: any) => (
                    <FormSelect
                      label="Spot"
                      required
                      options={spotOptions}
                      placeholder={
                        spotsQuery.isLoading
                          ? 'Loading spots…'
                          : 'Select a spot'
                      }
                      field={field}
                      form={form}
                      hint={
                        !spotsQuery.isLoading && spotOptions.length === 0
                          ? 'Create a spot first.'
                          : undefined
                      }
                    />
                  )}
                </Field>
              )}

              <Field name="score">
                {({ field, form }: any) => (
                  <FormField
                    label="Score (0–10)"
                    type="number"
                    min={0}
                    max={10}
                    step="0.5"
                    required
                    field={field}
                    form={form}
                  />
                )}
              </Field>
            </div>

            <Field name="description">
              {({ field, form }: any) => (
                <label
                  className={`form-field${
                    form.touched.description && form.errors.description
                      ? ' form-field--error'
                      : ''
                  }`}
                >
                  <span className="form-field__label">
                    Description
                    <span className="form-field__required">*</span>
                  </span>
                  <textarea
                    {...field}
                    className="form-field__input create-spot-check__textarea"
                    rows={4}
                    placeholder="How does it look? Wind, tide, crowd…"
                  />
                  {form.touched.description && form.errors.description ? (
                    <span className="form-field__error">
                      {String(form.errors.description)}
                    </span>
                  ) : null}
                </label>
              )}
            </Field>

            <div className="create-spot-check__media">
              <div className="create-spot-check__media-head">
                <span className="form-field__label">
                  Media<span className="form-field__required">*</span>
                </span>
                <label className="btn btn-secondary create-spot-check__file-btn">
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
                <p className="create-spot-check__media-empty">
                  No media yet. Add at least one image or video.
                </p>
              ) : (
                <ul className="create-spot-check__media-list">
                  {media.map((item) => (
                    <li key={item.id} className="create-spot-check__media-item">
                      {item.kind === 'VIDEO' ? (
                        <video src={item.previewUrl} controls muted />
                      ) : (
                        <img src={item.previewUrl} alt={item.file.name} />
                      )}
                      <div className="create-spot-check__media-meta">
                        <span>{item.kind}</span>
                        <span>{item.file.name}</span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => removeMedia(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {mediaError ? (
                <span className="form-status form-status--error">{mediaError}</span>
              ) : null}
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
                disabled={isSubmitting || createSpotCheck.isPending}
              >
                {isSubmitting || createSpotCheck.isPending
                  ? 'Uploading…'
                  : 'Post spot check'}
              </button>
              {status ? (
                <span className="form-status form-status--error">{status}</span>
              ) : null}
              {createSpotCheck.isSuccess ? (
                <span className="form-status form-status--success">
                  Spot check posted.
                </span>
              ) : null}
            </div>
          </Form>
        )}
      </Formik>
    </section>
  )
}

export default CreateSpotCheck
