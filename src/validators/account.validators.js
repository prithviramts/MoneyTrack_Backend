const { z } = require('zod');

const createAccountSchema = z
  .object({
    name: z.string().trim().min(1, 'Account name is required').max(100, 'Account name is too long'),
    type: z.enum(['debit', 'credit']),
    balance: z.number().finite('balance must be a finite number').optional(),
    creditLimit: z.number().finite().nonnegative('creditLimit cannot be negative').optional(),
    billingCycleDate: z.number().int().min(1).max(31, 'billingCycleDate must be a day of month (1-31)').optional(),
    dueDate: z.number().int().min(1).max(31, 'dueDate must be a day of month (1-31)').optional()
  })
  .strict();

const updateAccountSchema = z
  .object({
    name: z.string().trim().min(1, 'Account name is required').max(100, 'Account name is too long').optional(),
    creditLimit: z.number().finite().nonnegative('creditLimit cannot be negative').nullable().optional(),
    billingCycleDate: z.number().int().min(1).max(31).nullable().optional(),
    dueDate: z.number().int().min(1).max(31).nullable().optional()
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'No valid fields to update' });

module.exports = { createAccountSchema, updateAccountSchema };
