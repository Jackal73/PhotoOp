import { FormEvent, useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui";
import { useUserContext } from "@/context/AuthContext";
import useDebounce from "@/hooks/useDebounce";
import useChatRealtime from "@/hooks/useChatRealtime";
import { useToast } from "@/components/ui/use-toast";
import {
  useCreateChatMessage,
  useGetChatConversations,
  useGetConversationMessages,
  useGetUsers,
  useMarkConversationAsRead,
} from "@/lib/react-query/queriesAndMutations";

const Chats = () => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [messageText, setMessageText] = useState("");

  const debouncedSearch = useDebounce(searchValue, 300);

  const { data: usersData } = useGetUsers();
  const { data: conversations = [] } = useGetChatConversations(
    user.id,
    !!user.id,
  );
  const { mutate: createChatMessage, isPending: isSending } =
    useCreateChatMessage();
  const { mutate: markAsRead } = useMarkConversationAsRead();

  const { data: messagesData } = useGetConversationMessages(
    user.id,
    selectedPartnerId,
    !!user.id && !!selectedPartnerId,
  );

  useChatRealtime({
    userId: user.id,
    partnerId: selectedPartnerId,
    enabled: !!user.id,
  });

  const users = useMemo(() => {
    return (usersData?.documents || []).filter((u) => u.$id !== user.id);
  }, [usersData?.documents, user.id]);

  const usersById = useMemo(() => {
    return new Map(users.map((u) => [u.$id, u]));
  }, [users]);

  const filteredConversations = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const partner = usersById.get(conversation.partnerId);
      const name = (partner?.name || "").toLowerCase();
      const username = (partner?.username || "").toLowerCase();
      return name.includes(query) || username.includes(query);
    });
  }, [conversations, debouncedSearch, usersById]);

  const filteredUsers = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return users;

    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      return name.includes(query) || username.includes(query);
    });
  }, [debouncedSearch, users]);

  const conversationPartnerIds = useMemo(() => {
    return new Set(conversations.map((conversation) => conversation.partnerId));
  }, [conversations]);

  const usersWithoutConversation = useMemo(() => {
    return filteredUsers.filter((u) => !conversationPartnerIds.has(u.$id));
  }, [conversationPartnerIds, filteredUsers]);

  const selectedPartner = selectedPartnerId
    ? usersById.get(selectedPartnerId)
    : null;
  const messages = messagesData?.documents || [];

  useEffect(() => {
    if (!selectedPartnerId && filteredConversations.length > 0) {
      setSelectedPartnerId(filteredConversations[0].partnerId);
    }
  }, [filteredConversations, selectedPartnerId]);

  useEffect(() => {
    if (!selectedPartnerId) return;
    markAsRead({ userId: user.id, partnerId: selectedPartnerId });
  }, [markAsRead, selectedPartnerId, user.id, messages.length]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();

    const trimmedMessage = messageText.trim();
    if (!selectedPartnerId) {
      toast({
        title: "Select a user",
        description: "Choose who you want to chat with first.",
      });
      return;
    }

    if (!trimmedMessage) {
      toast({
        title: "Type a message",
        description: "Your message cannot be empty.",
      });
      return;
    }

    createChatMessage(
      {
        senderId: user.id,
        receiverId: selectedPartnerId,
        text: trimmedMessage,
      },
      {
        onSuccess: () => setMessageText(""),
        onError: (error: any) => {
          toast({
            title: "Message not sent",
            description:
              error?.message ||
              "Unable to send right now. Please check chat setup and try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <section className="w-full flex flex-1 overflow-hidden">
      <div className="hidden md:flex w-[320px] border-r border-dark-4 flex-col">
        <div className="p-5 border-b border-dark-4">
          <h2 className="h3-bold md:h2-bold text-light-1">Chats</h2>
          <p className="small-regular text-light-3 mt-1">Real-time messages</p>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-dark-4 px-3 py-2">
            <img
              src="/assets/icons/search.svg"
              width={18}
              height={18}
              alt="Search"
            />
            <Input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search conversations"
              className="border-none bg-transparent p-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3 border-b border-dark-4">
            <p className="small-medium text-light-3 uppercase tracking-wide">
              Conversations
            </p>
          </div>

          {filteredConversations.length === 0 ? (
            <p className="small-regular text-light-4 px-5 py-4">
              No conversations yet.
            </p>
          ) : (
            filteredConversations.map((conversation) => {
              const partner = usersById.get(conversation.partnerId);
              const isActive = selectedPartnerId === conversation.partnerId;

              return (
                <button
                  key={conversation.conversationId}
                  type="button"
                  onClick={() => setSelectedPartnerId(conversation.partnerId)}
                  className={`w-full px-5 py-3 text-left border-b border-dark-4 transition-colors ${
                    isActive ? "bg-dark-4" : "hover:bg-dark-4/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={
                          partner?.imageUrl ||
                          "/assets/icons/profile-placeholder.svg"
                        }
                        alt={partner?.name || "User"}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="base-medium text-light-1 truncate">
                          {partner?.name || "Unknown user"}
                        </p>
                        <p className="small-regular text-light-3 truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="h-5 min-w-[20px] px-1 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                        {conversation.unreadCount > 99
                          ? "99+"
                          : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}

          <div className="px-5 py-3 border-y border-dark-4">
            <p className="small-medium text-light-3 uppercase tracking-wide">
              Start new chat
            </p>
          </div>

          {usersWithoutConversation.length === 0 ? (
            <p className="small-regular text-light-4 px-5 py-4">
              Everyone already has a conversation.
            </p>
          ) : (
            usersWithoutConversation.map((u) => {
              const isActive = selectedPartnerId === u.$id;

              return (
                <button
                  key={u.$id}
                  type="button"
                  onClick={() => setSelectedPartnerId(u.$id)}
                  className={`w-full px-5 py-3 text-left border-b border-dark-4 transition-colors ${
                    isActive ? "bg-dark-4" : "hover:bg-dark-4/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        u.imageUrl || "/assets/icons/profile-placeholder.svg"
                      }
                      alt={u.name || "User"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="base-medium text-light-1 truncate">
                        {u.name || "Unknown user"}
                      </p>
                      <p className="small-regular text-light-3 truncate">
                        @{u.username}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="md:hidden border-b border-dark-4 px-4 py-3">
          <select
            value={selectedPartnerId}
            onChange={(e) => setSelectedPartnerId(e.target.value)}
            className="w-full rounded-md bg-dark-4 text-light-1 px-3 py-2 outline-none"
          >
            <option value="">Select user to chat</option>
            {filteredUsers.map((partner) => {
              return (
                <option key={partner.$id} value={partner.$id}>
                  {partner?.name || "Unknown user"}
                </option>
              );
            })}
          </select>
        </div>

        <div className="border-b border-dark-4 px-4 py-3 flex items-center gap-3">
          {selectedPartner ? (
            <>
              <img
                src={
                  selectedPartner.imageUrl ||
                  "/assets/icons/profile-placeholder.svg"
                }
                alt={selectedPartner.name}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="base-medium text-light-1">
                  {selectedPartner.name}
                </p>
                <p className="small-regular text-light-3">
                  @{selectedPartner.username}
                </p>
              </div>
            </>
          ) : (
            <p className="small-medium text-light-3">
              Select a conversation to start chatting.
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
          {!selectedPartnerId ? (
            <p className="small-regular text-light-4">
              Choose a user to start chatting.
            </p>
          ) : messages.length === 0 ? (
            <p className="small-regular text-light-4">
              No messages yet. Say hello.
            </p>
          ) : (
            messages.map((message) => {
              const senderId =
                typeof message.sender === "string"
                  ? message.sender
                  : message.sender?.$id;
              const isMine = senderId === user.id;

              return (
                <div
                  key={message.$id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMine
                        ? "bg-primary-500 text-white"
                        : "bg-dark-4 text-light-1"
                    }`}
                  >
                    <p className="small-medium whitespace-pre-wrap">
                      {message.text}
                    </p>
                    <p
                      className={`mt-1 text-[11px] ${isMine ? "text-white/80" : "text-light-4"}`}
                    >
                      {new Date(message.$createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="border-t border-dark-4 p-4"
        >
          <div className="flex items-center gap-3">
            <Input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={
                selectedPartnerId
                  ? "Write a message..."
                  : "Select a conversation first"
              }
              disabled={!selectedPartnerId || isSending}
              className="bg-dark-4 border-none"
            />
            <button
              type="submit"
              disabled={!selectedPartnerId || !messageText.trim() || isSending}
              className="shad-button_primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Chats;
