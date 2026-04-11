import { UserRole } from "../../../prisma/generated/prisma";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const seedSuperAdmin = async () => {
    try {
        const isSuperAdminExist = await prisma.user.findFirst({
            where: {
                role: UserRole.SUPER_ADMIN
            }
        })

        if (isSuperAdminExist) {
            console.log("Super admin already exists. Skipping seeding super admin.");
            return;
        }

        const superAdminUser = await auth.api.signUpEmail({
            body: {
                email: envVars.SUPER_ADMIN_EMAIL,
                password: envVars.SUPER_ADMIN_PASSWORD,
                name: "Super Admin",
                role: UserRole.SUPER_ADMIN,
                emailVerified: true,
                isActive: true,
            }
        })

        console.log("Super Admin Created:", superAdminUser.user.id);
    } catch (error) {
        console.error("Error seeding super admin: ", error);
    }
}
