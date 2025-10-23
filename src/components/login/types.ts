import * as z from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email format'),
});

/**
 * Email form type derived from schema
 */
export type EmailFormType = z.infer<typeof emailSchema>;

/**
 * Props for login form
 */
export type LoginFormProps = {
  onSubmit?: (data: EmailFormType) => void;
  initialError?: string | null;
};

/**
 * Magic link request state
 */
export type MagicLinkState = {
  isLoading: boolean;
  error: string;
  emailSent: boolean;
  sendAttempts: number;
};
