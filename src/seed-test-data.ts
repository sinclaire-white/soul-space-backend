/**
 * Comprehensive Test Data Seed Script
 * Seeds: super admin, admin, regular users, consultants,
 *        posts, comments, reactions, bookings, reviews,
 *        reports, consultant applications, and availabilities.
 *
 * Run with:  pnpm --dir backend tsx src/seed-test-data.ts
 */

import "dotenv/config";
import {
  ApplicationStatus,
  BookingStatus,
  CommentStatus,
  PaymentStatus,
  PostStatus,
  PostVisibility,
  ReactionType,
  ReportStatus,
  ReportType,
  SuspensionType,
  UserRole,
  VerificationStatus,
} from "../prisma/generated/prisma/enums";
import { auth } from "./app/lib/auth";
import { prisma } from "./app/lib/prisma";

/* ─────────────────────────── helpers ─────────────────────────── */

const log = (msg: string) => console.log(`[seed] ${msg}`);

/**
 * Create a user via better-auth (handles password hashing),
 * then immediately verify the email so login works without OTP.
 * Returns the created user.
 */
async function createUser(
  email: string,
  password: string,
  name: string,
  role: UserRole = UserRole.USER
) {
  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    log(`User already exists: ${email} — skipping`);
    return existing;
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name, role },
  });

  // Force-verify email and set correct role (better-auth may ignore custom roles)
  const user = await prisma.user.update({
    where: { id: result.user.id },
    data: { emailVerified: true, role },
  });

  // Create nickname if not already present
  const nicknameExists = await prisma.nickname.findUnique({
    where: { userId: user.id },
  });
  if (!nicknameExists) {
    const handle = name.toLowerCase().replace(/\s+/g, "_") + "_" + Math.random().toString(36).slice(2, 6);
    await prisma.nickname.create({
      data: { userId: user.id, handle, isActive: true },
    });
  }

  log(`Created user: ${email} (${role})`);
  return user;
}

/* ─────────────────────────── main ────────────────────────────── */

