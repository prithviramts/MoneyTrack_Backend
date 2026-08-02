const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'must be a valid id');

const isValidDateInput = (value) => value === undefined || !Number.isNaN(Date.parse(value));

const createTransactionSchema = z
  .object({
    accountId: objectId,
    type: z.enum(['income', 'expense']),
    amount: z.number().positive('amount must be a positive number'),
    category: z.string().trim().min(1, 'category cannot be empty').max(50, 'category is too long').optional(),
    date: z.string().optional().refine(isValidDateInput, { message: 'date must be a valid date' })
  })
  .strict();

const updateTransactionSchema = z
  .object({
    type: z.enum(['income', 'expense']).optional(),
    amount: z.number().positive('amount must be a positive number').optional(),
    category: z.string().trim().min(1, 'category cannot be empty').max(50, 'category is too long').optional(),
    date: z.string().optional().refine(isValidDateInput, { message: 'date must be a valid date' })
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'No valid fields to update' });

module.exports = { createTransactionSchema, updateTransactionSchema };
