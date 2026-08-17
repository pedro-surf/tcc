import { Field, Form, Formik } from 'formik'
import { useMemo, useState } from 'react'
import * as Yup from 'yup'
import { useQueryClient } from '@tanstack/react-query'
import { FormField } from '../../components/forms/FormField'
import { useGetUsersQuery } from '../../generated/graphql'
import { useCreateCompetitionHeatMutation } from './api'

const schema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  durationMin: Yup.number()
    .oneOf([15, 30, 40], 'Choose 15, 30, or 40 minutes')
    .required(),
  judgeCount: Yup.number().min(1).max(5).required(),
  surferIds: Yup.array().of(Yup.string()).min(1, 'Add at least one surfer'),
})

type Props = {
  competitionId: string
  defaultName?: string
  onCreated?: () => void
}

export function CreateHeatForm({
  competitionId,
  defaultName = 'Heat 1',
  onCreated,
}: Props) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedPeople, setSelectedPeople] = useState<
    Record<string, { id: string; name: string; email?: string | null }>
  >({})
  const usersQuery = useGetUsersQuery({
    take: 40,
    skip: 0,
    name: search.trim() || undefined,
  })
  const create = useCreateCompetitionHeatMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['SpotCompetition'] })
      await queryClient.invalidateQueries({ queryKey: ['Events'] })
      onCreated?.()
    },
  })

  const people = useMemo(
    () => usersQuery.data?.users ?? [],
    [usersQuery.data?.users],
  )

  return (
    <Formik
      initialValues={{
        name: defaultName,
        durationMin: 15,
        judgeCount: 3,
        surferIds: [] as string[],
      }}
      validationSchema={schema}
      onSubmit={async (values, helpers) => {
        try {
          await create.mutateAsync({
            data: {
              competitionId,
              name: values.name.trim(),
              durationMin: Number(values.durationMin),
              judgeCount: Number(values.judgeCount),
              surferIds: values.surferIds,
            },
          })
          helpers.resetForm({
            values: {
              name: defaultName,
              durationMin: 15,
              judgeCount: 3,
              surferIds: [],
            },
          })
          setSelectedPeople({})
          setSearch('')
        } catch {
          // mutation error shown below
        } finally {
          helpers.setSubmitting(false)
        }
      }}
    >
      {({ isSubmitting, values, setFieldValue, errors, touched }) => (
        <Form className="spot-details__inline-form">
          <h3>New heat</h3>
          <Field name="name">
            {({ field, form }: any) => (
              <FormField label="Heat name" required field={field} form={form} />
            )}
          </Field>

          <div>
            <span className="form-field__label">
              Duration <span className="form-field__required">*</span>
            </span>
            <div className="heat-choice">
              {[15, 30, 40].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={`heat-choice__btn${
                    values.durationMin === minutes ? ' is-active' : ''
                  }`}
                  onClick={() => setFieldValue('durationMin', minutes)}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="form-field__label">
              Judges <span className="form-field__required">*</span>
            </span>
            <div className="heat-choice">
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`heat-choice__btn${
                    values.judgeCount === count ? ' is-active' : ''
                  }`}
                  onClick={() => setFieldValue('judgeCount', count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="form-field__label">
              Surfers <span className="form-field__required">*</span>
            </span>
            {values.surferIds.length > 0 ? (
              <ul className="heat-picker__selected">
                {values.surferIds.map((id) => {
                  const person =
                    selectedPeople[id] ??
                    people.find((user) => user.id === id) ??
                    ({ id, name: 'Selected surfer', email: '' } as const)
                  return (
                    <li key={id}>
                      <span>{person.name}</span>
                      <button
                        type="button"
                        className="heat-picker__remove"
                        onClick={() => {
                          setSelectedPeople((current) => {
                            const next = { ...current }
                            delete next[id]
                            return next
                          })
                          setFieldValue(
                            'surferIds',
                            values.surferIds.filter((sid) => sid !== id),
                          )
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : null}
            <input
              className="form-field__input"
              type="search"
              placeholder="Search people to add…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ul className="heat-picker__results">
              {people
                .filter((user) => !values.surferIds.includes(user.id))
                .slice(0, 8)
                .map((user) => (
                  <li key={user.id}>
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedPeople((current) => ({
                          ...current,
                          [user.id]: user,
                        }))
                        setFieldValue('surferIds', [
                          ...values.surferIds,
                          user.id,
                        ])
                      }}
                    >
                      Add
                    </button>
                  </li>
                ))}
            </ul>
            {touched.surferIds && typeof errors.surferIds === 'string' ? (
              <span className="form-field__error">{errors.surferIds}</span>
            ) : null}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || create.isPending}
            >
              {isSubmitting || create.isPending ? 'Saving…' : 'Create heat'}
            </button>
            {create.isError ? (
              <span className="form-status form-status--error">
                {create.error.message}
              </span>
            ) : null}
          </div>
        </Form>
      )}
    </Formik>
  )
}
