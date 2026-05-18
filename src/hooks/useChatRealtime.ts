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

    // Listen for Appwrite Realtime connection events
    const ws = client.client?.realtime?.connection;
    if (ws) {
      ws.onopen = () => {
        setConnectionState("connected");
        console.log("[useChatRealtime] Realtime connected");
      };
      ws.onclose = () => {
        setConnectionState("disconnected");
        console.warn("[useChatRealtime] Realtime disconnected");
      };
      ws.onerror = (e) => {
        setConnectionState("error");
        console.error("[useChatRealtime] Realtime error", e);
      };
    }

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
        .findAll([QUERY_KEYS.GET_CHAT_MESSAGES, userId]);
      queries.forEach((query) => {
        queryClient.invalidateQueries({ queryKey: query.queryKey });
      });
    });

    return () => {
      console.log("[useChatRealtime] unsubscribed from channel:", channel);
      unsubscribe();
      if (ws) {
        ws.onopen = null;
        ws.onclose = null;
        ws.onerror = null;
      }
    };
  }, [enabled, userId, partnerId, queryClient]);

  // Optionally, return connection state for UI feedback
  return connectionState;
}
