import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/lib/react-query/queryKeys";
import {
  createReel,
  deleteReel,
  createChatMessage,
  addNestedComment,
  createShareEvent,
  createComment,
  deleteComment,
  getChatConversations,
  getChildComments,
  getCommentById,
  getConversationMessages,
  getPostComments,
  getUnreadMessagesCount,
  likedComment,
  markConversationAsRead,
  createUserAccount,
  signInAccount,
  getCurrentUser,
  getRecentReels,
  updateReel,
  signOutAccount,
  getUsers,
  createPost,
  getPostById,
  getPostSharesCount,
  updatePost,
  getUserPosts,
  deletePost,
  likePost,
  getUserById,
  updateUser,
  getRecentPosts,
  getInfinitePosts,
  searchPosts,
  savePost,
  deleteSavedPost,
  followUser,
  unfollowUser,
  acceptFollowRequest,
  declineFollowRequest,
  getFollowDocument,
  getFollowing,
  getFollowers,
  getPendingFollowRequests,
  getUsersByIds,
} from "@/lib/appwrite/api";
import {
  IChatConversation,
  IComment,
  INewChatMessage,
  INewReel,
  INewPost,
  IShareEvent,
  INewUser,
  IUpdatePost,
  IUpdateReel,
  IUpdateUser,
} from "@/types";

// ============================================================
// AUTH QUERIES
// ============================================================

export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: (user: INewUser) => createUserAccount(user),
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInAccount(user),
  });
};

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: signOutAccount,
  });
};

// ============================================================
// POST QUERIES
// ============================================================

export const useGetPosts = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
    queryFn: getInfinitePosts as any,
    getNextPageParam: (lastPage: any) => {
      // If there's no data, there are no more pages.
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

      // Use the $id of the last document as the cursor.
      const lastId = Number(
        lastPage?.documents[lastPage?.documents.length - 1].$id,
      );
      return isNaN(lastId) ? undefined : lastId;
    },
    initialPageParam: undefined,
  });
};

export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
  });
};

export const useGetRecentPosts = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    queryFn: getRecentPosts,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: INewPost) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

export const useGetPostById = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
};

export const useGetUserPosts = (userId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_POSTS, userId],
    queryFn: () => getUserPosts(userId),
    enabled: !!userId,
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: IUpdatePost) => updatePost(post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, imageId }: { postId?: string; imageId: string }) =>
      deletePost(postId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

import { useUserContext } from "@/context/AuthContext";

export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  return useMutation({
    mutationFn: ({
      postId,
      likesArray,
    }: {
      postId: string;
      likesArray: string[];
    }) => likePost(postId, likesArray, user.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, postId }: { userId: string; postId: string }) =>
      savePost(userId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useDeleteSavedPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (savedRecordId: string) => deleteSavedPost(savedRecordId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

// ============================================================
// USER QUERIES
// ============================================================

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
  });
};

export const useGetUsers = (limit?: number) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USERS],
    queryFn: () => getUsers(limit),
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: IUpdateUser) => updateUser(user),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_BY_ID, data?.$id],
      });
    },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comment: IComment) => {
      return createComment(comment);
    },
    onSuccess: (newComment, variables) => {
      if (!newComment) return;

      // Show replies immediately in the open thread before refetch completes.
      if (variables.parentCommentID) {
        queryClient.setQueryData(
          [QUERY_KEYS.GET_CHILD_COMMENTS, variables.parentCommentID],
          (oldData: any) => {
            if (!oldData) {
              return {
                total: 1,
                documents: [newComment],
              };
            }

            return {
              ...oldData,
              total: (oldData.total || 0) + 1,
              documents: [newComment, ...(oldData.documents || [])],
            };
          },
        );
      }

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENTS, variables.postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHILD_COMMENTS, variables.parentCommentID],
      });
    },
  });
};

export const useGetPostComments = (postId: string, enabled = true) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_COMMENTS, postId],
    queryFn: () => getPostComments(postId),
    enabled: !!postId && enabled,
  });
};

export const useLikeComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      likesArray,
    }: {
      commentId: string;
      likesArray: string[];
    }) => likedComment(commentId, likesArray),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENTS, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_COMMENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useGetCommentById = (commentId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_COMMENT_BY_ID, commentId],
    queryFn: () => getCommentById(commentId),
    enabled: !!commentId,
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
    }: {
      commentId: string;
      postId?: string;
      parentCommentID?: string | null;
    }) => deleteComment(commentId),
    onSuccess: (_data, variables) => {
      if (variables.parentCommentID) {
        queryClient.setQueryData(
          [QUERY_KEYS.GET_CHILD_COMMENTS, variables.parentCommentID],
          (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              total: Math.max((oldData.total || 1) - 1, 0),
              documents: oldData.documents.filter(
                (d: any) => d.$id !== variables.commentId,
              ),
            };
          },
        );
      }
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENTS, variables.postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHILD_COMMENTS, variables.parentCommentID],
      });
    },
  });
};

export const useGetChildComments = (
  parentCommentID: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CHILD_COMMENTS, parentCommentID],
    queryFn: () => getChildComments(parentCommentID),
    enabled: !!parentCommentID && enabled,
  });
};

