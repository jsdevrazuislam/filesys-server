import prisma from '../src/config/db';


async function main() {
    console.log('🧹 Cleaning existing data...');
    await prisma.file.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.userSubscriptionHistory.deleteMany();
    await prisma.subscriptionPackage.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Db Clear completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
