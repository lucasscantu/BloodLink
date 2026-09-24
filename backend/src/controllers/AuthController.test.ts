jest.mock("../lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
    auditLog: { create: jest.fn() },
  },
}));

jest.mock("bcrypt", () => ({ compare: jest.fn() }));

process.env.JWT_SECRET = "test-secret";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { AuthController } from "./AuthController";

function mockReqRes(body: any) {
  const req: any = { body };
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return { req, res };
}

beforeEach(() => jest.clearAllMocks());

describe("AuthController.login", () => {
  it("retorna 401 quando o usuário não existe", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const { req, res } = mockReqRes({ email: "naoexiste@bloodlink.com", password: "qualquer" });

    await AuthController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Credenciais inválidas." });
  });

  it("retorna 401 quando o usuário está inativo", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", active: false });
    const { req, res } = mockReqRes({ email: "inativo@bloodlink.com", password: "senha123" });

    await AuthController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("retorna 401 quando a senha está incorreta", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "u1",
      email: "hospitalA@bloodlink.com",
      active: true,
      passwordHash: "hash-armazenado",
      role: "HOSPITAL",
      institutionId: "inst-1",
      institution: { id: "inst-1", name: "Hospital São Lucas" },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const { req, res } = mockReqRes({ email: "hospitalA@bloodlink.com", password: "senha-errada" });
    await AuthController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("retorna um token JWT válido e os dados do usuário quando as credenciais estão corretas", async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: "u1",
      name: "Carlos Mendes",
      email: "hospitalA@bloodlink.com",
      active: true,
      passwordHash: "hash-armazenado",
      role: "HOSPITAL",
      institutionId: "inst-1",
      institution: { id: "inst-1", name: "Hospital São Lucas" },
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const { req, res } = mockReqRes({ email: "hospitalA@bloodlink.com", password: "senha123" });
    await AuthController.login(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.any(String),
        user: expect.objectContaining({ email: "hospitalA@bloodlink.com", role: "HOSPITAL" }),
      })
    );

    const sentToken = (res.json as jest.Mock).mock.calls[0][0].token;
    const decoded = jwt.verify(sentToken, process.env.JWT_SECRET!) as any;
    expect(decoded.role).toBe("HOSPITAL");
    expect(decoded.institutionId).toBe("inst-1");

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ acao: "LOGIN" }) })
    );
  });
});
