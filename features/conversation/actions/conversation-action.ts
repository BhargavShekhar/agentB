"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ConversationListItem = {
    id: string,
    title: string,
    isPinned: boolean,
    isArchived: boolean,
    lastMessageAt: Date,
    createdAt: Date,
    updatedAt: Date
}

async function assertOwnsConversation(conversationId: string, userId: string) {
    try {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId
            }
        });

        if (!conversation) {
            throw new Error("Could not find the conversation");
        }

        return conversation;
    } catch (error) {
        console.log("Could not assert Owns Conversation", error);
        throw error;
    }
}

export async function getConversation(conversationId: string) {
    const user = await requireUser();

    const conversation = assertOwnsConversation(conversationId, user.id);
    return conversation;
}

export async function listConversations(): Promise<ConversationListItem[]> {
    const user = await requireUser();

    const conversations = prisma.conversation.findMany({
        where: {
            userId: user.id,
            isArchived: false
        },
        select: {
            id: true,
            title: true,
            isPinned: true,
            isArchived: true,
            lastMessageAt: true,
            createdAt: true,
            updatedAt: true
        },
        orderBy: {
            lastMessageAt: "desc"
        }
    });

    return conversations;
}

export async function createConversation(title = "New Chat") {
    const user = await requireUser();

    const conversation = prisma.conversation.create({
        data: {
            userId: user.id,
            title: title.trim() || "New Chat"
        }
    });

    return conversation;
}

export async function deleteConversation(conversationId: string) {
    const user = await requireUser();
    await assertOwnsConversation(conversationId, user.id); // to verify conversation exists

    prisma.conversation.delete({
        where: { id: conversationId }
    });

    revalidatePath("/"); // catched data is state, rebuild it on the next request

    return { id: conversationId };
}

export async function updateCoversation(
    conversationId: string,
    data: { title?: string, isPinned?: boolean, isArchived?: boolean }
) {
    const user = await requireUser();
    await assertOwnsConversation(conversationId, user.id); // to verify conversation exists

    const conversation = await prisma.conversation.update({
        where: {
            id: conversationId
        },
        data: {
            ...(data.title !== undefined ? { title: data.title.trim() || "New Chat" } : {}),
            ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
            ...(data.isArchived !== undefined ? { isArchived: data.isArchived } : {})
        }
    });

    revalidatePath("/"); // catched data is state, rebuild it on the next request
    revalidatePath(`/c/${conversationId}`);

    return conversation;
}