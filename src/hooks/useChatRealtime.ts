import { useEffect, useState } from "react";
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
  const [connectionState, setConnectionState] = useState<
    "connected" | "disconnected" | "error"
  >("connected");

  useEffect(() => {
    if (!enabled || !userId || !appwriteConfig.chatCollectionId) return;

    const channel = `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.chatCollectionId}.documents`;
    // Debug logging
    console.log("[useChatRealtime] userId:", userId, "channel:", channel);

    // Appwrite JS SDK does not expose direct WebSocket connection events in the public API.
    // If you want to track connection state, you may need to rely on subscribe/unsubscribe or SDK events if available.
    // We'll just set connected on subscribe for now.
    setConnectionState("connected");

    const unsubscribe = client.subscribe(channel, () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHAT_CONVERSATIONS, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHAT_UNREAD_COUNT, userId],
      });

      // Invalidate all open chat message queries for this user
      const queries = queryClient
        .getQueryCache()
        .findAll({ queryKey: [QUERY_KEYS.GET_CHAT_MESSAGES, userId] });
      queries.forEach((query) => {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      });
    });

    return () => {
      console.log("[useChatRealtime] unsubscribed from channel:", channel);
      unsubscribe();
      setConnectionState("disconnected");
    };
  }, [enabled, userId, partnerId, queryClient]);

  // Optionally, return connection state for UI feedback
  return connectionState;
}
