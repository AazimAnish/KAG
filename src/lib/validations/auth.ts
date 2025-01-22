import * as z from "zod";

export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  gender: z.enum(["male", "female", "other"]),
  bodyType: z.enum(["slim", "athletic", "average", "plus"]),
  measurements: z.object({
    height: z.number().min(100).max(250),
    weight: z.number().min(30).max(250),
    chest: z.number().min(50).max(200),
    waist: z.number().min(50).max(200),
    hips: z.number().min(50).max(200).optional(),
  }),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>; 