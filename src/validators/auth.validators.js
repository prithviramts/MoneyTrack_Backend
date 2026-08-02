const { z } = require('zod');

const signupSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters')
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
  .strict();

const refreshSchema = z
  .object({
    refreshToken: z.string().min(1, 'refreshToken is required')
  })
  .strict();

module.exports = { signupSchema, loginSchema, refreshSchema };
