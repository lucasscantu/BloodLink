import { expect } from "chai";
import { ethers } from "hardhat";

describe("BloodChainRegistry", function () {
  async function deploy() {
    const Registry = await ethers.getContractFactory("BloodChainRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    return registry;
  }

  it("registra um evento e incrementa o histórico", async function () {
    const registry = await deploy();
    const dataHash = ethers.keccak256(ethers.toUtf8Bytes("dados-do-evento"));

    await registry.registerEvent("BAG-001", "COLETA", "INST-1", "USER-1", dataHash);

    const history = await registry.getBloodBagHistory("BAG-001");
    expect(history.length).to.equal(1);
    expect(history[0].eventType).to.equal("COLETA");
    expect(history[0].dataHash).to.equal(dataHash);
  });

  it("mantém histórico append-only (múltiplos eventos em ordem)", async function () {
    const registry = await deploy();
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("evento-1"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("evento-2"));

    await registry.registerEvent("BAG-002", "COLETA", "INST-1", "USER-1", h1);
    await registry.registerEvent("BAG-002", "APROVACAO", "INST-1", "USER-2", h2);

    const history = await registry.getBloodBagHistory("BAG-002");
    expect(history.length).to.equal(2);
    expect(history[0].eventType).to.equal("COLETA");
    expect(history[1].eventType).to.equal("APROVACAO");
  });

  it("verifyEvent retorna true para hash correto e false para hash divergente", async function () {
    const registry = await deploy();
    const correctHash = ethers.keccak256(ethers.toUtf8Bytes("dados-corretos"));
    const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("dados-alterados"));

    await registry.registerEvent("BAG-003", "APROVACAO", "INST-1", "USER-1", correctHash);

    expect(await registry.verifyEvent("BAG-003", 0, correctHash)).to.equal(true);
    expect(await registry.verifyEvent("BAG-003", 0, wrongHash)).to.equal(false);
  });

  it("mantém eventCount sincronizado com o tamanho do histórico", async function () {
    const registry = await deploy();
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("e1"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("e2"));
    const h3 = ethers.keccak256(ethers.toUtf8Bytes("e3"));

    expect(await registry.eventCount("BAG-004")).to.equal(0);

    await registry.registerEvent("BAG-004", "COLETA", "INST-1", "USER-1", h1);
    expect(await registry.eventCount("BAG-004")).to.equal(1);

    await registry.registerEvent("BAG-004", "APROVACAO", "INST-1", "USER-1", h2);
    await registry.registerEvent("BAG-004", "ARMAZENAMENTO", "INST-1", "USER-1", h3);
    expect(await registry.eventCount("BAG-004")).to.equal(3);
  });

  it("mantém o histórico de cada bolsa isolado (bolsas diferentes não se misturam)", async function () {
    const registry = await deploy();
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("bolsa-a"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("bolsa-b"));

    await registry.registerEvent("BAG-A", "COLETA", "INST-1", "USER-1", h1);
    await registry.registerEvent("BAG-B", "COLETA", "INST-2", "USER-2", h2);

    const historyA = await registry.getBloodBagHistory("BAG-A");
    const historyB = await registry.getBloodBagHistory("BAG-B");

    expect(historyA.length).to.equal(1);
    expect(historyB.length).to.equal(1);
    expect(historyA[0].institutionId).to.equal("INST-1");
    expect(historyB[0].institutionId).to.equal("INST-2");
  });

  it("getBloodBagHistory retorna array vazio para uma bolsa sem eventos", async function () {
    const registry = await deploy();
    const history = await registry.getBloodBagHistory("BAG-INEXISTENTE");
    expect(history.length).to.equal(0);
  });

  it("getEvent retorna o evento correto pelo índice", async function () {
    const registry = await deploy();
    const h1 = ethers.keccak256(ethers.toUtf8Bytes("primeiro"));
    const h2 = ethers.keccak256(ethers.toUtf8Bytes("segundo"));

    await registry.registerEvent("BAG-005", "COLETA", "INST-1", "USER-1", h1);
    await registry.registerEvent("BAG-005", "APROVACAO", "INST-1", "USER-2", h2);

    const evento = await registry.getEvent("BAG-005", 1);
    expect(evento.eventType).to.equal("APROVACAO");
    expect(evento.dataHash).to.equal(h2);
  });

  it("getEvent reverte ao consultar um índice fora do range", async function () {
    const registry = await deploy();
    await registry.registerEvent("BAG-006", "COLETA", "INST-1", "USER-1", ethers.ZeroHash);

    await expect(registry.getEvent("BAG-006", 5)).to.be.revertedWith("Evento inexistente");
  });

  it("verifyEvent reverte ao consultar um índice fora do range", async function () {
    const registry = await deploy();
    await expect(registry.verifyEvent("BAG-007", 0, ethers.ZeroHash)).to.be.revertedWith("Evento inexistente");
  });

  it("emite o evento EventRegistered com os dados corretos", async function () {
    const registry = await deploy();
    const hash = ethers.keccak256(ethers.toUtf8Bytes("evento-emitido"));

    const tx = await registry.registerEvent("BAG-008", "TRANSFERENCIA_CRIADA", "INST-1", "USER-1", hash);
    const receipt = await tx.wait();

    const parsed = receipt!.logs
      .map((log: any) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e?.name === "EventRegistered");

    expect(parsed).to.not.be.null;
    expect(parsed!.args.bagId).to.equal("BAG-008");
    expect(parsed!.args.eventIndex).to.equal(0n);
    expect(parsed!.args.eventType).to.equal("TRANSFERENCIA_CRIADA");
    expect(parsed!.args.institutionId).to.equal("INST-1");
    expect(parsed!.args.userId).to.equal("USER-1");
    expect(parsed!.args.dataHash).to.equal(hash);
    expect(parsed!.args.timestamp).to.be.a("bigint");
  });

  it("não expõe nenhuma função de alteração ou remoção de eventos já registrados", async function () {
    const registry = await deploy();
    const abi = registry.interface.fragments.map((f: any) => f.name).filter(Boolean);

    // Garante que o contrato é realmente append-only: nenhuma função de
    // update/delete/remove/edit está presente na interface pública.
    const forbidden = abi.filter((name: string) => /update|delete|remove|edit|set/i.test(name));
    expect(forbidden).to.deep.equal([]);
  });
});
