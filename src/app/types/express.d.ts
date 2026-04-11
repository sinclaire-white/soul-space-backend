/* eslint-disable @typescript-eslint/no-unused-vars */
import { UserRole } from "../../generated/prisma";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: UserRole;
            };
        }
    }
}
