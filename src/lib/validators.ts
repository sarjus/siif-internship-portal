import { z } from 'zod'

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')

export const authLoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

export const authRegisterSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email('Enter a valid email address'),
  password: passwordSchema,
  confirm_password: z.string().min(1, 'Confirm your password'),
  phone: z.string().max(30).optional().or(z.literal('')),
  role: z.enum(['student', 'company']),
  company_name: z.string().max(120).optional().or(z.literal('')),
  website: z.string().url('Enter a valid website').optional().or(z.literal(''))
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password']
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address')
})

export const internshipSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(20, 'Description is required'),
  duration: z.string().min(2),
  stipend: z.string().min(1),
  skills_required: z.array(z.string().min(1)).default([]),
  deadline: z.string().min(1),
  location: z.string().min(2),
  internship_type: z.enum(['full_time', 'part_time', 'remote', 'hybrid']),
  openings: z.coerce.number().int().min(1)
})

export const internshipUpdateSchema = internshipSchema.partial()

export const companyProfileSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  description: z.string().max(1000).optional().or(z.literal('')),
  website: z.string().url('Enter a valid website').optional().or(z.literal('')),
  logo: z.string().url('Enter a valid logo URL').optional().or(z.literal(''))
})

export const studentProfileSchema = z.object({
  department: z.string().min(2, 'Department is required'),
  skills: z.array(z.string().min(1)).default([]),
  resume_url: z.string().url('Enter a valid resume URL').optional().or(z.literal('')),
  github: z.string().url('Enter a valid GitHub URL').optional().or(z.literal('')),
  linkedin: z.string().url('Enter a valid LinkedIn URL').optional().or(z.literal('')),
  portfolio: z.string().url('Enter a valid portfolio URL').optional().or(z.literal('')),
  profile_image: z.string().url('Enter a valid profile image URL').optional().or(z.literal(''))
})

export const applicationSchema = z.object({
  internship_id: z.string().uuid('Select an internship'),
  resume_url: z.string().url('Upload a valid resume link').optional().or(z.literal(''))
})

export const applicationUpdateSchema = z.object({
  status: z.enum(['submitted', 'reviewing', 'shortlisted', 'rejected', 'interview', 'hired'])
})

export const notificationSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  body: z.string().min(10, 'Message is required'),
  target_roles: z.array(z.enum(['admin', 'company', 'student'])).optional().default([]),
  target_user_ids: z.array(z.string().uuid()).optional().default([])
})

export const accountStatusSchema = z.object({
  account_status: z.enum(['pending_approval', 'active', 'suspended', 'disabled'])
})

export const companyApprovalSchema = z.object({
  approved_status: z.boolean()
})

export const uploadSchema = z.object({
  bucket: z.enum(['resumes', 'logos', 'profiles', 'brochures']),
  folder: z.string().min(1).max(120).optional().or(z.literal(''))
})
