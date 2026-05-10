import "dotenv/config";
import { prisma } from "./app/lib/prisma";

async function clean() {
  console.log("Cleaning database...");
  await prisma.reaction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.consultantAvailability.deleteMany();
  await prisma.consultantTemplate.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.consultantApplication.deleteMany();
  await prisma.consultant.deleteMany();
  await prisma.userSuspension.deleteMany();
  await prisma.nickname.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();
  console.log("Database cleaned.");
  await prisma.$disconnect();
}

clean().catch((e) => {
  console.error(e);
  process.exit(1);
});
