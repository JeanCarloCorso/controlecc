import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().trim().toLowerCase().email().max(320);
export const passwordSchema = z.string().min(8).max(128);
export const shortNameSchema = z.string().trim().min(2).max(255);
export const workloadSchema = z.coerce.number().int().min(1).max(10_000);
export const isoDateSchema = z.string().date().refine(
  (value) => value <= new Date().toISOString().slice(0, 10),
  "A data não pode estar no futuro",
);
const legacyCreatedAtSchema = z.string().datetime();

export const activityCreateSchema = z.object({
  name: shortNameSchema,
  description: z.string().trim().min(2).max(2000),
  workload: workloadSchema,
  completionDate: isoDateSchema,
  projectId: uuidSchema.nullish(),
  eventTypeId: uuidSchema.nullish(),
  pathFile: z.string().min(1).max(1024),
  hashFile: z.string().regex(/^[a-f0-9]{64}$/),
  // Compatibilidade com clientes anteriores; estes campos nunca são usados no INSERT.
  status: z.literal("pending").optional(),
  userId: uuidSchema.optional(),
  createdAt: legacyCreatedAtSchema.optional(),
}).strict();

export const activityPatchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  observation: z.string().trim().max(2000).nullable().optional(),
  workload: workloadSchema.optional(),
  archived: z.boolean().optional(),
  // Campo legado ignorado: o proprietário da atividade não pode ser alterado aqui.
  userId: uuidSchema.optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

export const courseCreateSchema = z.object({
  name: shortNameSchema,
  projects: z.array(z.never()).max(0).optional(),
  createdAt: legacyCreatedAtSchema.optional(),
}).strict();
export const eventTypeCreateSchema = z.object({
  name: shortNameSchema,
  createdAt: legacyCreatedAtSchema.optional(),
}).strict();
export const projectSchema = z.object({
  id: uuidSchema.optional(),
  uid: uuidSchema.optional(),
  name: shortNameSchema,
  year: z.coerce.number().int().min(1900).max(2200),
  course: shortNameSchema.optional(),
}).strict().refine((value) => !(value.id && value.uid) || value.id === value.uid);
export const coursePatchSchema = z.object({
  name: shortNameSchema.optional(),
  projects: z.array(projectSchema).max(200).optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
export const eventTypePatchSchema = z.object({ name: shortNameSchema }).strict();
export const userPatchSchema = z.object({
  name: shortNameSchema.optional(),
  fullname: shortNameSchema.optional(),
  email: emailSchema.optional(),
  role: z.enum(["common", "admin"]).optional(),
}).strict()
  .refine((value) => Object.keys(value).length > 0)
  .refine((value) => !(value.name && value.fullname && value.name !== value.fullname));

export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullname: shortNameSchema,
  registrationNumber: z.string().trim().min(2).max(100),
  recaptchaToken: z.string().max(4096).optional(),
}).strict();

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
}).strict().refine((data) => data.currentPassword !== data.newPassword, {
  path: ["newPassword"],
  message: "A nova senha deve ser diferente da senha atual",
});

export const resetRequestSchema = z.object({ email: emailSchema }).strict();
export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(256),
  password: passwordSchema,
}).strict();
export const tokenSchema = z.object({ token: z.string().min(32).max(256) }).strict();
