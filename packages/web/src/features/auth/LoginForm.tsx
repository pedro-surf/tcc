import { Field, Form, Formik } from 'formik'
import { FormField } from '../../components/forms/FormField'
import { useAuth } from '../../auth/AuthContext'
import { loginSchema, type LoginFormValues } from './authForm'

type Props = {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: Props) {
  const { login } = useAuth()

  return (
    <section className="auth-card">
      <header className="auth-card__header">
        <h2>Sign in</h2>
        <p>Access your spots and session tools.</p>
      </header>

      <Formik<LoginFormValues>
        initialValues={{ email: '', password: '' }}
        validationSchema={loginSchema}
        onSubmit={async (values, helpers) => {
          try {
            await login(values.email.trim(), values.password)
            onSuccess?.()
          } catch (error) {
            helpers.setStatus(
              error instanceof Error ? error.message : 'Login failed',
            )
          } finally {
            helpers.setSubmitting(false)
          }
        }}
      >
        {({ isSubmitting, status }) => (
          <Form className="auth-card__form">
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
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
              {status ? (
                <span className="form-status form-status--error">{status}</span>
              ) : null}
            </div>
          </Form>
        )}
      </Formik>

      {onSwitchToRegister ? (
        <p className="auth-card__switch">
          No account yet?{' '}
          <button type="button" className="auth-card__link" onClick={onSwitchToRegister}>
            Create one
          </button>
        </p>
      ) : null}
    </section>
  )
}
