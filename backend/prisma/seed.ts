import "dotenv/config";
import { PrismaClient, BloodType, DemandUrgency } from "@prisma/client";
import bcrypt from "bcrypt";
import { BloodBagService } from "../src/services/BloodBagService";
import { DemandService } from "../src/services/DemandService";
import { TransferService } from "../src/services/TransferService";
import { TemperatureService } from "../src/services/TemperatureService";
import { AuthenticatedUser } from "../src/middlewares/auth";

const prisma = new PrismaClient();

const BLOOD_TYPES: BloodType[] = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG"];

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Seed: limpando dados existentes...");
  await prisma.temperatureReading.deleteMany();
  await prisma.bloodBagEvent.deleteMany();
  await prisma.bloodTransfer.deleteMany();
  await prisma.bloodDemand.deleteMany();
  await prisma.bloodBag.deleteMany();
  await prisma.blockchainTransaction.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  console.log("Seed: criando instituições...");
  const hemocentro = await prisma.institution.create({
    data: { name: "Hemocentro Central", type: "HEMOCENTRO", city: "Passo Fundo", state: "RS", latitude: -28.263, longitude: -52.406 },
  });
  const hospitalA = await prisma.institution.create({
    data: { name: "Hospital São Lucas", type: "HOSPITAL", city: "Passo Fundo", state: "RS", latitude: -28.245, longitude: -52.39 },
  });
  const hospitalB = await prisma.institution.create({
    data: { name: "Hospital Municipal", type: "HOSPITAL", city: "Carazinho", state: "RS", latitude: -28.284, longitude: -52.786 },
  });
  const hospitalC = await prisma.institution.create({
    data: { name: "Hospital Regional", type: "HOSPITAL", city: "Erechim", state: "RS", latitude: -27.635, longitude: -52.274 },
  });
  const hospitalD = await prisma.institution.create({
    data: { name: "Hospital Universitário", type: "HOSPITAL", city: "Passo Fundo", state: "RS", latitude: -28.255, longitude: -52.41 },
  });

  console.log("Seed: criando usuários de demonstração...");
  const senhaPadrao = await bcrypt.hash("senha123", 10);

  const admin = await prisma.user.create({
    data: { name: "Admin do Sistema", email: "admin@bloodlink.com", passwordHash: senhaPadrao, role: "ADMIN" },
  });
  const userHemocentro = await prisma.user.create({
    data: {
      name: "Marina Souza",
      email: "hemocentro@bloodlink.com",
      passwordHash: senhaPadrao,
      role: "HEMOCENTRO",
      institutionId: hemocentro.id,
    },
  });
  const userHospitalA = await prisma.user.create({
    data: {
      name: "Carlos Mendes",
      email: "hospitalA@bloodlink.com",
      passwordHash: senhaPadrao,
      role: "HOSPITAL",
      institutionId: hospitalA.id,
    },
  });
  const userHospitalB = await prisma.user.create({
    data: {
      name: "Fernanda Lima",
      email: "hospitalB@bloodlink.com",
      passwordHash: senhaPadrao,
      role: "HOSPITAL",
      institutionId: hospitalB.id,
    },
  });
  await prisma.user.create({
    data: {
      name: "Roberto Alves",
      email: "auditor@bloodlink.com",
      passwordHash: senhaPadrao,
      role: "AUDITOR",
    },
  });

  const asHemocentro: AuthenticatedUser = {
    id: userHemocentro.id,
    role: "HEMOCENTRO",
    institutionId: hemocentro.id,
    name: userHemocentro.name,
  };
  const asHospitalA: AuthenticatedUser = {
    id: userHospitalA.id,
    role: "HOSPITAL",
    institutionId: hospitalA.id,
    name: userHospitalA.name,
  };
  const asHospitalB: AuthenticatedUser = {
    id: userHospitalB.id,
    role: "HOSPITAL",
    institutionId: hospitalB.id,
    name: userHospitalB.name,
  };
  const asAdmin: AuthenticatedUser = { id: admin.id, role: "ADMIN", institutionId: null, name: admin.name };

  console.log("Seed: criando bolsas de sangue (isso passa pela blockchain, pode levar alguns minutos)...");

  const institutions = [hemocentro, hospitalA, hospitalB, hospitalC, hospitalD];

  // 100 bolsas com tipos, instituições e trajetórias variadas
  for (let i = 0; i < 100; i++) {
    const tipo = randomOf(BLOOD_TYPES);
    const instituicao = randomOf(institutions);
    const actor: AuthenticatedUser =
      instituicao.id === hemocentro.id
        ? asHemocentro
        : instituicao.id === hospitalA.id
        ? asHospitalA
        : instituicao.id === hospitalB.id
        ? asHospitalB
        : asAdmin;

    const bag = await BloodBagService.create(
      { tipoSanguineo: tipo, instituicaoId: instituicao.id, localizacaoAtual: "Câmara frigorífica 0" + (1 + (i % 4)) },
      actor
    );

    // Trajetória variada: ~70% aprovadas/disponíveis, ~10% reprovadas, ~10% utilizadas, ~10% ficam apenas coletadas/em teste
    const roll = Math.random();
    if (roll < 0.7) {
      await BloodBagService.approve(bag.id, actor);
      await TemperatureService.registerReading(bag.id, TemperatureService.simulateTemperature());
    } else if (roll < 0.8) {
      await BloodBagService.reject(bag.id, "Resultado de sorologia não conforme", actor);
    } else if (roll < 0.9) {
      await BloodBagService.approve(bag.id, actor);
      await BloodBagService.use(bag.id, actor);
    }
    // os ~10% restantes permanecem COLETADA/EM_TESTE, simulando bolsas recém chegadas
  }

  console.log("Seed: criando demandas de sangue...");

  const urgencias: DemandUrgency[] = ["BAIXA", "MEDIA", "ALTA", "CRITICA"];
  for (let i = 0; i < 14; i++) {
    const hospital = randomOf([hospitalA, hospitalB, hospitalC, hospitalD]);
    await DemandService.create({
      hospitalId: hospital.id,
      tipoSanguineo: randomOf(BLOOD_TYPES),
      quantidade: 3 + Math.floor(Math.random() * 8),
      urgencia: randomOf(urgencias),
      motivo: "Reposição de estoque",
    });
  }

  // Caso 4 do enunciado: demanda urgente O- do Hospital A
  const demandaUrgente = await DemandService.create({
    hospitalId: hospitalA.id,
    tipoSanguineo: "O_NEG",
    quantidade: 5,
    urgencia: "ALTA",
    motivo: "Reposição de estoque para cirurgias de emergência",
  });

  console.log("Seed: fluxo de demonstração completo (Hospital A recebe de Hospital B)...");

  // Garante que existam bolsas O- DISPONIVEL no Hemocentro e no Hospital B para o fluxo de demo
  const bagHemocentro = await BloodBagService.create(
    { tipoSanguineo: "O_NEG", instituicaoId: hemocentro.id, localizacaoAtual: "Câmara frigorífica 01" },
    asHemocentro
  );
  await BloodBagService.approve(bagHemocentro.id, asHemocentro);

  const bagsHospitalB: string[] = [];
  for (let i = 0; i < 4; i++) {
    const bag = await BloodBagService.create(
      { tipoSanguineo: "O_NEG", instituicaoId: hospitalB.id, localizacaoAtual: "Câmara frigorífica 02" },
      asHospitalB
    );
    await BloodBagService.approve(bag.id, asHospitalB);
    bagsHospitalB.push(bag.id);
  }

  // Caso 5: transferência entre hospitais — Hospital B oferece, Hospital A aceita e recebe
  const transfer = await TransferService.offer(
    { demandId: demandaUrgente.id, bagId: bagsHospitalB[0], destinationInstitutionId: hospitalA.id },
    asHospitalB
  );
  await TransferService.accept(transfer.id, asHospitalA);
  await TransferService.receive(transfer.id, asHospitalA);
  await DemandService.updateStatusFromTransfers(demandaUrgente.id);

  // Caso 2: uma bolsa fica explicitamente EM_TRANSPORTE (etapa intermediária do fluxo, sem receber ainda)
  const transferEmTransporte = await TransferService.offer(
    { bagId: bagsHospitalB[1], destinationInstitutionId: hospitalC.id },
    asHospitalB
  );
  await TransferService.accept(transferEmTransporte.id, asAdmin);
  // fica parada em EM_TRANSPORTE propositalmente, sem chamar receive()

  // Caso 3: bolsa com alerta de temperatura (usa uma bolsa garantidamente
  // DISPONIVEL — bagHemocentro — para a leitura de temperatura fazer sentido
  // narrativamente na demonstração, em vez de uma bolsa aleatória do laço
  // acima que poderia já estar UTILIZADA/DESCARTADA)
  await TemperatureService.registerReading(bagHemocentro.id, 9.4); // fora da faixa 2-6°C, gera alerta
  await TemperatureService.registerReading(bagHemocentro.id, 4.2);

  console.log("Seed concluído com sucesso!");
  console.log("---------------------------------------------");
  console.log("Usuários de demonstração (senha: senha123):");
  console.log(" admin@bloodlink.com        (ADMIN)");
  console.log(" hemocentro@bloodlink.com   (HEMOCENTRO)");
  console.log(" hospitalA@bloodlink.com    (HOSPITAL)");
  console.log(" hospitalB@bloodlink.com    (HOSPITAL)");
  console.log(" auditor@bloodlink.com      (AUDITOR)");
  console.log("---------------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
