import { Role } from '@prisma/client';
import prisma from '../src/config/db';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const Free = 'price_1T4uTcRY01Z2IS7AI9o1KbX5'
const Basic = 'price_1T4uUIRY01Z2IS7A8w5wxMee'
const Pro = 'price_1T4uUdRY01Z2IS7AmLS9SQ9z'
const Enterprise = 'price_1T4uVARY01Z2IS7AOn54eASk'


async function main() {
    console.log('🌱 Starting database seed...');

    // 1. Clean existing data (optional, but good for reliable seeds)
    console.log('🧹 Cleaning existing data...');
    await prisma.file.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.userSubscriptionHistory.deleteMany();
    await prisma.subscriptionPackage.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create Default Subscription Packages (Production-Grade)
    console.log('📦 Seeding Subscription Packages...');
    const freePackage = await prisma.subscriptionPackage.create({
        data: {
            name: 'Free Tier',
            price: 0.0,
            stripePriceId: Free,
            maxFolders: 5,
            maxNesting: 2,
            allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
            maxFileSize: BigInt(5 * 1024 * 1024), // 5MB
            totalFiles: 20,
            filesPerFolder: 5,
            storageLimit: BigInt(5 * 1024 * 1024), // 5MB
        }
    });

    await prisma.subscriptionPackage.create({
        data: {
            name: 'Basic Plan',
            price: 9.99,
            stripePriceId: Basic,
            maxFolders: 15,
            maxNesting: 3,
            allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
            maxFileSize: BigInt(15 * 1024 * 1024), // 15MB
            totalFiles: 100,
            filesPerFolder: 15,
            storageLimit: BigInt(15 * 1024 * 1024), // 15MB
        }
    });

    const proPackage = await prisma.subscriptionPackage.create({
        data: {
            name: 'Pro Plan',
            price: 19.99,
            stripePriceId: Pro,
            maxFolders: 50,
            maxNesting: 5,
            allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'application/zip'],
            maxFileSize: BigInt(50 * 1024 * 1024), // 50MB
            totalFiles: 500,
            filesPerFolder: 50,
            storageLimit: BigInt(50 * 1024 * 1024), // 50MB
        }
    });

    await prisma.subscriptionPackage.create({
        data: {
            name: 'Enterprise',
            price: 49.99,
            stripePriceId: Enterprise,
            maxFolders: -1, // Unlimited
            maxNesting: 10,
            allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'video/mp4', 'application/zip', 'audio/mpeg'],
            maxFileSize: BigInt(200 * 1024 * 1024), // 200MB
            totalFiles: -1, // Unlimited
            filesPerFolder: -1, // Unlimited
            storageLimit: BigInt(200 * 1024 * 1024), // 200MB
        }
    });

    // 3. Create Users
    console.log('👥 Seeding Users...');
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('Admin@123', saltRounds);
    const userPassword = await bcrypt.hash('User@123', saltRounds);

    await prisma.user.create({
        data: {
            name: 'System Admin',
            email: 'admin@system.com',
            password: adminPassword,
            role: Role.ADMIN,
            isVerified: true,
        }
    });

    const activeUser = await prisma.user.create({
        data: {
            name: 'John Doe',
            email: 'john@example.com',
            password: userPassword,
            role: Role.USER,
            isVerified: true,
            stripeCustomerId: 'cus_JohnDoeStripeID',
            subscriptionHistory: {
                create: {
                    packageId: proPackage.id,
                    stripeSubscriptionId: 'sub_JohnDoeProPlan',
                    paymentStatus: 'active',
                    isActive: true,
                }
            }
        }
    });

    await prisma.user.create({
        data: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: userPassword,
            role: Role.USER,
            isVerified: true,
            subscriptionHistory: {
                create: {
                    packageId: freePackage.id,
                    paymentStatus: 'active',
                    isActive: true,
                }
            }
        }
    });

    // 4. Create Folders and Files for Active User (Realistic Data)
    console.log('📁 Seeding Folders and Files...');
    const rootFolder = await prisma.folder.create({
        data: {
            name: 'Documents',
            userId: activeUser.id,
            depthLevel: 0,
        }
    });

    const subFolder = await prisma.folder.create({
        data: {
            name: 'Invoices 2024',
            userId: activeUser.id,
            parentId: rootFolder.id,
            depthLevel: 1,
        }
    });

    // Seed Random Files
    const filesToCreate = [
        { name: 'logo.png', size: 1.2 * 1024 * 1024, mime: 'image/png', folderId: rootFolder.id },
        { name: 'Q1_Report.pdf', size: 4.5 * 1024 * 1024, mime: 'application/pdf', folderId: rootFolder.id },
        { name: 'Invoice_Jan.pdf', size: 0.5 * 1024 * 1024, mime: 'application/pdf', folderId: subFolder.id },
        { name: 'Presentation.mp4', size: 15.8 * 1024 * 1024, mime: 'video/mp4', folderId: null }, // Root level
    ];

    for (const file of filesToCreate) {
        await prisma.file.create({
            data: {
                name: file.name,
                size: BigInt(Math.floor(file.size)),
                mimeType: file.mime,
                userId: activeUser.id,
                folderId: file.folderId,
                s3Key: crypto.randomBytes(16).toString('hex') + '-' + file.name,
            }
        });
    }

    console.log('✅ Seed completed successfully!');
    console.log(`\nAdmin Email: admin@system.com\nPassword: Admin@123`);
    console.log(`User Email: john@example.com\nPassword: User@123\n`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
