import { z } from "zod";
import { ReactionType } from "../../../../prisma/generated/prisma/enums";

const createReactionSchema = z.object({
    reactionType: z.nativeEnum(ReactionType),
});

export const ReactionValidation = {
    createReactionSchema,
};
