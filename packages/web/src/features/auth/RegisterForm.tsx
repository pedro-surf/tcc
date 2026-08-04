import { Field, Form, Formik } from 'formik'
import { FormField } from '../../components/forms/FormField'
import { useAuth } from '../../auth/AuthContext'
import { registerSchema, type RegisterFormValues } from './authForm'

type Props = {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: Props) {
  const { register } = useAuth()

  return (
    <section className="auth-card">
      <header className="auth-card__header">
        <h2>Create account</h2>
        <p>Register to create spots and sync your data.</p>
      </header>

      <Formik<RegisterFormValues>
        initialValues={{
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
        }}
        validationSchema={registerSchema}
        onSubmit={async (values, helpers) => {
          try {
            await register(
              values.name.trim(),
              values.email.trim(),
              values.password,
            )
            onSuccess?.()
          } catch (error) {
            helpers.setStatus(
              error instanceof Error ? error.message : 'Registration failed',
            )
          } finally {
            helpers.setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form className="auth-card__form">
            <Field name="name">
              {({ field, form }: any) => (
                <FormField
                  label="Name"
                  required
                  placeholder="Your name"
                  field={field}
                  form={form}
                />
              )}
            </Field>
            <Field name="email">
              {({ field, form }: any) => (
                <FormField
                  label="Email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  field={field}
                  form={form}
                />
              )}
            </Field>
            <Field name="password">
              {({ field, form }: any) => (
                <FormField
                  label="Password"
                  type="password"
                  required
                  hint="At least 6 characters"
                  field={field}
                  form={form}
                />
              )}
            </Field>
            <Field name="confirmPassword">
              {({ field, form }: any) => (
                <FormField
                  label="Confirm password"
                  type="password"
                  required
                  field={field}
                  form={form}
                />
              )}
            </Field>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating…' : 'Create account'}
              </button>
              {status ? (
                <span className="form-status form-status--error">{status}</span>
              ) : null}
            </div>
          </Form>
        )}
      </Formik>

      {onSwitchToLogin ? (
        <p className="auth-card__switch">
          Already registered?{' '}
          <button type="button" className="auth-card__link" onClick={onSwitchToLogin}>
            Sign in
          </button>
        </p>
      ) : null}
    </section>
  )
}
