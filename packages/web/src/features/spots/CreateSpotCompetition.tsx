import { Field, Form, Formik } from 'formik'
import { useQueryClient } from '@tanstack/react-query'
import * as Yup from 'yup'
import { FormField } from '../../components/forms/FormField'
import { useCreateSpotCompetitionMutation } from '../../generated/graphql'

const schema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  description: Yup.string().trim(),
  date: Yup.string().required('Date is required'),
})

type Props = {
  spotId: string
  onCreated?: () => void
}

export function CreateSpotCompetition({ spotId, onCreated }: Props) {
  const queryClient = useQueryClient()
  const create = useCreateSpotCompetitionMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['SpotCompetitionsBySpot'],
      })
      onCreated?.()
    },
  })

  return (
    <Formik
      initialValues={{ name: '', description: '', date: '' }}
      validationSchema={schema}
      onSubmit={async (values, helpers) => {
        try {
          await create.mutateAsync({
            data: {
              spotId,
              name: values.name.trim(),
              description: values.description.trim() || undefined,
              date: new Date(values.date).toISOString(),
            },
          })
          helpers.resetForm()
        } catch {
          // mutation error
        } finally {
          helpers.setSubmitting(false)
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="spot-details__inline-form">
          <h3>New competition / event</h3>
          <div className="spot-details__inline-grid">
            <Field name="name">
              {({ field, form }: any) => (
                <FormField label="Name" required field={field} form={form} />
              )}
            </Field>
            <Field name="date">
              {({ field, form }: any) => (
                <FormField
                  label="Date"
                  type="datetime-local"
                  required
                  field={field}
                  form={form}
                />
              )}
            </Field>
          </div>
          <Field name="description">
            {({ field }: any) => (
              <label className="form-field">
                <span className="form-field__label">Description</span>
                <textarea
                  {...field}
                  className="form-field__input"
                  rows={2}
                  placeholder="Heat format, entry info…"
                />
              </label>
            )}
          </Field>
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || create.isPending}
            >
              {isSubmitting || create.isPending ? 'Saving…' : 'Create event'}
            </button>
            {create.isError ? (
              <span className="form-status form-status--error">
                {(create.error as Error).message}
              </span>
            ) : null}
          </div>
        </Form>
      )}
    </Formik>
  )
}
