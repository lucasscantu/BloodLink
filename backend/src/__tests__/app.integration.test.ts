/**
 * Teste de integração das rotas HTTP. Usa supertest para exercitar o app
 * Express de verdade (middlewares de auth, RBAC e validação Zod incluídos),
 * mas com Prisma, bcrypt e a camada de serviços mockados — a lógica de
 * negócio em si já é coberta pelos testes unitários de cada serviço.
 */

process.env.JWT_SECRET = "test-secret-integration";

jest.mock("../lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock("bcrypt", () => ({ compare: jest.fn() }));

jest.mock("../services/BloodBagService", () => ({
  BloodBagService: {
    create: jest.fn().mockResolvedValue({ id: "bag-1", codigo: "O--2026-00001" }),
    list: jest.fn().mockResolvedValue([]),
  },
  bloodTypeLabel: jest.fn(() => "O-"),
}));

jest.mock("../services/DemandService", () => ({
  DemandService: {
    create: jest.fn().mockResolvedValue({ id: "demand-1" }),
    list: jest.fn().mockResolvedValue([]),
  },
}));

import request from "supertest";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { createApp } from "../app";
import { BloodBagService } from "../services/BloodBagService";

const app = createApp();

async function loginAs(role: "ADMIN" | "HEMOCENTRO" | "HOSPITAL" | "AUDITOR", institutionId: string | null = "inst-1") {
  (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
    id: `user-${role}`,
    name: `Usuário ${role}`,
    email: `${role.toLowerCase()}@bloodlink.com`,
    active: true,
    passwordHash: "hash",
    role,
    institutionId,
    institution: institutionId ? { id: institutionId, name: "Instituição de Teste" } : null,
  });
  (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

  const res = await request(app).post("/api/auth/login").send({ email: "qualquer@bloodlink.com", password: "senha123" });
  return res.body.token as string;
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/health", () => {
  it("responde 200 sem necessidade de autenticação", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /api/auth/login", () => {
  it("retorna 400 quando o corpo da requisição é inválido (validação Zod)", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "nao-e-email" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("retorna 401 para credenciais inválidas", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await request(app).post("/api/auth/login").send({ email: "x@bloodlink.com", password: "123456" });
    expect(res.status).toBe(401);
  });
});

describe("Autenticação obrigatória", () => {
  it("retorna 401 ao acessar uma rota protegida sem token", async () => {
    const res = await request(app).get("/api/blood-bags");
    expect(res.status).toBe(401);
  });

  it("retorna 401 com um token malformado", async () => {
    const res = await request(app).get("/api/blood-bags").set("Authorization", "Bearer token-invalido");
    expect(res.status).toBe(401);
  });
});

describe("RBAC — POST /api/blood-bags", () => {
  it("HOSPITAL não pode cadastrar bolsas (apenas HEMOCENTRO/ADMIN podem)", async () => {
    const token = await loginAs("HOSPITAL");

    const res = await request(app)
      .post("/api/blood-bags")
      .set("Authorization", `Bearer ${token}`)
      .send({ tipoSanguineo: "O_NEG", localizacaoAtual: "Câmara 01" });

    expect(res.status).toBe(403);
    expect(BloodBagService.create).not.toHaveBeenCalled();
  });

  it("HEMOCENTRO pode cadastrar bolsas", async () => {
    const token = await loginAs("HEMOCENTRO", "hemocentro-1");

    const res = await request(app)
      .post("/api/blood-bags")
      .set("Authorization", `Bearer ${token}`)
      .send({ tipoSanguineo: "O_NEG", localizacaoAtual: "Câmara 01" });

    expect(res.status).toBe(201);
    expect(BloodBagService.create).toHaveBeenCalled();
  });

  it("retorna 400 quando o tipo sanguíneo enviado é inválido", async () => {
    const token = await loginAs("HEMOCENTRO", "hemocentro-1");

    const res = await request(app)
      .post("/api/blood-bags")
      .set("Authorization", `Bearer ${token}`)
      .send({ tipoSanguineo: "Z_POS", localizacaoAtual: "Câmara 01" });

    expect(res.status).toBe(400);
  });
});

describe("RBAC — POST /api/demands", () => {
  it("HEMOCENTRO não pode criar demandas (apenas HOSPITAL/ADMIN podem)", async () => {
    const token = await loginAs("HEMOCENTRO", "hemocentro-1");

    const res = await request(app)
      .post("/api/demands")
      .set("Authorization", `Bearer ${token}`)
      .send({ tipoSanguineo: "O_NEG", quantidade: 5, urgencia: "ALTA", motivo: "Reposição" });

    expect(res.status).toBe(403);
  });

  it("HOSPITAL pode criar demandas para a própria instituição", async () => {
    const token = await loginAs("HOSPITAL", "hospital-a");

    const res = await request(app)
      .post("/api/demands")
      .set("Authorization", `Bearer ${token}`)
      .send({ tipoSanguineo: "O_NEG", quantidade: 5, urgencia: "ALTA", motivo: "Reposição" });

    expect(res.status).toBe(201);
  });
});

describe("RBAC — GET /api/audit", () => {
  it("HOSPITAL não pode acessar a auditoria (apenas ADMIN/AUDITOR)", async () => {
    const token = await loginAs("HOSPITAL");
    const res = await request(app).get("/api/audit").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
