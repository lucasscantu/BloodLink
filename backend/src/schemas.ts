import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const bloodTypeEnum = z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"]);

export const createBloodBagSchema = z.object({
  tipoSanguineo: bloodTypeEnum,
  localizacaoAtual: z.string().min(2),
  instituicaoId: z.string().uuid().optional(),
});

export const rejectBagSchema = z.object({
  motivo: z.string().min(2),
});

export const createDemandSchema = z.object({
  hospitalId: z.string().uuid().optional(),
  tipoSanguineo: bloodTypeEnum,
  quantidade: z.number().int().positive(),
  urgencia: z.enum(["BAIXA", "MEDIA", "ALTA", "CRITICA"]),
  motivo: z.string().min(2),
});

export const offerDemandSchema = z.object({
  bagId: z.string().uuid(),
  sourceInstitutionId: z.string().uuid().optional(),
});

export const acceptDemandSchema = z.object({
  transferId: z.string().uuid(),
});

export const createInstitutionSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["HEMOCENTRO", "HOSPITAL"]),
  city: z.string().min(2),
  state: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
});

export const temperatureReadingSchema = z.object({
  valor: z.number(),
});

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "HEMOCENTRO", "HOSPITAL", "AUDITOR"]),
  institutionId: z.string().uuid().optional(),
});
