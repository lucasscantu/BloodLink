#!/bin/bash

# HospitalChain Seed Data Script
# This script populates the database with sample data for development
# Usage: chmod +x scripts/seed.sh && ./scripts/seed.sh

set -e

echo "=========================================="
echo "  HospitalChain - Seed Data"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if Node.js is installed
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    exit 1
fi

cd "$PROJECT_ROOT"

# Check if we have a seed script
echo "Running seed script..."
echo ""

cd backend

# Create seed data using Prisma
cat > /tmp/seed.ts << 'EOF'
import { PrismaClient, UserRole, InstitutionType, BagStatus, DemandStatus, DemandUrgency } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');
    
    // Clear existing data
    await prisma.temperatureReading.deleteMany();
    await prisma.transferRequest.deleteMany();
    await prisma.event.deleteMany();
    await prisma.demand.deleteMany();
    await prisma.bloodBag.deleteMany();
    await prisma.user.deleteMany();
    await prisma.institution.deleteMany();
    
    // Create institutions
    const hemocentro = await prisma.institution.create({
        data: {
            name: 'Hemocentro Central',
            code: 'HC-001',
            type: 'HEMOCENTRO' as InstitutionType,
            cnpj: '00000000000101',
            address: {
                street: 'Rua das Flores',
                number: '123',
                complement: 'Centro',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234567',
                country: 'Brasil',
            },
            phone: '11123456789',
            email: 'contato@hemocentro.sp.gov.br',
            latitude: -23.5505,
            longitude: -46.6333,
            capacity: 500,
            isActive: true,
        },
    });
    
    const hospitalA = await prisma.institution.create({
        data: {
            name: 'Hospital Geral A',
            code: 'HG-A',
            type: 'HOSPITAL' as InstitutionType,
            cnpj: '00000000000102',
            address: {
                street: 'Av. Brasil',
                number: '456',
                complement: '',
                neighborhood: 'Jardins',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234568',
                country: 'Brasil',
            },
            phone: '11987654321',
            email: 'adm@hospitala.sp.gov.br',
            latitude: -23.5605,
            longitude: -46.6433,
            capacity: 200,
            isActive: true,
        },
    });
    
    const hospitalB = await prisma.institution.create({
        data: {
            name: 'Hospital Municipal B',
            code: 'HM-B',
            type: 'HOSPITAL' as InstitutionType,
            cnpj: '00000000000103',
            address: {
                street: 'Rua Augusta',
                number: '789',
                complement: '10º andar',
                neighborhood: 'Consolação',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234569',
                country: 'Brasil',
            },
            phone: '11876543210',
            email: 'contato@hospitalb.sp.gov.br',
            latitude: -23.5705,
            longitude: -46.6533,
            capacity: 150,
            isActive: true,
        },
    });
    
    console.log(`✓ Created institutions: ${hemocentro.name}, ${hospitalA.name}, ${hospitalB.name}`);
    
    // Create users
    const adminPassword = await bcrypt.hash('admin123', 12);
    const hemocentroPassword = await bcrypt.hash('hemocentro123', 12);
    const hospitalAPassword = await bcrypt.hash('hospitala123', 12);
    const hospitalBPassword = await bcrypt.hash('hospitalb123', 12);
    const auditorPassword = await bcrypt.hash('auditor123', 12);
    
    const admin = await prisma.user.create({
        data: {
            name: 'Admin User',
            email: 'admin@hospitalchain.com',
            password: adminPassword,
            role: 'ADMIN' as UserRole,
            institutionId: hemocentro.id,
            phone: '11111111111',
            isActive: true,
        },
    });
    
    const userHemocentro = await prisma.user.create({
        data: {
            name: 'Hemocentro User',
            email: 'user@hemocentro.sp.gov.br',
            password: hemocentroPassword,
            role: 'HEMOCENTRO' as UserRole,
            institutionId: hemocentro.id,
            phone: '22222222222',
            isActive: true,
        },
    });
    
    const userHospitalA = await prisma.user.create({
        data: {
            name: 'Hospital A User',
            email: 'user@hospitala.sp.gov.br',
            password: hospitalAPassword,
            role: 'HOSPITAL' as UserRole,
            institutionId: hospitalA.id,
            phone: '33333333333',
            isActive: true,
        },
    });
    
    const userHospitalB = await prisma.user.create({
        data: {
            name: 'Hospital B User',
            email: 'user@hospitalb.sp.gov.br',
            password: hospitalBPassword,
            role: 'HOSPITAL' as UserRole,
            institutionId: hospitalB.id,
            phone: '44444444444',
            isActive: true,
        },
    });
    
    const auditor = await prisma.user.create({
        data: {
            name: 'Auditor User',
            email: 'auditor@saude.gov.br',
            password: auditorPassword,
            role: 'AUDITOR' as UserRole,
            institutionId: hemocentro.id,
            phone: '55555555555',
            isActive: true,
        },
    });
    
    console.log(`✓ Created users: ${admin.email}, ${userHemocentro.email}, ${userHospitalA.email}, ${userHospitalB.email}, ${auditor.email}`);
    
    // Create blood bags
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const today = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(today.getDate() + 42); // 42 days validity
    
    for (let i = 0; i < 20; i++) {
        const bloodType = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
        const factorRh = bloodType.includes('-') ? false : true;
        const institution = [hemocentro, hospitalA, hospitalB][Math.floor(Math.random() * 3)];
        const code = `${bloodType}-${today.toISOString().slice(0, 10).replace(/-/g, '')}-${String(i).padStart(5, '0')}`;
        
        await prisma.bloodBag.create({
            data: {
                code,
                bloodType: bloodType as any,
                factorRh,
                collectionDate: today,
                expirationDate,
                volume: 450,
                currentInstitutionId: institution.id,
                currentLocation: 'Câmara Frigorífica',
                currentTemperature: 4.0 + Math.random() * 2,
                status: ['ARMAZENADA', 'DISPONIVEL'][Math.floor(Math.random() * 2)] as BagStatus,
                hash: `hash-${code}`,
                qrCode: `qr-${code}`,
            },
        });
    }
    
    console.log('✓ Created 20 blood bags with random types and institutions');
    
    // Create some specific blood bags for testing
    const bagOPlus1 = await prisma.bloodBag.create({
        data: {
            code: 'O+-2026-00001',
            bloodType: 'O+' as any,
            factorRh: true,
            collectionDate: today,
            expirationDate,
            volume: 450,
            currentInstitutionId: hemocentro.id,
            currentLocation: 'Câmara Frigorífica 01',
            currentTemperature: 4.2,
            status: 'DISPONIVEL' as BagStatus,
            hash: 'hash-O+-2026-00001',
            qrCode: 'qr-O+-2026-00001',
        },
    });
    
    const bagONeg1 = await prisma.bloodBag.create({
        data: {
            code: 'O--2026-00002',
            bloodType: 'O-' as any,
            factorRh: false,
            collectionDate: today,
            expirationDate,
            volume: 450,
            currentInstitutionId: hemocentro.id,
            currentLocation: 'Câmara Frigorífica 02',
            currentTemperature: 4.0,
            status: 'DISPONIVEL' as BagStatus,
            hash: 'hash-O--2026-00002',
            qrCode: 'qr-O--2026-00002',
        },
    });
    
    const bagAPlus1 = await prisma.bloodBag.create({
        data: {
            code: 'A+-2026-00003',
            bloodType: 'A+' as any,
            factorRh: true,
            collectionDate: today,
            expirationDate,
            volume: 450,
            currentInstitutionId: hospitalA.id,
            currentLocation: 'Estoque Principal',
            currentTemperature: 4.5,
            status: 'DISPONIVEL' as BagStatus,
            hash: 'hash-A+-2026-00003',
            qrCode: 'qr-A+-2026-00003',
        },
    });
    
    console.log('✓ Created specific blood bags for testing');
    
    // Create demands
    const demand1 = await prisma.demand.create({
        data: {
            institutionId: hospitalA.id,
            bloodType: 'O-' as any,
            quantity: 5,
            urgency: 'ALTA' as DemandUrgency,
            reason: 'Cirurgia de emergência',
            status: 'ABERTA' as DemandStatus,
            notes: 'Necessário para paciente com tipo sanguíneo raro',
            hash: 'hash-demand-001',
        },
    });
    
    const demand2 = await prisma.demand.create({
        data: {
            institutionId: hospitalB.id,
            bloodType: 'A+' as any,
            quantity: 3,
            urgency: 'MEDIA' as DemandUrgency,
            reason: 'Reposição de estoque',
            status: 'ABERTA' as DemandStatus,
            notes: 'Estoque baixo de A+',
            hash: 'hash-demand-002',
        },
    });
    
    console.log(`✓ Created demands: ${demand1.id}, ${demand2.id}`);
    
    // Create events for blood bags
    await prisma.event.create({
        data: {
            bagId: bagOPlus1.id,
            eventType: 'COLETA' as any,
            description: 'Coleta realizada no Hemocentro Central',
            institutionId: hemocentro.id,
            userId: userHemocentro.id,
            hash: 'hash-event-coleta-001',
            blockchainTransactionId: '',
        },
    });
    
    await prisma.event.create({
        data: {
            bagId: bagOPlus1.id,
            eventType: 'APROVACAO' as any,
            description: 'Testes aprovados - bolsa liberada para uso',
            institutionId: hemocentro.id,
            userId: userHemocentro.id,
            hash: 'hash-event-aprovacao-001',
            blockchainTransactionId: '',
        },
    });
    
    await prisma.event.create({
        data: {
            bagId: bagOPlus1.id,
            eventType: 'ARMAZENAMENTO' as any,
            description: 'Armazenada na Câmara Frigorífica 01',
            institutionId: hemocentro.id,
            userId: userHemocentro.id,
            hash: 'hash-event-armazenamento-001',
            blockchainTransactionId: '',
        },
    });
    
    console.log('✓ Created events for blood bags');
    
    // Create temperature readings
    for (let i = 0; i < 5; i++) {
        const hoursAgo = i * 2;
        const tempDate = new Date();
        tempDate.setHours(tempDate.getHours() - hoursAgo);
        
        await prisma.temperatureReading.create({
            data: {
                bagId: bagOPlus1.id,
                temperature: 4.0 + Math.random() * 1.5,
                unit: 'C',
                alertThreshold: 6.0,
                notes: `Leitura ${i + 1}`,
                createdAt: tempDate,
            },
        });
    }
    
    console.log('✓ Created temperature readings');
    
    // Count all data
    const institutionCount = await prisma.institution.count();
    const userCount = await prisma.user.count();
    const bloodBagCount = await prisma.bloodBag.count();
    const demandCount = await prisma.demand.count();
    const eventCount = await prisma.event.count();
    const tempReadingCount = await prisma.temperatureReading.count();
    
    console.log('');
    console.log('Seed Summary:');
    console.log(`  Institutions: ${institutionCount}`);
    console.log(`  Users: ${userCount}`);
    console.log(`  Blood Bags: ${bloodBagCount}`);
    console.log(`  Demands: ${demandCount}`);
    console.log(`  Events: ${eventCount}`);
    console.log(`  Temperature Readings: ${tempReadingCount}`);
    console.log('');
    console.log('Login credentials:');
    console.log(`  Admin: admin@hospitalchain.com / admin123 (${admin.role})`);
    console.log(`  Hemocentro: user@hemocentro.sp.gov.br / hemocentro123 (${userHemocentro.role})`);
    console.log(`  Hospital A: user@hospitala.sp.gov.br / hospitala123 (${userHospitalA.role})`);
    console.log(`  Hospital B: user@hospitalb.sp.gov.br / hospitalb123 (${userHospitalB.role})`);
    console.log(`  Auditor: auditor@saude.gov.br / auditor123 (${auditor.role})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
EOF

echo "Running TypeScript seed script..."
npx tsx /tmp/seed.ts

rm /tmp/seed.ts

echo ""
echo -e "${GREEN}✓ Seed data created successfully!${NC}"
echo ""
