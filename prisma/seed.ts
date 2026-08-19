import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding baseline dummy data...");

  // Create or update default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@nexasphere.local" },
    update: {},
    create: {
      email: "admin@nexasphere.local",
      name: "System Admin",
      role: "ADMIN",
    },
  });

  console.log(`Seeded admin user: ${adminUser.email}`);

  // Create or update default settings / baseline data
  const defaultPost = await prisma.post.upsert({
    where: { id: "default-welcome-post" },
    update: {},
    create: {
      id: "default-welcome-post",
      title: "Welcome to NexaSphere!",
      content:
        "This is the premier tech community of GL Bajaj Group of Institutions.",
      published: true,
      authorId: adminUser.id,
    },
  });

  console.log(`Seeded welcome post: "${defaultPost.title}"`);
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
