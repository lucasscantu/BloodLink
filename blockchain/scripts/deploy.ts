import { ethers, artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Faz o deploy do BloodChainRegistry na rede local (Hardhat node)
 * e salva o endereço + ABI em backend/src/blockchain/deployed.json
 * para que o BlockchainService do backend consiga se conectar.
 */
async function main() {
  const Registry = await ethers.getContractFactory("BloodChainRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("BloodChainRegistry implantado em:", address);

  const artifact = await artifacts.readArtifact("BloodChainRegistry");

  // Em ambiente local (sem Docker), o arquivo é escrito diretamente dentro do
  // backend, para que o EvmBlockchainService o encontre no caminho padrão.
  // No Docker, DEPLOY_OUTPUT_DIR aponta para um volume compartilhado entre os
  // containers "blockchain" e "backend" (ver docker-compose.yml).
  const outDir =
    process.env.DEPLOY_OUTPUT_DIR ||
    path.join(__dirname, "..", "..", "backend", "src", "blockchain");

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const deployedFile = path.join(outDir, "deployed.json");
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL_PUBLIC || "http://127.0.0.1:8545";

  fs.writeFileSync(
    deployedFile,
    JSON.stringify(
      {
        address,
        abi: artifact.abi,
        network: "localhost",
        rpcUrl,
      },
      null,
      2
    )
  );

  console.log(`Endereço e ABI salvos em ${deployedFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
