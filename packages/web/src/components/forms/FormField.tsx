import type { FieldInputProps, FormikProps } from 'formik'

type FormFieldProps = {
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  step?: string | number
  min?: string | number
  max?: string | number
  field: FieldInputProps<string | number>
  form: FormikProps<any>
  hint?: string
}

export function FormField({
  label,
  type = 'text',
  placeholder,
  required,
  step,
  min,
  max,
  field,
  form,
  hint,
}: FormFieldProps) {
  const error = form.touched[field.name] && form.errors[field.name]
  const errorMessage =
    typeof error === 'string' ? error : error ? String(error) : null

  return (
    <label className={`form-field${errorMessage ? ' form-field--error' : ''}`}>
      <span className="form-field__label">
        {label}
        {required ? <span className="form-field__required">*</span> : null}
      </span>
      <input
        {...field}
        type={type}
        placeholder={placeholder}
        step={step}
        min={min}
        max={max}
        className="form-field__input"
        value={field.value ?? ''}
      />
      {hint && !errorMessage ? (
        <span className="form-field__hint">{hint}</span>
      ) : null}
      {errorMessage ? (
        <span className="form-field__error">{errorMessage}</span>
      ) : null}
    </label>
  )
}
