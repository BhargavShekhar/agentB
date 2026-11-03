export const queryKeys = {
    conversation: {
        all: ["conversation"] as const,
        detail: (id: string) => ["conversation", id] as const
    },
    message: {
        byConversation: (conversationId: string) => ["messages", conversationId] as const
    }
};