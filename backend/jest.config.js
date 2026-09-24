/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  // Evita que o jest-haste-map escaneie o dist/ compilado (gerado por `npm run
  // build`) e reclame de "duplicate manual mock" ao encontrar uma segunda
  // cópia de prismaClientStub.ts já transpilada para .js.
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  collectCoverageFrom: ["src/**/*.ts", "!src/index.ts", "!src/**/*.d.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  // Substitui @prisma/client por um stub determinístico nos testes, para não
  // depender do binário do engine do Prisma (ver src/__mocks__/prismaClientStub.ts).
  moduleNameMapper: {
    "^@prisma/client$": "<rootDir>/src/__mocks__/prismaClientStub.ts",
  },
};
