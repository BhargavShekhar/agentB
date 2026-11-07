import { MessageRole, MessageStatus } from "@/app/generated/prisma/enums";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type MessageItem = {
    id: string,
    conversationId: string,
    role: MessageRole,
    status: MessageStatus,
    content: string,
    createdAt: Date,
    updatedAt: Date
};

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

/** Load messages for the conversation (oldest -> newest) */
export async function listMessages(conversationId: string): Promise<MessageItem[]> {
    const user = await requireUser();
    assertOwnsConversation(conversationId, user.id);

    const messages = prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            conversationId: true,
            role: true,
            status: true,
            content: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return messages;
}

/**
 * Create a user message in conversation
 * No AI reply yet this only persist the user's text
 * Optionally renames "New Chat" using first message
 */
export async function createMessage(conversationId: string, content: string) {
    const user = await requireUser();
    const conversation = await assertOwnsConversation(conversationId, user.id);

    const trimmed = content.trim();

    if (!trimmed) {
        throw new Error("Message can not be empty");
    }

    const message = await prisma.message.create({
        data: {
            conversationId,
            role: "USER",
            status: "COMPLETE",
            content: trimmed,
        }
    });

    const shoudlRename = conversation.title === "New Chat" || conversation.title.trim() === "";

    await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
            lastMessageAt: new Date(),
            ...(shoudlRename ? {
                title: trimmed.length > 48 ? `${trimmed.slice(0, 48)}` : trimmed
            } : {})
        }
    });

    revalidatePath("/");
    revalidatePath(`/c/${conversationId}`);

    return message;
}

/** Update message text (eg edit) */
export async function updateMessage(messageId: string, content: string) {
    const user = await requireUser();
    const trimmed = content.trim();

    if (!trimmed) {
        throw new Error("Message can not be empty");
    }

    const existing = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true }
    });

    if (!existing || existing.conversation.userId !== user.id) {
        throw new Error("Message does not exist");
    }

    const message = await prisma.message.update({
        where: { id: existing.id },
        data: {
            content: trimmed
        }
    });

    revalidatePath(`/c/${existing.conversationId}`);
    return message;
}

/** Delete a single message */
export async function deleteMessage(messageId: string) {
    const user = await requireUser();

    const existing = await prisma.message.findUnique({
        where: { id: messageId },
        include: { conversation: true }
    });

    if (!existing || existing.conversation.userId !== user.id) {
        throw new Error("Message does not exist");
    }

    await prisma.message.delete({ where: { id: messageId } });

    revalidatePath(`/c/${existing.conversationId}`);
    return { id: messageId, conversationId: existing.conversationId };
} 
