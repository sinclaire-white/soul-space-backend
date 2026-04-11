import { z } from "zod";
import { ReactionType } from "../../../generated/prisma/enums";

const createReactionSchema = z.object({
    reactionType: z.nativeEnum(ReactionType, {
        required_error: "Reaction type is required",
        invalid_type_error: "Invalid reaction type",
    }),
});

const reactionTypeSchema = z.object({
    reactionType: z.nativeEnum(ReactionType),
});

export const ReactionValidation = {
    createReactionSchema,
    reactionTypeSchema,
};