export const useNestedComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      childrenComment,
    }: {
      commentId: string;
      childrenComment: string[];
    }) => addNestedComment(commentId, childrenComment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENT_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENTS, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_COMMENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
    },
  });
};

export const useCreateShareEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (share: IShareEvent) => createShareEvent(share),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_SHARES, data?.post],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.post],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POSTS],
      });
    },
  });
};

export const useGetPostSharesCount = (postId: string, enabled = true) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_SHARES, postId],
    queryFn: () => getPostSharesCount(postId),
    enabled: !!postId && enabled,
  });
};

// ============================================================
// CHAT QUERIES
// ============================================================

export const useGetChatConversations = (userId: string, enabled = true) => {
  return useQuery<IChatConversation[]>({
    queryKey: [QUERY_KEYS.GET_CHAT_CONVERSATIONS, userId],
    queryFn: () => getChatConversations(userId),
    enabled: !!userId && enabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useGetConversationMessages = (
  userId: string,
  partnerId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CHAT_MESSAGES, userId, partnerId],
    queryFn: () => getConversationMessages(userId, partnerId),
    enabled: !!userId && !!partnerId && enabled,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useGetUnreadMessagesCount = (userId: string, enabled = true) => {
  return useQuery<number>({
    queryKey: [QUERY_KEYS.GET_CHAT_UNREAD_COUNT, userId],
    queryFn: () => getUnreadMessagesCount(userId),
    enabled: !!userId && enabled,
    refetchInterval: 30000,
  });
};

export const useCreateChatMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: INewChatMessage) => createChatMessage(message),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEYS.GET_CHAT_MESSAGES,
          variables.senderId,
          variables.receiverId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHAT_CONVERSATIONS, variables.senderId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHAT_CONVERSATIONS, variables.receiverId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHAT_UNREAD_COUNT, variables.receiverId],
      });
    },
  });
};

export const useMarkConversationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      partnerId,
    }: {
      userId: string;
      partnerId: string;
    }) => markConversationAsRead(userId, partnerId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEYS.GET_CHAT_MESSAGES,
          variables.userId,
          variables.partnerId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHAT_UNREAD_COUNT, variables.userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CHAT_CONVERSATIONS, variables.userId],
      });
    },
  });
};

// ============================================================
// REELS QUERIES
// ============================================================

export const useGetRecentReels = (enabled = true) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_REELS],
    queryFn: getRecentReels,
    enabled,
  });
};

export const useCreateReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reel: INewReel) => createReel(reel),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_REELS],
      });
    },
  });
};

export const useUpdateReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reel: IUpdateReel) => updateReel(reel),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_REELS],
      });
    },
  });
};

export const useDeleteReel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reelId, videoId }: { reelId: string; videoId?: string }) =>
      deleteReel(reelId, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_REELS],
      });
    },
  });
};

// ============================================================
// FOLLOW QUERIES
// ============================================================

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      followerId,
      followingId,
    }: {
      followerId: string;
      followingId: string;
    }) => followUser(followerId, followingId),
    onSuccess: (_data, { followerId, followingId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOW_DOCUMENT, followerId, followingId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING, followerId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWERS, followingId],
      });
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ followDocumentId }: { followDocumentId: string }) =>
      unfollowUser(followDocumentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOW_DOCUMENT],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_FOLLOWING] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GET_FOLLOWERS] });
    },
  });
};

export const useGetFollowDocument = (
  followerId: string,
  followingId: string,
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FOLLOW_DOCUMENT, followerId, followingId],
    queryFn: () => getFollowDocument(followerId, followingId),
    enabled: !!followerId && !!followingId && followerId !== followingId,
  });
};

export const useGetFollowing = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FOLLOWING, userId],
    queryFn: () => getFollowing(userId),
    enabled: !!userId,
  });
};

export const useGetFollowers = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FOLLOWERS, userId],
    queryFn: () => getFollowers(userId),
    enabled: !!userId,
  });
};

export const useGetUsersByIds = (userIds: string[]) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USERS, "byIds", userIds.join(",")],
    queryFn: () => getUsersByIds(userIds),
    enabled: userIds.length > 0,
  });
};

export const useAcceptFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      followDocumentId,
    }: {
      followDocumentId: string;
      followerId: string;
      followingId: string;
    }) => acceptFollowRequest(followDocumentId),
    onSuccess: (_data, { followerId, followingId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOW_DOCUMENT, followerId, followingId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWING, followerId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOWERS, followingId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_PENDING_FOLLOW_REQUESTS, followingId],
      });
    },
  });
};

export const useDeclineFollowRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      followDocumentId,
    }: {
      followDocumentId: string;
      followerId: string;
      followingId: string;
    }) => declineFollowRequest(followDocumentId),
    onSuccess: (_data, { followerId, followingId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FOLLOW_DOCUMENT, followerId, followingId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_PENDING_FOLLOW_REQUESTS, followingId],
      });
    },
  });
};

export const useGetPendingFollowRequests = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_PENDING_FOLLOW_REQUESTS, userId],
    queryFn: () => getPendingFollowRequests(userId),
    enabled: !!userId,
  });
};
