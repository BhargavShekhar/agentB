"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../utils/query-key";
import {
    createConversation,
    deleteConversation,
    listConversations,
    updateCoversation
} from "../actions/conversation-action";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/** List all the user conversation with catching, background refetching and stale-time management */
export function useConversation() {
    return useQuery({
        queryKey: queryKeys.conversation.all,
        queryFn: () => listConversations()
    })
}

/** Create the conversation and go to the conversation page */
export function useCreateConversation() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (title?: string) => createConversation(title),
        onSuccess: (conversation) => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            });
            router.push(`/c/${conversation.id}`);
        },
        onError: (error: Error) => {
            toast.error(error.message || "Could not create chat");
        }
    });
}

/** Delete the conversation and leave the page if you are viewing it */
export function useDeleteConversation(activeId: string | undefined) {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (conversationId: string) => deleteConversation(conversationId),
        onSuccess: ({ id }) => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            });

            queryClient.removeQueries({
                queryKey: queryKeys.message.byConversation(id)
            });

            if (activeId === id) {
                router.push("/");
            }

            toast.message("Chat deleted successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Could not delete chat");
        }
    })
}

/** Rename / pin / archive a conversation */
export function useUpdateConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            conversationId,
            ...data
        }: {
            conversationId: string,
            title?: string,
            isPinned?: boolean,
            isArchived?: boolean
        }) => updateCoversation(conversationId, data),
        onSuccess: (conversation) => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.all
            })

            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversation.detail(conversation.id)
            });
        },
        onError: (error: Error) => {
            toast.error(error.message || "Could not update chat");
        }
    })
}