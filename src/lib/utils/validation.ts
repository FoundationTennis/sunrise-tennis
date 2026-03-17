import { z } from 'zod'

export const familyStatusSchema = z.enum(['active', 'inactive', 'lead', 'archived'])
export const playerStatusSchema = z.enum(['active', 'inactive', 'archived'])
export const ballColorSchema = z.enum(['blue', 'red', 'orange', 'green', 'yellow', 'competitive'])
export const sessionTypeSchema = z.enum(['group', 'private', 'makeup'])
export const sessionStatusSchema = z.enum(['scheduled', 'completed', 'cancelled', 'rained_out'])
export const attendanceStatusSchema = z.enum(['present', 'absent', 'late', 'excused'])
export const bookingTypeSchema = z.enum(['term_enrollment', 'casual', 'private', 'trial'])
export const bookingStatusSchema = z.enum(['confirmed', 'pending', 'cancelled'])
export const paymentMethodSchema = z.enum(['square', 'bank_transfer', 'cash', 'direct_debit'])
export const paymentStatusSchema = z.enum(['received', 'pending', 'overdue', 'refunded'])
export const userRoleSchema = z.enum(['parent', 'coach', 'admin'])
export const programTypeSchema = z.enum(['group', 'squad', 'school', 'competition'])
export const mediaVisibilitySchema = z.enum(['family_only', 'program', 'public'])

export const contactSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  preferred_method: z.enum(['phone', 'email', 'sms']).optional(),
})

export const createFamilySchema = z.object({
  family_name: z.string().min(1, 'Family name is required'),
  preferred_name: z.string().optional(),
  primary_contact: contactSchema,
  secondary_contact: contactSchema.optional(),
  address: z.string().optional(),
  referred_by: z.string().optional(),
  notes: z.string().optional(),
})

export const createPlayerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  preferred_name: z.string().optional(),
  dob: z.string().optional(),
  level: ballColorSchema.optional(),
  ball_color: ballColorSchema.optional(),
  medical_notes: z.string().optional(),
  physical_notes: z.string().optional(),
  current_focus: z.array(z.string()).optional(),
  short_term_goal: z.string().optional(),
  long_term_goal: z.string().optional(),
  comp_interest: z.enum(['yes', 'no', 'future']).optional(),
  media_consent: z.boolean().default(false),
})
