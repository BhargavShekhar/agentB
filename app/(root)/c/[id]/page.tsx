import { getConversation } from "@/features/conversation/actions/conversation-action";
import { notFound } from "next/navigation";

type ConversationPagesProps = {
    params: Promise<{ id: string }>
}

export default async function Conversation({ params }: ConversationPagesProps) {
    const { id } = await params;

    try {
        const conversation = await getConversation(id);
    } catch (error) {
        notFound();
    }

    return (
        <div>ConversationId {id}</div>
    )
}