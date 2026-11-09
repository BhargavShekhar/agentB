"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/** 
 * Returns the signed-in app user from our database.
 * Uses auth.protect() so Server Actions reject unauthenticated callers.
*/
export async function requireUser() {
    try {
        const { userId } = await auth.protect();

        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        });

        if (!user) {
            throw new Error("User not Found");
        }

        return user;
    } catch (error) {
        console.error("Could not fetch user", error);
        throw error;
    }
}