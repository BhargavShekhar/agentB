"use server";

import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function requireUser() {
    try {
        const { userId } = await auth.protect();

        const user = await prisma.user.findUnique({
            where: { id: userId }
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