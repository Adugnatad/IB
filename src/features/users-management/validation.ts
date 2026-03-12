import * as yup from 'yup';

const requiredMsg = 'This field is required';

export const createUserSchema = yup.object({
  firstName: yup.string().trim().required(requiredMsg).max(100, 'Max 100 characters'),
  lastName: yup.string().trim().required(requiredMsg).max(100, 'Max 100 characters'),
  email: yup.string().trim().email('Invalid email').required(requiredMsg).max(255, 'Max 255 characters'),
  phone: yup.string().trim().required(requiredMsg).max(50, 'Max 50 characters'),
  roleId: yup.string().trim().required('Please select a role'),
});

export const updateUserSchema = yup.object({
  firstName: yup.string().trim().required(requiredMsg).max(100, 'Max 100 characters'),
  lastName: yup.string().trim().required(requiredMsg).max(100, 'Max 100 characters'),
  email: yup.string().trim().email('Invalid email').required(requiredMsg).max(255, 'Max 255 characters'),
  phone: yup.string().trim().required(requiredMsg).max(50, 'Max 50 characters'),
  roleId: yup.string().trim().required('Please select a role'),
});

export type CreateUserFormValues = yup.InferType<typeof createUserSchema>;
export type UpdateUserFormValues = yup.InferType<typeof updateUserSchema>;
