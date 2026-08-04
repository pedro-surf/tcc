import * as Yup from 'yup'

export const loginSchema = Yup.object({
  email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
})

export const registerSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  email: Yup.string().trim().email('Enter a valid email').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm your password'),
})

export type LoginFormValues = Yup.InferType<typeof loginSchema>
export type RegisterFormValues = Yup.InferType<typeof registerSchema>
