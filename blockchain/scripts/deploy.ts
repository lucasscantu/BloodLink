import { ethers } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import hre from 'hardhat';

async function main() {
  console.log('🚀 Iniciando deploy do contrato BloodBagRegistry...\n');

  // Obter o signer (conta padrão)
  const [deployer] = await ethers.getSigners();
  console.log(`📋 Deployer: ${deployer.address}`);
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Obter a factory do contrato
  const BloodBagRegistry = await hre.ethers.getContractFactory('BloodBagRegistry');

  // Deploy do contrato
  console.log('📝 Deployando BloodBagRegistry...');
  const bloodBagRegistry = await BloodBagRegistry.deploy();

  // Aguardar confirmação
  await bloodBagRegistry.waitForDeployment();

  const contractAddress = await bloodBagRegistry.getAddress();
  console.log(`✅ Contrato deployado com sucesso!`);
  console.log(`📍 Endereço: ${contractAddress}`);
  console.log(`🔗 Transaction Hash: ${bloodBagRegistry.deploymentTransaction()?.hash}\n`);

  // Salvar endereço em arquivo
  const fs = require('fs');
  const path = require('path');
  const deployDir = path.join(__dirname, '../deploy');
  
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }

  const deployInfo = {
    contract: 'BloodBagRegistry',
    address: contractAddress,
    deployer: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    transactionHash: bloodBagRegistry.deploymentTransaction()?.hash,
  };

  fs.writeFileSync(
    path.join(deployDir, 'BloodBagRegistry.json'),
    JSON.stringify(deployInfo, null, 2)
  );

  console.log(`💾 Endereço salvo em: deploy/BloodBagRegistry.json\n`);

  // Verificar funções do contrato
  console.log('🔍 Verificando funções do contrato...');
  const totalBloodBags = await bloodBagRegistry.getTotalBloodBags();
  const totalEvents = await bloodBagRegistry.getTotalEvents();
  const totalTransfers = await bloodBagRegistry.getTotalTransfers();
  const totalDemands = await bloodBagRegistry.getTotalDemands();

  console.log(`   🩸 Total de bolsas: ${totalBloodBags}`);
  console.log(`   📜 Total de eventos: ${totalEvents}`);
  console.log(`   🚚 Total de transferências: ${totalTransfers}`);
  console.log(`   📋 Total de demandas: ${totalDemands}\n`);

  console.log('✨ Deploy concluído com sucesso!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro durante o deploy:', error);
    process.exit(1);
  });