async function main() {
  log("Starting seed...");

  /* ── 1. Super Admin ── */
  const superAdmin = await createUser(
    "superadmin@soulspace.test",
    "SuperAdmin@123",
    "Super Admin",
    UserRole.SUPER_ADMIN
  );

  /* ── 2. Admin ── */
  const admin = await createUser(
    "admin@soulspace.test",
    "Admin@123456",
    "Platform Admin",
    UserRole.ADMIN
  );

  /* ── 3. Regular Users ── */
  const user1 = await createUser(
    "alice@soulspace.test",
    "User@123456",
    "Alice Chen",
    UserRole.USER
  );

  const user2 = await createUser(
    "bob@soulspace.test",
    "User@123456",
    "Bob Martinez",
    UserRole.USER
  );

  const user3 = await createUser(
    "carol@soulspace.test",
    "User@123456",
    "Carol Williams",
    UserRole.USER
  );

  /* ── 4. Consultant Users ── */
  const consultantUser1 = await createUser(
    "dr.james@soulspace.test",
    "Consult@123456",
    "Dr. James Foster",
    UserRole.CONSULTANT
  );

  const consultantUser2 = await createUser(
    "dr.sarah@soulspace.test",
    "Consult@123456",
    "Dr. Sarah Kim",
    UserRole.CONSULTANT
  );

  /* ── 5. Consultant Profiles ── */
  async function ensureConsultant(userId: string, data: object) {
    const existing = await prisma.consultant.findUnique({ where: { userId } });
    if (existing) {
      log(`Consultant profile already exists for userId: ${userId} — skipping`);
      return existing;
    }
    const c = await prisma.consultant.create({ data: { userId, ...data } as any });
    log(`Created consultant profile for userId: ${userId}`);
    return c;
  }

  const consultant1 = await ensureConsultant(consultantUser1.id, {
    verificationStatus: VerificationStatus.VERIFIED,
    professionalTitle: "Licensed Clinical Psychologist",
    licenseNumber: "LIC-2024-001",
    bio: "Specializing in anxiety, depression, and trauma therapy with 10+ years of experience.",
    hourlyRate: 120.0,
    yearsExperience: 12,
    specializations: ["Anxiety", "Depression", "PTSD", "CBT"],
    averageRating: 4.8,
    totalSessions: 245,
    isAvailable: true,
  });

  const consultant2 = await ensureConsultant(consultantUser2.id, {
    verificationStatus: VerificationStatus.VERIFIED,
    professionalTitle: "Marriage & Family Therapist",
    licenseNumber: "LIC-2024-002",
    bio: "Helping couples and families build healthier relationships through evidence-based therapy.",
    hourlyRate: 95.0,
    yearsExperience: 7,
    specializations: ["Couples Therapy", "Family Therapy", "Grief", "Communication"],
    averageRating: 4.6,
    totalSessions: 158,
    isAvailable: true,
  });

  /* ── 6. Consultant Availabilities ── */
  async function ensureAvailability(consultantId: string, dayOfWeek: number, startHour: number, endHour: number) {
    const existing = await prisma.consultantAvailability.findFirst({
      where: { consultantId, dayOfWeek },
    });
    if (existing) return existing;

    const base = new Date("2000-01-01T00:00:00Z");
    const startTime = new Date(base);
    startTime.setUTCHours(startHour, 0, 0, 0);
    const endTime = new Date(base);
    endTime.setUTCHours(endHour, 0, 0, 0);

    return prisma.consultantAvailability.create({
      data: { consultantId, dayOfWeek, startTime, endTime, isRecurring: true, isBlocked: false },
    });
  }

  // Dr. James: Mon-Fri 9am-5pm
  for (let d = 1; d <= 5; d++) {
    await ensureAvailability(consultant1.id, d, 9, 17);
  }
  // Dr. Sarah: Mon, Wed, Fri 10am-6pm
  for (const d of [1, 3, 5]) {
    await ensureAvailability(consultant2.id, d, 10, 18);
  }

  /* ── 7. Posts ── */
  async function ensurePost(authorId: string, content: string, visibility: PostVisibility, isAnonymous = false) {
    const existing = await prisma.post.findFirst({ where: { authorId, content } });
    if (existing) return existing;
    const post = await prisma.post.create({
      data: { authorId, content, status: PostStatus.ACTIVE, isAnonymous, visibleTo: visibility },
    });
    log(`Created post by ${authorId}`);
    return post;
  }

  const nickname1 = await prisma.nickname.findUnique({ where: { userId: user1.id } });
  const nickname2 = await prisma.nickname.findUnique({ where: { userId: user2.id } });
  const nickname3 = await prisma.nickname.findUnique({ where: { userId: user3.id } });

  const post1 = await ensurePost(
    user1.id,
    "Been struggling with anxiety at work lately. Anyone else dealing with imposter syndrome? Some days I feel completely overwhelmed and like I don't belong here.",
    PostVisibility.PUBLIC,
    false
  );

  const post2 = await ensurePost(
    user2.id,
    "Had my first therapy session today and I'm feeling cautiously optimistic. It's scary to be vulnerable but I think it's worth it.",
    PostVisibility.PUBLIC,
    false
  );

  const post3 = await ensurePost(
    user3.id,
    "Anonymous post: Going through a really rough breakup. Three years together and now... nothing. How do you rebuild yourself after losing someone who was such a big part of your identity?",
    PostVisibility.PUBLIC,
    true
  );

  const post4 = await ensurePost(
    user1.id,
    "Celebrating small wins today — managed to get out of bed before 8am for the first time in weeks. Progress is progress.",
    PostVisibility.CONSULTANTS_ONLY,
    false
  );

  const post5 = await ensurePost(
    user2.id,
    "Mindfulness tip that helped me: 5-4-3-2-1 grounding technique. Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Brought me back from a panic attack last night.",
    PostVisibility.PUBLIC,
    false
  );

  // A post under review
  const post6 = await (async () => {
    const existing = await prisma.post.findFirst({ where: { authorId: user3.id, status: PostStatus.UNDER_REVIEW } });
    if (existing) return existing;
    return prisma.post.create({
      data: {
        authorId: user3.id,
        content: "This post was flagged for moderation review.",
        status: PostStatus.UNDER_REVIEW,
        isAnonymous: false,
        visibleTo: PostVisibility.PUBLIC,
      },
    });
  })();

  /* ── 8. Comments ── */
  async function ensureComment(postId: string, authorId: string, content: string, isConsultantReply = false) {
    const existing = await prisma.comment.findFirst({ where: { postId, authorId, content } });
    if (existing) return existing;
    const comment = await prisma.comment.create({
      data: { postId, authorId, content, isConsultantReply, status: CommentStatus.ACTIVE },
    });
    return comment;
  }

  const comment1 = await ensureComment(
    post1.id, user2.id,
    "You're definitely not alone in this. Imposter syndrome is incredibly common, especially in high-pressure environments. Have you considered talking to a professional about it?"
  );

  const comment2 = await ensureComment(
    post1.id, consultantUser1.id,
    "As a psychologist, I see this frequently. What you're describing is textbook imposter syndrome. A few CBT techniques can help rewire those thought patterns. Feel free to reach out!",
    true
  );

  const comment3 = await ensureComment(
    post2.id, user1.id,
    "So proud of you for taking that step! It does get easier. The first session is always the hardest."
  );

  const comment4 = await ensureComment(
    post3.id, user1.id,
    "Sending you so much love. Breakups are genuinely grief. Give yourself permission to grieve."
  );

  const comment5 = await ensureComment(
    post3.id, consultantUser2.id,
    "Identity enmeshment in relationships is very real and the recovery process takes time. Be gentle with yourself during this period.",
    true
  );

  // Reply to comment1
  const existingReply = await prisma.comment.findFirst({ where: { parentCommentId: comment1.id, authorId: user1.id } });
  if (!existingReply) {
    await prisma.comment.create({
      data: {
        postId: post1.id,
        authorId: user1.id,
        parentCommentId: comment1.id,
        content: "Thank you, that actually means a lot. I've been thinking about it.",
        isConsultantReply: false,
        status: CommentStatus.ACTIVE,
      },
    });
  }

  /* ── 9. Reactions ── */
  async function ensureReaction(userId: string, postId: string, reactionType: ReactionType) {
    const existing = await prisma.reaction.findUnique({ where: { userId_postId: { userId, postId } } });
    if (existing) return existing;
    return prisma.reaction.create({ data: { userId, postId, reactionType } });
  }

  await ensureReaction(user2.id, post1.id, ReactionType.UPVOTE);
  await ensureReaction(user3.id, post1.id, ReactionType.UPVOTE);
  await ensureReaction(consultantUser1.id, post1.id, ReactionType.UPVOTE);
  await ensureReaction(user1.id, post2.id, ReactionType.UPVOTE);
  await ensureReaction(user3.id, post2.id, ReactionType.UPVOTE);
  await ensureReaction(user1.id, post3.id, ReactionType.UPVOTE);
  await ensureReaction(user2.id, post3.id, ReactionType.UPVOTE);
  await ensureReaction(consultantUser2.id, post3.id, ReactionType.DOWNVOTE);
  await ensureReaction(user3.id, post5.id, ReactionType.UPVOTE);

  log("Reactions seeded");

  /* ── 10. Bookings ── */
  async function ensureBooking(
    clientId: string,
    consultantId: string,
    scheduledAt: Date,
    bookingStatus: BookingStatus,
    paymentStatus: PaymentStatus,
    pricePaid: number
  ) {
    const existing = await prisma.booking.findFirst({
      where: { clientId, consultantId, scheduledAt },
    });
    if (existing) return existing;
    const booking = await prisma.booking.create({
      data: {
        clientId,
        consultantId,
        scheduledAt,
        durationMinutes: 60,
        status: bookingStatus,
        paymentStatus,
        pricePaid,
        meetingLink: "https://meet.google.com/abc-defg-hij",
      },
    });
    log(`Created booking: ${clientId} → ${consultantId} (${bookingStatus})`);
    return booking;
  }

  // Past completed booking
  const booking1 = await ensureBooking(
    user1.id, consultant1.id,
    new Date("2026-04-10T14:00:00Z"),
    BookingStatus.COMPLETED,
    PaymentStatus.PAID,
    120.0
  );

  // Past completed booking
  const booking2 = await ensureBooking(
    user2.id, consultant2.id,
    new Date("2026-04-15T11:00:00Z"),
    BookingStatus.COMPLETED,
    PaymentStatus.PAID,
    95.0
  );

  // Upcoming confirmed booking
  const booking3 = await ensureBooking(
    user3.id, consultant1.id,
    new Date("2026-05-10T10:00:00Z"),
    BookingStatus.CONFIRMED,
    PaymentStatus.PAID,
    120.0
  );

  // Pending booking
  const booking4 = await ensureBooking(
    user1.id, consultant2.id,
    new Date("2026-05-15T15:00:00Z"),
    BookingStatus.PENDING,
    PaymentStatus.PENDING,
    95.0
  );

  // Cancelled booking
  const booking5 = await ensureBooking(
    user2.id, consultant1.id,
    new Date("2026-04-20T09:00:00Z"),
    BookingStatus.CANCELLED,
    PaymentStatus.REFUNDED,
    120.0
  );

  /* ── 11. Reviews ── */
  async function ensureReview(bookingId: string, clientId: string, consultantId: string, rating: number, content: string) {
    const existing = await prisma.review.findUnique({ where: { bookingId } });
    if (existing) return existing;
    const review = await prisma.review.create({
      data: { bookingId, clientId, consultantId, rating, content, isPublic: true },
    });
    log(`Created review for booking: ${bookingId}`);
    return review;
  }

  await ensureReview(
    booking1.id, user1.id, consultant1.id, 5,
    "Dr. Foster was incredibly empathetic and gave me actionable tools for managing my anxiety. I felt heard for the first time in a long while."
  );

  await ensureReview(
    booking2.id, user2.id, consultant2.id, 4,
    "Dr. Kim helped me understand the communication patterns that were causing conflict. Really valuable session."
  );

  /* ── 12. Reports ── */
  async function ensureReport(reporterId: string, postId: string | null, commentId: string | null, reportType: ReportType, reportStatus: ReportStatus) {
    const existing = await prisma.report.findFirst({ where: { reporterId, postId, commentId } });
    if (existing) return existing;
    const report = await prisma.report.create({
      data: { reporterId, postId, commentId, reportType, status: reportStatus, notes: "Automatically seeded report" },
    });
    log(`Created report by ${reporterId}`);
    return report;
  }

  await ensureReport(user1.id, post6.id, null, ReportType.SPAM, ReportStatus.OPEN);
  await ensureReport(user3.id, post6.id, null, ReportType.HARASSMENT, ReportStatus.REVIEWED);
  await ensureReport(user2.id, null, comment1.id, ReportType.MISINFORMATION, ReportStatus.DISMISSED);

  /* ── 13. Consultant Applications ── */
  async function ensureApplication(userId: string, appStatus: ApplicationStatus) {
    const existing = await prisma.consultantApplication.findFirst({ where: { userId } });
    if (existing) return existing;
    const app = await prisma.consultantApplication.create({
      data: {
        userId,
        status: appStatus,
        fullName: (await prisma.user.findUnique({ where: { id: userId } }))?.name ?? "Applicant",
        email: (await prisma.user.findUnique({ where: { id: userId } }))?.email ?? "app@test.com",
        phone: "+1-555-000-1234",
        address: "123 Wellness Ave, Portland, OR 97201",
        age: 35,
        certificationDocumentUrl: "https://res.cloudinary.com/du4swryta/image/upload/v1/sample_cert.pdf",
        paymentIntentId: `pi_seed_${userId}_${Date.now()}`,
        reviewNote: appStatus === ApplicationStatus.REJECTED ? "Insufficient credentials provided." : null,
        reviewedAt: appStatus !== ApplicationStatus.PENDING ? new Date() : null,
        reviewedById: appStatus !== ApplicationStatus.PENDING ? admin.id : null,
      },
    });
    log(`Created consultant application for userId: ${userId} (${appStatus})`);
    return app;
  }

  // Pending application from user3
  await ensureApplication(user3.id, ApplicationStatus.PENDING);

  // Rejected application from user2 (they applied but got rejected)
  // (Use a different "applicant" user so it doesn't conflict with existing consultant users)
  const applicantUser = await createUser(
    "pending.applicant@soulspace.test",
    "Apply@123456",
    "Pending Applicant",
    UserRole.USER
  );
  await ensureApplication(applicantUser.id, ApplicationStatus.PENDING);

  const rejectedUser = await createUser(
    "rejected.applicant@soulspace.test",
    "Apply@123456",
    "Rejected Applicant",
    UserRole.USER
  );
  await ensureApplication(rejectedUser.id, ApplicationStatus.REJECTED);

  /* ── 14. Suspend one user (for admin moderation testing) ── */
  const suspendedUser = await createUser(
    "suspended@soulspace.test",
    "User@123456",
    "Suspended User",
    UserRole.USER
  );

  const existingSuspension = await prisma.userSuspension.findUnique({ where: { userId: suspendedUser.id } });
  if (!existingSuspension) {
    await prisma.userSuspension.create({
      data: {
        userId: suspendedUser.id,
        reason: "Repeated policy violations — spamming the feed.",
        suspensionType: SuspensionType.TEMPORARY,
        expiresAt: new Date("2026-05-20T00:00:00Z"),
      },
    });
    await prisma.user.update({ where: { id: suspendedUser.id }, data: { isActive: false } });
    log("Suspended user seeded");
  }

  /* ── Summary ── */
  log("─────────────────────────────────────────────────────");
  log("Seed complete. Test accounts:");
  log("");
  log("  SUPER ADMIN:  superadmin@soulspace.test  /  SuperAdmin@123");
  log("  ADMIN:        admin@soulspace.test        /  Admin@123456");
  log("  USER 1:       alice@soulspace.test        /  User@123456");
  log("  USER 2:       bob@soulspace.test          /  User@123456");
  log("  USER 3:       carol@soulspace.test        /  User@123456");
  log("  CONSULTANT 1: dr.james@soulspace.test     /  Consult@123456");
  log("  CONSULTANT 2: dr.sarah@soulspace.test     /  Consult@123456");
  log("  SUSPENDED:    suspended@soulspace.test    /  User@123456");
  log("─────────────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("[seed] ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
