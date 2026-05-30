import { prisma } from '../src/app/lib/prisma';

async function main() {
  const consultants = await prisma.consultant.findMany({
    include: { availabilities: true, user: true },
  });
  for (const c of consultants) {
    console.log('Consultant:', c.user?.email, c.id);
    if (!c.availabilities || c.availabilities.length === 0) {
      console.log('  no availabilities');
      continue;
    }
    for (const a of c.availabilities) {
      console.log('  availability:', a.dayOfWeek, a.startTime.toISOString(), a.endTime.toISOString(), 'isBlocked=', a.isBlocked, 'isRecurring=', a.isRecurring);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
