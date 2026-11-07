"use server";

import { queryKeys } from "@/features/conversation/utils/query-key";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createMessage,
    deleteMessage,
    listMessages,
    updateMessage
} from "../actions/messages-action";
import { toast } from "sonner";

/** Load message for one conversation */
export function useMessage(conversationId: string | undefined) { // conversation id might not be available when the component initially reders.
    return useQuery({
        queryKey: queryKeys.message.byConversation(conversationId ?? "none"),
        queryFn: () => listMessages(conversationId!),
        enabled: Boolean(conversationId)
    });
}

/**
 * Send user a message.
 * After success we refresh message + the sidebar (title / lastMessageAt)
*/
export function useCreateMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (content: string) => createMessage(conversationId, content),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.message.byConversation(conversationId)
            });

            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            })
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Could not send message");
        }
    });
}

/** Edit a existing message */
export function useUpdateMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, content }: {
            id: string,
            content: string
        }) => updateMessage(id, content),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.message.byConversation(conversationId)
            });
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Could not update message");
        }
    })
}

/** Delete a message from the thread */
export function useDeleteMessage(conversationId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteMessage(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            });
            void queryClient.invalidateQueries({
                queryKey: queryKeys.message.byConversation(conversationId)
            });

            toast.message("Message deleted");
        },
        onError: (error: Error) => {
            toast.error(error.message ?? "Could not delete message");
        }
    })
}