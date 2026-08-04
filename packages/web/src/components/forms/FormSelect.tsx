import type { FieldInputProps, FormikProps } from 'formik'

export type SelectOption = {
  label: string
  value: string
}

type FormSelectProps = {
  label: string
  required?: boolean
  options: SelectOption[]
  placeholder?: string
  field: FieldInputProps<string>
  form: FormikProps<any>
  hint?: string
}

export function FormSelect({
  label,
  required,
  options,
  placeholder = 'Select…',
  field,
  form,
  hint,
}: FormSelectProps) {
  const error = form.touched[field.name] && form.errors[field.name]
  const errorMessage =
    typeof error === 'string' ? error : error ? String(error) : null

  return (
    <label className={`form-field${errorMessage ? ' form-field--error' : ''}`}>
      <span className="form-field__label">
        {label}
        {required ? <span className="form-field__required">*</span> : null}
      </span>
      <select {...field} className="form-field__input form-field__select">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && !errorMessage ? (
        <span className="form-field__hint">{hint}</span>
      ) : null}
      {errorMessage ? (
        <span className="form-field__error">{errorMessage}</span>
      ) : null}
    </label>
  )
}
