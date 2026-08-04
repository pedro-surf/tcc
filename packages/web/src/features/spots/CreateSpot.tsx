import { useQueryClient } from '@tanstack/react-query'
import { Field, Form, Formik } from 'formik'
import { useMemo } from 'react'
import { FormField } from '../../components/forms/FormField'
import { FormSelect } from '../../components/forms/FormSelect'
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
      await queryClient.invalidateQueries({
        queryKey: ['GetSpots'],
      })
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

  const handleSubmit = async (values: SpotFormValues) => {
    await createSpot.mutateAsync({
      data: toSpotCreateInput(values),
    })
  }

  return (
    <section className="create-spot">
      <header className="create-spot__header">
        <div>
          <h2>Create spot</h2>
          <p>Add a surf break with location, wave shape, and coordinates.</p>
        </div>
      </header>

      <Formik
        initialValues={spotFormInitialValues}
        validationSchema={spotFormSchema}
        onSubmit={async (values, helpers) => {
          try {
            await handleSubmit(values)
            helpers.resetForm()
          } catch {
            // Error surface via mutation state below
          } finally {
            helpers.setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting }) => (
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
                    hint={
                      locationsQuery.isError
                        ? 'Could not load locations. Is the API running?'
                        : locationOptions.length === 0 && !locationsQuery.isLoading
                          ? 'No locations yet — create one in the API first.'
                          : undefined
                    }
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
                    placeholder="-27.57"
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
                    placeholder="-48.42"
                    field={field}
                    form={form}
                  />
                )}
              </Field>
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
              {createSpot.isSuccess ? (
                <span className="form-status form-status--success">
                  Spot created.
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
