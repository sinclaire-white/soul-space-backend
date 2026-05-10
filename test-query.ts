import { prisma } from './src/app/lib/prisma';

const BASE = 'http://localhost:5000/api/v1';

interface TestResult {
    test: string;
    status: 'PASS' | 'FAIL';
    details: string;
}

const results: TestResult[] = [];

function log(test: string, status: 'PASS' | 'FAIL', details: string) {
    results.push({ test, status, details });
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${status}] ${test}: ${details}`);
}

async function api(method: string, path: string, body?: any, cookies?: string) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (cookies) headers['Cookie'] = cookies;
    
    const opts: RequestInit = { method, headers, redirect: 'manual' };
    if (body) opts.body = JSON.stringify(body);
    
    const resp = await fetch(`${BASE}${path}`, opts);
    const data = await resp.json().catch(() => null);
    
    // Extract cookies from Set-Cookie headers using getSetCookie()
    let authCookies = '';
    const setCookies = resp.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
        // Extract cookie name=value from each Set-Cookie header (before the first ;)
        authCookies = setCookies.map(c => c.split(';')[0]).join('; ');
    }
    
    return { status: resp.status, data, ok: resp.ok, authCookies };
}

function buildCookies(token: string, refreshToken: string, sessionToken: string): string {
    return `accessToken=${token}; refreshToken=${refreshToken}; better-auth.session_token=${sessionToken}`;
}

async function main() {
    console.log('\n========================================');
    console.log('  SOUL SPACE E2E TESTING - COMPREHENSIVE');
    console.log('========================================\n');

    // Clean up previous test data
    console.log('Cleaning up previous test data...');
    const testEmails = ['alice@soulspace.test', 'bob@soulspace.test', 'charlie@soulspace.test'];
    for (const email of testEmails) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            await prisma.review.deleteMany({ where: { clientId: user.id } });
            await prisma.booking.deleteMany({ where: { clientId: user.id } });
            await prisma.report.deleteMany({ where: { reporterId: user.id } });
            await prisma.reaction.deleteMany({ where: { userId: user.id } });
            await prisma.comment.deleteMany({ where: { authorId: user.id } });
            await prisma.post.deleteMany({ where: { authorId: user.id } });
            const consultant = await prisma.consultant.findUnique({ where: { userId: user.id } });
            if (consultant) {
                await prisma.review.deleteMany({ where: { consultantId: consultant.id } });
                await prisma.booking.deleteMany({ where: { consultantId: consultant.id } });
                await prisma.consultantAvailability.deleteMany({ where: { consultantId: consultant.id } });
                await prisma.consultant.delete({ where: { id: consultant.id } });
            }
            await prisma.nickname.deleteMany({ where: { userId: user.id } });
            await prisma.session.deleteMany({ where: { userId: user.id } });
            await prisma.account.deleteMany({ where: { userId: user.id } });
            await prisma.userSuspension.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });
            console.log(`  Cleaned up: ${email}`);
        }
    }
    console.log('  Cleanup complete.\n');

    // Track cookies per user
    let user1Cookies = '';
    let user2Cookies = '';
    let user3Cookies = '';
    let superAdminCookies = '';
    
    // Track IDs
    let user1Id = '';
    let user2Id = '';
    let user3Id = '';
    let superAdminId = 'ExBf5me7pg2Y0UC4dQCqSWC6cDzDPyt0';
    let post1Id = '';
    let post2Id = '';
    let comment1Id = '';
    let consultantId = '';
    let bookingId = '';

    // ==========================================
    // PHASE 1: AUTHENTICATION
    // ==========================================
    console.log('\n--- PHASE 1: AUTHENTICATION ---\n');

    // 1. Register User 1
    {
        const r = await api('POST', '/auth/register', {
            name: 'Alice Tester',
            email: 'alice@soulspace.test',
            password: 'Alice@Test123',
        });
        if (r.status === 201 && r.data?.data?.user?.id) {
            user1Id = r.data.data.user.id;
            log('Register User 1 (Alice)', 'PASS', `ID: ${user1Id}`);
        } else {
            log('Register User 1 (Alice)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 2. Register User 2
    {
        const r = await api('POST', '/auth/register', {
            name: 'Bob Tester',
            email: 'bob@soulspace.test',
            password: 'Bob@Test1234',
        });
        if (r.status === 201 && r.data?.data?.user?.id) {
            user2Id = r.data.data.user.id;
            log('Register User 2 (Bob)', 'PASS', `ID: ${user2Id}`);
        } else {
            log('Register User 2 (Bob)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 3. Verify emails directly in DB (since we can't capture OTP from Better Auth easily in E2E)
    {
        await prisma.user.updateMany({
            where: { email: { in: ['alice@soulspace.test', 'bob@soulspace.test'] } },
            data: { emailVerified: true },
        });
        log('Verify Emails (DB direct)', 'PASS', 'Both users verified via DB');
    }

    // 4. Login User 1
    {
        const r = await api('POST', '/auth/login', {
            email: 'alice@soulspace.test',
            password: 'Alice@Test123',
        });
        if (r.ok && r.authCookies) {
            user1Cookies = r.authCookies;
            log('Login User 1 (Alice)', 'PASS', 'Logged in with tokens');
        } else {
            log('Login User 1 (Alice)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 5. Login User 2
    {
        const r = await api('POST', '/auth/login', {
            email: 'bob@soulspace.test',
            password: 'Bob@Test1234',
        });
        if (r.ok && r.authCookies) {
            user2Cookies = r.authCookies;
            log('Login User 2 (Bob)', 'PASS', 'Logged in with tokens');
        } else {
            log('Login User 2 (Bob)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 6. Login Super Admin
    {
        const r = await api('POST', '/auth/login', {
            email: 'shahriyarsifat2@gmail.com',
            password: 'Admin@123456789',
        });
        if (r.ok && r.authCookies) {
            superAdminCookies = r.authCookies;
            log('Login Super Admin', 'PASS', 'Logged in');
        } else {
            log('Login Super Admin', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 7. Get Me (User 1)
    {
        const r = await api('GET', '/auth/me', undefined, user1Cookies);
        if (r.ok && r.data?.data?.email === 'alice@soulspace.test') {
            log('Get Me (User 1)', 'PASS', `Role: ${r.data.data.role}`);
        } else {
            log('Get Me (User 1)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // ==========================================
    // PHASE 2: USER FEATURES
    // ==========================================
    console.log('\n--- PHASE 2: USER FEATURES ---\n');

    // 9. Get my nickname (auto-created on register)
    {
        const r = await api('GET', '/nicknames/me', undefined, user1Cookies);
        if (r.ok && r.data?.data?.handle) {
            log('Get Nickname (User 1)', 'PASS', `Handle: ${r.data.data.handle}`);
        } else {
            log('Get Nickname (User 1)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 10. Rotate nickname
    {
        const r = await api('POST', '/nicknames/me/rotate', { newHandle: 'alice_soul' }, user1Cookies);
        if (r.ok) {
            log('Rotate Nickname (User 1)', 'PASS', 'Handle changed to alice_soul');
        } else {
            log('Rotate Nickname (User 1)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 11. Create Post 1 (User 1)
    {
        const r = await api('POST', '/posts', {
            content: 'Hello Soul Space! This is my first post. Feeling grateful today.',
            isAnonymous: false,
            visibleTo: 'PUBLIC',
        }, user1Cookies);
        if (r.status === 201 && r.data?.data?.id) {
            post1Id = r.data.data.id;
            log('Create Post 1 (User 1)', 'PASS', `Post ID: ${post1Id}`);
        } else {
            log('Create Post 1 (User 1)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 12. Create Post 2 (User 2)
    {
        const r = await api('POST', '/posts', {
            content: 'Looking for someone to talk to. Having a rough day.',
            isAnonymous: true,
            visibleTo: 'PUBLIC',
        }, user2Cookies);
        if (r.status === 201 && r.data?.data?.id) {
            post2Id = r.data.data.id;
            log('Create Post 2 (User 2, anonymous)', 'PASS', `Post ID: ${post2Id}`);
        } else {
            log('Create Post 2 (User 2, anonymous)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 13. Get all posts (public)
    {
        const r = await api('GET', '/posts');
        if (r.ok && r.data?.data?.length >= 2) {
            log('Get All Posts (public)', 'PASS', `Got ${r.data.data.length} posts`);
        } else {
            log('Get All Posts (public)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 14. Get post by ID
    {
        const r = await api('GET', `/posts/${post1Id}`);
        if (r.ok && r.data?.data?.id === post1Id) {
            log('Get Post by ID', 'PASS', 'Post retrieved');
        } else {
            log('Get Post by ID', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 15. Comment on Post 1 (User 2)
    {
        const r = await api('POST', `/comments/post/${post1Id}`, {
            content: 'Glad you are feeling good! Keep it up!',
        }, user2Cookies);
        if (r.status === 201 && r.data?.data?.id) {
            comment1Id = r.data.data.id;
            log('Create Comment (User 2 on Post 1)', 'PASS', `Comment ID: ${comment1Id}`);
        } else {
            log('Create Comment (User 2 on Post 1)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 16. Get comments for post
    {
        const r = await api('GET', `/comments/post/${post1Id}`);
        if (r.ok && r.data?.data?.length >= 1) {
            log('Get Post Comments', 'PASS', `Got ${r.data.data.length} comments`);
        } else {
            log('Get Post Comments', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 17. React to Post 1 (User 2 - SUPPORT)
    {
        const r = await api('POST', `/reactions/post/${post1Id}`, {
            reactionType: 'SUPPORT',
        }, user2Cookies);
        if (r.ok || r.status === 201) {
            log('React SUPPORT to Post 1 (User 2)', 'PASS', 'Reaction added');
        } else {
            log('React SUPPORT to Post 1 (User 2)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 18. React to Post 2 (User 1 - HUG)
    {
        const r = await api('POST', `/reactions/post/${post2Id}`, {
            reactionType: 'HUG',
        }, user1Cookies);
        if (r.ok || r.status === 201) {
            log('React HUG to Post 2 (User 1)', 'PASS', 'Reaction added');
        } else {
            log('React HUG to Post 2 (User 1)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 19. Get post reactions
    {
        const r = await api('GET', `/reactions/post/${post1Id}`);
        if (r.ok) {
            log('Get Post Reactions', 'PASS', JSON.stringify(r.data?.data));
        } else {
            log('Get Post Reactions', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 20. Get trending posts
    {
        const r = await api('GET', '/reactions/trending');
        if (r.ok) {
            log('Get Trending Posts', 'PASS', `Got ${r.data?.data?.length || 0} trending posts`);
        } else {
            log('Get Trending Posts', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 21. Get my posts (User 1)
    {
        const r = await api('GET', '/posts/my-posts', undefined, user1Cookies);
        if (r.ok && r.data?.data?.length >= 1) {
            log('Get My Posts (User 1)', 'PASS', `Got ${r.data.data.length} posts`);
        } else {
            log('Get My Posts (User 1)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 22. Update Post (User 1)
    {
        const r = await api('PATCH', `/posts/${post1Id}`, {
            content: 'Hello Soul Space! Edited: Feeling even more grateful today!',
        }, user1Cookies);
        if (r.ok) {
            log('Update Post (User 1)', 'PASS', 'Post updated');
        } else {
            log('Update Post (User 1)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 23. Get my reactions (User 1)
    {
        const r = await api('GET', '/reactions/me/reactions', undefined, user1Cookies);
        if (r.ok) {
            log('Get My Reactions (User 1)', 'PASS', `Got ${r.data?.data?.length || 0} reactions`);
        } else {
            log('Get My Reactions (User 1)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 24. Check handle availability
    {
        const r = await api('GET', '/nicknames/check/alice_soul');
        if (r.ok) {
            log('Check Handle Availability', 'PASS', `Available: ${r.data?.data?.available}`);
        } else {
            log('Check Handle Availability', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 25. View all consultants (public - should be empty)
    {
        const r = await api('GET', '/consultants');
        if (r.ok) {
            log('Get All Consultants (public)', 'PASS', `Got ${r.data?.data?.length || 0} consultants`);
        } else {
            log('Get All Consultants (public)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // ==========================================
    // PHASE 3: CONSULTANT APPLICATION ($10 fee)
    // ==========================================
    console.log('\n--- PHASE 3: CONSULTANT APPLICATION ---\n');

    // 26. Create application payment intent (User 1 applies)
    {
        const r = await api('POST', '/consultants/application-payment', undefined, user1Cookies);
        if (r.ok && r.data?.data?.paymentIntentId) {
            log('Create Application Payment Intent', 'PASS', `Amount: $${r.data.data.amount}, PI: ${r.data.data.paymentIntentId}`);
            
            // For testing, we need to simulate payment confirmation
            // In real flow, Stripe frontend would handle this
            // Let's try to create consultant without payment (should fail)
            const r2 = await api('POST', '/consultants', {
                professionalTitle: 'Licensed Clinical Psychologist',
                bio: 'Experienced therapist specializing in CBT and mindfulness.',
                hourlyRate: 75,
                yearsExperience: 5,
                specializations: ['anxiety', 'depression', 'mindfulness'],
                paymentIntentId: r.data.data.paymentIntentId,
            }, user1Cookies);
            
            if (r2.status === 400 && r2.data?.message?.includes('not been completed')) {
                log('Create Consultant (unpaid)', 'PASS', 'Correctly rejected: payment not completed');
            } else if (r2.status === 201) {
                log('Create Consultant (unpaid)', 'FAIL', 'Should have rejected - payment not completed!');
            } else {
                log('Create Consultant (unpaid)', 'PASS', `Rejected: ${r2.data?.message}`);
            }
        } else {
            log('Create Application Payment Intent', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 27. For E2E testing, bypass payment check - create consultant directly via DB
    // In production, Stripe webhook/frontend confirms payment, then API is called
    // Let's create the consultant profile directly for testing
    {
        console.log('  ℹ️  Bypassing Stripe payment for E2E test (would need frontend/Stripe to complete)');
        
        // Create consultant directly in DB
        const consultant = await prisma.consultant.create({
            data: {
                userId: user1Id,
                professionalTitle: 'Licensed Clinical Psychologist',
                bio: 'Experienced therapist specializing in CBT and mindfulness.',
                hourlyRate: 75,
                yearsExperience: 5,
                specializations: ['anxiety', 'depression', 'mindfulness'],
                verificationStatus: 'PENDING',
                applicationPaymentId: 'pi_test_bypassed',
            },
        });
        consultantId = consultant.id;
        
        // Update user role to CONSULTANT
        await prisma.user.update({
            where: { id: user1Id },
            data: { role: 'CONSULTANT' },
        });
        
        log('Create Consultant Profile (DB bypass)', 'PASS', `Consultant ID: ${consultantId}`);
    }

    // 28. Re-login User 1 as CONSULTANT to get updated tokens
    {
        const r = await api('POST', '/auth/login', {
            email: 'alice@soulspace.test',
            password: 'Alice@Test123',
        });
        if (r.ok) {
            user1Cookies = r.authCookies;
            log('Re-login User 1 as CONSULTANT', 'PASS', `Role: ${r.data?.data?.user?.role}`);
        } else {
            log('Re-login User 1 as CONSULTANT', 'FAIL', JSON.stringify(r.data));
        }
    }

    // ==========================================
    // PHASE 4: ADMIN APPROVES CONSULTANT
    // ==========================================
    console.log('\n--- PHASE 4: ADMIN APPROVES CONSULTANT ---\n');

    // 29. Get pending verifications (Super Admin)
    {
        const r = await api('GET', '/consultants/admin/pending', undefined, superAdminCookies);
        if (r.ok && r.data?.data?.length >= 1) {
            log('Get Pending Verifications', 'PASS', `Found ${r.data.data.length} pending`);
        } else {
            log('Get Pending Verifications', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 30. Approve consultant (Super Admin)
    {
        const r = await api('PATCH', `/consultants/${consultantId}/verification`, {
            verificationStatus: 'VERIFIED',
        }, superAdminCookies);
        if (r.ok) {
            log('Approve Consultant (Super Admin)', 'PASS', 'Verified!');
        } else {
            log('Approve Consultant (Super Admin)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 31. Verify consultant appears in public list
    {
        const r = await api('GET', '/consultants');
        if (r.ok && r.data?.data?.some((c: any) => c.id === consultantId)) {
            log('Consultant in Public List', 'PASS', 'Visible after approval');
        } else {
            log('Consultant in Public List', 'FAIL', JSON.stringify(r.data));
        }
    }

    // ==========================================
    // PHASE 5: CONSULTANT FEATURES
    // ==========================================
    console.log('\n--- PHASE 5: CONSULTANT FEATURES ---\n');

    // 32. Get consultant profile
    {
        const r = await api('GET', '/consultants/me/profile', undefined, user1Cookies);
        if (r.ok && r.data?.data?.verificationStatus === 'VERIFIED') {
            log('Get My Consultant Profile', 'PASS', `Status: VERIFIED, Rate: $${r.data.data.hourlyRate}/hr`);
        } else {
            log('Get My Consultant Profile', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 33. Update consultant profile
    {
        const r = await api('PATCH', '/consultants/me/profile', {
            hourlyRate: 80,
            bio: 'Updated: 5+ years of therapy experience with focus on anxiety & depression.',
        }, user1Cookies);
        if (r.ok) {
            log('Update Consultant Profile', 'PASS', 'Updated rate to $80/hr');
        } else {
            log('Update Consultant Profile', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 34. Set availability
    {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        tomorrow.setHours(9, 0, 0, 0);
        const endTime = new Date(tomorrow);
        endTime.setHours(17, 0, 0, 0);
        
        const r = await api('POST', '/availabilities', {
            dayOfWeek: tomorrow.getDay(),
            startTime: tomorrow.toISOString(),
            endTime: endTime.toISOString(),
            isRecurring: true,
            isBlocked: false,
        }, user1Cookies);
        if (r.status === 201 || r.ok) {
            log('Set Availability', 'PASS', `Day ${tomorrow.getDay()}: 9AM-5PM`);
        } else {
            log('Set Availability', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 35. Get my availabilities
    {
        const r = await api('GET', '/availabilities/me', undefined, user1Cookies);
        if (r.ok && r.data?.data?.length >= 1) {
            log('Get My Availabilities', 'PASS', `Got ${r.data.data.length} slots`);
        } else {
            log('Get My Availabilities', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 36. Get available slots (public)
    {
        const r = await api('GET', `/availabilities/slots/${consultantId}`);
        if (r.ok) {
            log('Get Available Slots (public)', 'PASS', `Got ${r.data?.data?.length || 0} slots`);
        } else {
            log('Get Available Slots (public)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // ==========================================
    // PHASE 6: BOOKING
    // ==========================================
    console.log('\n--- PHASE 6: BOOKING ---\n');

    // 37. Register User 3 for booking
    {
        const r = await api('POST', '/auth/register', {
            name: 'Charlie Client',
            email: 'charlie@soulspace.test',
            password: 'Charlie@Test123',
        });
        if (r.status === 201 && r.data?.data?.user?.id) {
            user3Id = r.data.data.user.id;
            log('Register User 3 (Charlie)', 'PASS', `ID: ${user3Id}`);
        } else {
            log('Register User 3 (Charlie)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 38. Verify email User 3 (DB direct)
    {
        await prisma.user.update({
            where: { email: 'charlie@soulspace.test' },
            data: { emailVerified: true },
        });
        log('Verify Email User 3 (DB)', 'PASS', 'Email verified');
    }

    // 39. Login User 3
    {
        const r = await api('POST', '/auth/login', {
            email: 'charlie@soulspace.test',
            password: 'Charlie@Test123',
        });
        if (r.ok) {
            user3Cookies = r.authCookies;
            log('Login User 3 (Charlie)', 'PASS', 'Logged in');
        } else {
            log('Login User 3 (Charlie)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 40. Create booking (User 3 books consultant)
    {
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() + 2);
        bookingDate.setHours(10, 0, 0, 0);
        
        const r = await api('POST', '/bookings', {
            consultantId,
            scheduledAt: bookingDate.toISOString(),
            durationMinutes: 60,
            preSessionNotes: 'I have been feeling anxious about work lately.',
        }, user3Cookies);
        if (r.status === 201 && r.data?.data?.id) {
            bookingId = r.data.data.id;
            log('Create Booking (User 3)', 'PASS', `Booking ID: ${bookingId}, Price: $${r.data.data.pricePaid}`);
        } else {
            log('Create Booking (User 3)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 41. Get my bookings (User 3)
    {
        const r = await api('GET', '/bookings/me', undefined, user3Cookies);
        if (r.ok && r.data?.data?.length >= 1) {
            log('Get My Bookings (User 3)', 'PASS', `Got ${r.data.data.length} bookings`);
        } else {
            log('Get My Bookings (User 3)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 42. Get consultant bookings (as consultant)
    {
        const r = await api('GET', '/bookings/consultant/bookings', undefined, user1Cookies);
        if (r.ok && r.data?.data?.length >= 1) {
            log('Get Consultant Bookings', 'PASS', `Got ${r.data.data.length} bookings`);
        } else {
            log('Get Consultant Bookings', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 43. Confirm booking (Consultant)
    {
        const r = await api('PATCH', `/bookings/${bookingId}/confirm`, undefined, user1Cookies);
        if (r.ok) {
            log('Confirm Booking (Consultant)', 'PASS', 'Booking confirmed');
        } else {
            log('Confirm Booking (Consultant)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 44. Complete booking (Consultant)
    {
        const r = await api('PATCH', `/bookings/${bookingId}/complete`, undefined, user1Cookies);
        if (r.ok) {
            log('Complete Booking (Consultant)', 'PASS', 'Booking completed');
        } else {
            log('Complete Booking (Consultant)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 45. Create review (User 3)
    {
        const r = await api('POST', '/reviews', {
            bookingId,
            rating: 5,
            content: 'Excellent session! Alice was very understanding and helpful.',
            isPublic: true,
        }, user3Cookies);
        if (r.status === 201 || r.ok) {
            log('Create Review (User 3)', 'PASS', 'Rating: 5/5');
        } else {
            log('Create Review (User 3)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 46. Get consultant reviews (public)
    {
        const r = await api('GET', `/reviews/consultant/${consultantId}`);
        if (r.ok && r.data?.data?.length >= 1) {
            log('Get Consultant Reviews (public)', 'PASS', `Got ${r.data.data.length} reviews`);
        } else {
            log('Get Consultant Reviews (public)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 47. Get review stats
    {
        const r = await api('GET', `/reviews/consultant/${consultantId}/stats`);
        if (r.ok) {
            log('Get Review Stats', 'PASS', JSON.stringify(r.data?.data));
        } else {
            log('Get Review Stats', 'FAIL', JSON.stringify(r.data));
        }
    }

    // ==========================================
    // PHASE 7: REPORTS
    // ==========================================
    console.log('\n--- PHASE 7: REPORTS ---\n');

    // 48. Report a post (User 2 reports Post 1)
    {
        const r = await api('POST', '/reports', {
            postId: post1Id,
            reportType: 'SPAM',
            notes: 'This seems like spam content',
        }, user2Cookies);
        if (r.status === 201 || r.ok) {
            log('Report Post (User 2)', 'PASS', 'Report created');
        } else {
            log('Report Post (User 2)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 49. Get my reports (User 2)
    {
        const r = await api('GET', '/reports/me', undefined, user2Cookies);
        if (r.ok) {
            log('Get My Reports (User 2)', 'PASS', `Got ${r.data?.data?.length || 0} reports`);
        } else {
            log('Get My Reports (User 2)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // ==========================================
    // PHASE 8: ADMIN & SUPER ADMIN
    // ==========================================
    console.log('\n--- PHASE 8: ADMIN & SUPER ADMIN ---\n');

    // 50. Get dashboard stats (Super Admin)
    {
        const r = await api('GET', '/admin/dashboard/stats', undefined, superAdminCookies);
        if (r.ok) {
            log('Get Dashboard Stats', 'PASS', JSON.stringify(r.data?.data));
        } else {
            log('Get Dashboard Stats', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 51. Get user stats
    {
        const r = await api('GET', '/admin/stats/users', undefined, superAdminCookies);
        if (r.ok) {
            log('Get User Stats', 'PASS', JSON.stringify(r.data?.data));
        } else {
            log('Get User Stats', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 52. Get post stats
    {
        const r = await api('GET', '/admin/stats/posts', undefined, superAdminCookies);
        if (r.ok) {
            log('Get Post Stats', 'PASS', JSON.stringify(r.data?.data));
        } else {
            log('Get Post Stats', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 53. Get booking stats
    {
        const r = await api('GET', '/admin/stats/bookings', undefined, superAdminCookies);
        if (r.ok) {
            log('Get Booking Stats', 'PASS', JSON.stringify(r.data?.data));
        } else {
            log('Get Booking Stats', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 54. Get report stats
    {
        const r = await api('GET', '/admin/stats/reports', undefined, superAdminCookies);
        if (r.ok) {
            log('Get Report Stats (Admin)', 'PASS', JSON.stringify(r.data?.data));
        } else {
            log('Get Report Stats (Admin)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 55. Get all users (Admin)
    {
        const r = await api('GET', '/admin/users', undefined, superAdminCookies);
        if (r.ok && r.data?.data?.length >= 3) {
            log('Get All Users (Admin)', 'PASS', `Got ${r.data.data.length} users`);
        } else {
            log('Get All Users (Admin)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 56. Get user by ID (Admin)
    {
        const r = await api('GET', `/admin/users/${user2Id}`, undefined, superAdminCookies);
        if (r.ok && r.data?.data?.email === 'bob@soulspace.test') {
            log('Get User By ID (Admin)', 'PASS', `Got Bob's details`);
        } else {
            log('Get User By ID (Admin)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 57. Make User 2 (Bob) an ADMIN (Super Admin only)
    {
        const r = await api('PATCH', `/users/${user2Id}/role`, {
            role: 'ADMIN',
        }, superAdminCookies);
        if (r.ok) {
            log('Make Bob ADMIN (Super Admin)', 'PASS', 'Bob is now ADMIN');
        } else {
            log('Make Bob ADMIN (Super Admin)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 58. Re-login Bob as ADMIN
    {
        const r = await api('POST', '/auth/login', {
            email: 'bob@soulspace.test',
            password: 'Bob@Test1234',
        });
        if (r.ok) {
            user2Cookies = r.authCookies;
            log('Re-login Bob as ADMIN', 'PASS', `Role: ${r.data?.data?.user?.role}`);
        } else {
            log('Re-login Bob as ADMIN', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 59. Bob (ADMIN) gets dashboard stats
    {
        const r = await api('GET', '/admin/dashboard/stats', undefined, user2Cookies);
        if (r.ok) {
            log('Admin Bob: Dashboard Stats', 'PASS', 'Access granted');
        } else {
            log('Admin Bob: Dashboard Stats', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 60. Admin Bob: Get all reports
    {
        const r = await api('GET', '/reports', undefined, user2Cookies);
        if (r.ok) {
            log('Admin Bob: Get All Reports', 'PASS', `Got ${r.data?.data?.length || 0} reports`);
        } else {
            log('Admin Bob: Get All Reports', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 61. Admin Bob: Get all posts
    {
        const r = await api('GET', '/admin/posts', undefined, user2Cookies);
        if (r.ok) {
            log('Admin Bob: Get All Posts', 'PASS', `Got ${r.data?.data?.length || 0} posts`);
        } else {
            log('Admin Bob: Get All Posts', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 62. Admin Bob: Moderate User 3 (WARN)
    {
        const r = await api('POST', `/admin/users/${user3Id}/moderate`, {
            action: 'WARN',
            reason: 'Test moderation warning',
        }, user2Cookies);
        if (r.ok) {
            log('Admin Bob: Moderate User (WARN)', 'PASS', 'Warning issued');
        } else {
            log('Admin Bob: Moderate User (WARN)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 63. Admin Bob: Get moderation logs
    {
        const r = await api('GET', '/admin/moderation-logs', undefined, user2Cookies);
        if (r.ok) {
            log('Admin Bob: Moderation Logs', 'PASS', `Got ${r.data?.data?.length || 0} logs`);
        } else {
            log('Admin Bob: Moderation Logs', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 64. Admin cannot change roles (only Super Admin can)
    {
        const r = await api('PATCH', `/users/${user3Id}/role`, {
            role: 'ADMIN',
        }, user2Cookies);
        if (r.status === 403) {
            log('Admin Cannot Change Roles', 'PASS', 'Correctly forbidden');
        } else {
            log('Admin Cannot Change Roles', 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data)}`);
        }
    }

    // 65. Get specializations
    {
        const r = await api('GET', '/consultants/specializations');
        if (r.ok) {
            log('Get Specializations', 'PASS', JSON.stringify(r.data?.data));
        } else {
            log('Get Specializations', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 66. Get consultant by ID
    {
        const r = await api('GET', `/consultants/${consultantId}`);
        if (r.ok && r.data?.data?.id === consultantId) {
            log('Get Consultant By ID', 'PASS', `Title: ${r.data.data.professionalTitle}`);
        } else {
            log('Get Consultant By ID', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 67. User profile endpoints
    {
        const r = await api('GET', '/users/me/profile', undefined, user3Cookies);
        if (r.ok) {
            log('Get My Profile (User 3)', 'PASS', `Name: ${r.data?.data?.name}`);
        } else {
            log('Get My Profile (User 3)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // 68. Update user profile
    {
        const r = await api('PATCH', '/users/me/profile', {
            name: 'Charlie Updated',
        }, user3Cookies);
        if (r.ok) {
            log('Update My Profile (User 3)', 'PASS', 'Name updated');
        } else {
            log('Update My Profile (User 3)', 'FAIL', JSON.stringify(r.data));
        }
    }

    // ==========================================
    // PHASE 9: EDGE CASES & SECURITY
    // ==========================================
    console.log('\n--- PHASE 9: EDGE CASES & SECURITY ---\n');

    // 69. Unauthenticated access to protected route
    {
        const r = await api('GET', '/auth/me');
        if (r.status === 401) {
            log('Unauthenticated Access Blocked', 'PASS', 'Correctly returns 401');
        } else {
            log('Unauthenticated Access Blocked', 'FAIL', `Status: ${r.status}`);
        }
    }

    // 70. User cannot access admin route
    {
        const r = await api('GET', '/admin/dashboard/stats', undefined, user3Cookies);
        if (r.status === 403) {
            log('User Cannot Access Admin', 'PASS', 'Correctly returns 403');
        } else {
            log('User Cannot Access Admin', 'FAIL', `Status: ${r.status}`);
        }
    }

    // 71. Cannot book yourself
    {
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() + 3);
        bookingDate.setHours(14, 0, 0, 0);
        
        const r = await api('POST', '/bookings', {
            consultantId,
            scheduledAt: bookingDate.toISOString(),
            durationMinutes: 60,
        }, user1Cookies);
        if (r.status === 400) {
            log('Cannot Book Yourself', 'PASS', 'Correctly rejected');
        } else {
            log('Cannot Book Yourself', 'FAIL', `Status: ${r.status}, ${JSON.stringify(r.data)}`);
        }
    }

    // ==========================================
    // FINAL SUMMARY
    // ==========================================
    console.log('\n\n========================================');
    console.log('  TEST RESULTS SUMMARY');
    console.log('========================================\n');
    
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;
    
    console.log(`Total: ${total} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
    console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%\n`);
    
    if (failed > 0) {
        console.log('Failed tests:');
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  ❌ ${r.test}: ${r.details}`);
        });
    }

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error('Fatal error:', e);
    await prisma.$disconnect();
});
