import { useQueryClient } from '@tanstack/react-query'
import { Field, Form, Formik } from 'formik'
import { useMemo } from 'react'
import { FormField } from '../../components/forms/FormField'
import { FormSelect } from '../../components/forms/FormSelect'
import WindRose from '../../WindRose'
import '../../WindRose.css'
import {
  useCreateSpotMutation,
  useGetLocationsQuery,
} from '../../generated/graphql'
import {
  bottomTypeOptions,
  countryOptions,
  spotFormInitialValues,
  spotFormSchema,
  toSpotCreateInput,
  waveTypeOptions,
  type SpotFormValues,
} from './spotForm'
import './CreateSpot.css'

type Props = {
  onCreated?: () => void
  onCancel?: () => void
}

export function CreateSpot({ onCreated, onCancel }: Props) {
  const queryClient = useQueryClient()
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

  return (
    <section className="create-spot">
      <header className="create-spot__header">
        <div>
          <h2>Create spot</h2>
          <p>
            Add a surf break with location, wave shape, and ideal wind/swell
            directions.
          </p>
        </div>
      </header>

      <Formik<SpotFormValues>
        initialValues={spotFormInitialValues}
        validationSchema={spotFormSchema}
        onSubmit={async (values, helpers) => {
          try {
            await createSpot.mutateAsync({ data: toSpotCreateInput(values) })
            helpers.resetForm()
          } catch {
            // surfaced via mutation state
          } finally {
            helpers.setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting, values, setFieldValue }) => (
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

              <Field name="lat">
                {({ field, form }: any) => (
                  <FormField
                    label="Latitude"
                    type="number"
                    step="any"
                    required
                    field={field}
                    form={form}
                  />
                )}
              </Field>

              <Field name="lng">
                {({ field, form }: any) => (
                  <FormField
                    label="Longitude"
                    type="number"
                    step="any"
                    required
                    field={field}
                    form={form}
                  />
                )}
              </Field>
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
