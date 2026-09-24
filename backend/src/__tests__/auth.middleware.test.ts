import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { requireAuth, requireRole } from "../middlewares/auth";

process.env.JWT_SECRET = "test-secret";

function mockRes() {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
}

describe("requireAuth", () => {
  it("rejeita requisições sem token", () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("aceita um token JWT válido e popula req.user", () => {
    const token = jwt.sign(
      { id: "user-1", role: "HOSPITAL", institutionId: "inst-1", name: "Teste" },
      process.env.JWT_SECRET!
    );
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.id).toBe("user-1");
    expect(req.user?.role).toBe("HOSPITAL");
  });

  it("rejeita um token inválido", () => {
    const req = { headers: { authorization: "Bearer token-invalido" } } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("requireRole", () => {
  it("permite acesso quando o papel do usuário está na lista permitida", () => {
    const req = { user: { id: "1", role: "ADMIN", institutionId: null, name: "Admin" } } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireRole("ADMIN", "AUDITOR")(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("bloqueia acesso quando o papel do usuário não está na lista permitida (RBAC)", () => {
    const req = { user: { id: "1", role: "HOSPITAL", institutionId: "inst-1", name: "Hospital" } } as Request;
    const res = mockRes();
    const next = jest.fn();

    requireRole("ADMIN", "AUDITOR")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
