
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { appwriteConfig, client } from "@/lib/appwrite/config";
import { QUERY_KEYS } from "@/lib/react-query/queryKeys";

type UseChatRealtimeOptions = {
  userId: string;
  partnerId?: string;
  enabled?: boolean;
};

export default function useChatRealtime({
  userId,
  partnerId,
  enabled = true,
}: UseChatRealtimeOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId || !appwriteConfig.chatCollectionId) return;

    const channel = `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.chatCollectionId}.documents`;
    // Minimal debug logging
    // eslint-disable-next-line no-console
    console.log("[useChatRealtime] userId:", userId, "channel:", channel);

    const unsubscribe = client.subscribe(channel, () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHAT_CONVERSATIONS, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHAT_UNREAD_COUNT, userId],
      });

      if (partnerId) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.GET_CHAT_MESSAGES, userId, partnerId],
        });
      }
    });

    return () => {
      // eslint-disable-next-line no-console
      console.log("[useChatRealtime] unsubscribed from channel:", channel);
      unsubscribe();
    };
  }, [enabled, userId, partnerId, queryClient]);
}
