/**
 * Input validation schemas using Zod.
 * All user-facing inputs should be validated against these schemas
 * before being persisted to the database.
 */
import { z } from 'zod';

// Allowed timezones (subset - expand as needed)
const COMMON_TIMEZONES = [
  'Asia/Dhaka', 'UTC', 'America/New_York', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Asia/Kolkata', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney', 'America/Chicago', 'America/Denver',
];

export const CreateAgentSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be under 100 characters')
    .trim(),
  queries: z.array(
    z.string().min(1).max(200).trim()
  ).min(1, 'At least one keyword is required').max(10, 'Maximum 10 keywords'),
  preferred_time: z.string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format (HH:MM)'),
  recipient_email: z.string()
    .email('Invalid email address')
    .max(254),
  max_videos: z.number().int().min(1).max(20),
  timezone: z.string().max(100).optional(),
  agent_type: z.enum(['youtube', 'job']),
  location: z.string().max(100).optional(),
  frequency_days: z.number().int().min(1).max(30).optional(),
  is_active: z.boolean().optional().default(true),
  duration: z.enum(['1_week', '1_month', 'forever']).optional().default('forever'),
});

export const UpdateProfileSchema = z.object({
  full_name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .trim()
    // Reject HTML tags to prevent XSS via profile name
    .refine(val => !/<[^>]*>/.test(val), 'HTML is not allowed in name'),
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
