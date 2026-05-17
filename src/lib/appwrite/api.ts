// ============================== CREATE POST
export async function createPost(post: INewPost) {
  try {
    // Upload file to appwrite storage
    const uploadedFile = await uploadFile(post.file[0]);
    if (!uploadedFile) throw Error;

    // Get file url
    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    // Create post
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        caption: post.caption,
        imageUrl: fileUrl,
        imageId: uploadedFile.$id,
        location: post.location,
        tags: tags,
      },
    );

    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    return newPost;
  } catch (error) {
    console.log(error);
  }
}
import { ID, Permission, Query, Role } from "appwrite";

import { appwriteConfig, account, databases, storage, avatars } from "./config";
import {
  IChatConversation,
  IComment,
  INewChatMessage,
  INewReel,
  IUpdateReel,
  IShareEvent,
  IUpdatePost,
  INewPost,
  INewUser,
  IUpdateUser,
} from "@/types";

// ============================================================
// AUTH
// ============================================================

// ============================== SIGN UP
export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name,
    );

    if (!newAccount) throw Error("Account creation failed");

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      email: newAccount.email,
      username: user.username,
      imageUrl: avatarUrl as any,
    });

    return newUser;
  } catch (error: any) {
    console.error("createUserAccount failed:", error?.message || error);
    throw error;
  }
}

// ============================== SAVE USER TO DB
export async function saveUserToDB(user: {
  accountId: string;
  email: string;
  name: string;
  imageUrl: any;
  username?: string;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user,
    );

    return newUser;
  } catch (error: any) {
    console.error("saveUserToDB failed:", error?.message || error);
    throw error;
  }
}

// ============================== SIGN IN
export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailSession(user.email, user.password);

    return session;
  } catch (error: any) {
    const message = error?.message || "";

    // Appwrite blocks creating a new session when one is already active.
    // Reuse the current session so the sign-in flow can continue.
    if (/session is active|session.*active/i.test(message)) {
      try {
        const currentSession = await account.getSession("current");
        return currentSession;
      } catch (getSessionError: any) {
        throw error; // Rethrow original error
      }
    }

    throw error;
  }
}

// ============================== GET ACCOUNT
export async function getAccount() {
  try {
    const currentAccount = await account.get();
    return currentAccount;
  } catch (error: any) {
    // 401 means no valid session - this is expected when not logged in
    if (error?.code === 401 || error?.status === 401) {
      return null;
    }
    console.error(error);
    return null;
  }
}

// ============================== GET USER
export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) {
      return null;
    }

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)],
    );

    if (!currentUser) throw Error;

    if (currentUser.documents.length === 0) {
      const fallbackUsername = `user_${currentAccount.$id.slice(0, 8)}`;
      const avatarUrl = avatars.getInitials(currentAccount.name || "User");

      const repairedUser = await saveUserToDB({
        accountId: currentAccount.$id,
        name: currentAccount.name || "User",
        email: currentAccount.email,
        username: fallbackUsername,
        imageUrl: avatarUrl as any,
      });

      if (!repairedUser) throw Error;
      return repairedUser;
    }

    return currentUser.documents[0];
  } catch (error: any) {
    console.log(error);
    return null;
  }
}

// ============================== SIGN OUT
export async function signOutAccount() {
  try {
    const session = await account.deleteSession("current");
    return session;
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// POSTS
// ============================================================

// ============================== CREATE POST
export async function createReel(
  reel: INewReel & { thumbnailUrl?: string; thumbnailId?: string },
) {
  try {
    // Upload video file to appwrite storage
    const uploadedFile = await uploadFile(reel.file);
    if (!uploadedFile) throw Error;

    // Get video file url
    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    // Create reel document with thumbnailUrl and thumbnailId if provided
    const newReel = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.reelsCollectionId,
      ID.unique(),
      {
        creator: reel.userId,
        caption: reel.caption,
        videoUrl: fileUrl,
        videoId: uploadedFile.$id,
        thumbnailUrl: reel.thumbnailUrl || "",
        thumbnailId: reel.thumbnailId || "",
      },
    );

    if (!newReel) {
      await deleteFile(uploadedFile.$id);
      if (reel.thumbnailId) await deleteFile(reel.thumbnailId);
      throw Error;
    }

    return newReel;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UPLOAD FILE
export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.storageId,
      ID.unique(),
      file,
    );

    return uploadedFile;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET FILE URL
export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.storageId,
      fileId,
      2000,
      2000,
      "top",
      100,
    );

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET FILE VIEW URL
export function getFileView(fileId: string) {
  try {
    const fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}

// ============================== DELETE FILE
export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.storageId, fileId);

    return { status: "ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET POSTS
export async function searchPosts(searchTerm: string) {
  try {
    const normalizedTerm = searchTerm.trim().replace(/^#+/, "").toLowerCase();

    if (!normalizedTerm) {
      return { documents: [], total: 0 };
    }

    const [captionMatches, tagMatches, exactTagMatches, hashTagMatches] =
      await Promise.allSettled([
        databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.search("caption", normalizedTerm)],
        ),
        databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.search("tags", normalizedTerm)],
        ),
        databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.equal("tags", normalizedTerm)],
        ),
        databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.equal("tags", `#${normalizedTerm}`)],
        ),
      ]);

    const mergedDocs: Record<string, any> = {};

    [captionMatches, tagMatches, exactTagMatches, hashTagMatches].forEach(
      (result) => {
        if (result.status === "fulfilled") {
          result.value.documents.forEach((doc: any) => {
            mergedDocs[doc.$id] = doc;
          });
        }
      },
    );

    let documents = Object.values(mergedDocs);

    // Fallback filter for projects where tag/caption search indexes are not configured.
    if (documents.length === 0) {
      const allPosts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        [Query.orderDesc("$updatedAt"), Query.limit(100)],
      );

      documents = allPosts.documents.filter((post: any) => {
        const caption = String(post?.caption || "").toLowerCase();
        const tags = (post?.tags || []).map((tag: string) =>
          String(tag).replace(/^#+/, "").toLowerCase(),
        );

        return (
          caption.includes(normalizedTerm) || tags.includes(normalizedTerm)
        );
      });
    }

    return {
      documents,
      total: documents.length,
    };
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  const queries: any[] = [Query.orderDesc("$updatedAt"), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      queries,
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET POST BY ID
export async function getPostById(postId?: string) {
  if (!postId) throw Error;

  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UPDATE POST
export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let image = {
      imageUrl: post.imageUrl,
      imageId: post.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, "").split(",") || [];

    //  Update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        caption: post.caption,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
        location: post.location,
        tags: tags,
      },
    );

    // Failed to update
    if (!updatedPost) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }

      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.imageId);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== DELETE POST
export async function deletePost(postId?: string, imageId?: string) {
  if (!postId || !imageId) return;

  try {
    // const statusCode = await databases.deleteDocument(
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
    );

    // if (!statusCode) throw Error;

    // await deleteFile(imageId);

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== LIKE / UNLIKE POST
export async function likePost(
  postId: string,
  likesArray: string[],
  userId?: string,
) {
  try {
    // Update the post's likes array
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      postId,
      {
        likes: likesArray,
      },
    );

    // Also update the user's liked array if userId is provided
    if (userId) {
      const user = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        userId,
      );
      let liked = Array.isArray(user.liked) ? [...user.liked] : [];
      if (likesArray.includes(userId)) {
        // Like: add postId if not present
        if (!liked.includes(postId)) liked.push(postId);
      } else {
        // Unlike: remove postId if present
        liked = liked.filter((id) => id !== postId);
      }
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        userId,
        { liked },
      );
    }

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ============================== SAVE POST
export async function savePost(userId: string, postId: string) {
  try {
    const updatedPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      ID.unique(),
      {
        user: userId,
        post: postId,
        userId,
        postId,
      },
    );

    if (!updatedPost) throw Error;

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}
// ============================== DELETE SAVED POST
export async function deleteSavedPost(savedRecordId: string) {
  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      savedRecordId,
    );

    if (!statusCode) throw Error;

    return { status: "Ok" };
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER'S POST
export async function getUserPosts(userId?: string) {
  if (!userId) return;

  try {
    const post = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.equal("creator", userId), Query.orderDesc("$createdAt")],
    );

    if (!post) throw Error;

    return post;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET POPULAR POSTS (BY HIGHEST LIKE COUNT)
export async function getRecentPosts() {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(20)],
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// USER
// ============================================================

// ============================== GET USERS
export async function getUsers(limit?: number) {
  const queries: any[] = [Query.orderDesc("$createdAt")];

  if (limit) {
    queries.push(Query.limit(limit));
  }

  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries,
    );

    if (!users) throw Error;

    return users;
  } catch (error) {
    console.log(error);
  }
}

// ============================== GET USER BY ID
export async function getUserById(userId: string) {
  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
    );

    if (!user) throw Error;

    return user;
  } catch (error) {
    console.log(error);
  }
}

// ============================== UPDATE USER
export async function updateUser(user: IUpdateUser) {
  const hasFileToUpdate = user.file.length > 0;
  try {
    let image = {
      imageUrl: user.imageUrl,
      imageId: user.imageId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(user.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
    }

    //  Update user
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      user.userId,
      {
        name: user.name,
        bio: user.bio,
        imageUrl: image.imageUrl,
        imageId: image.imageId,
      },
    );

    // Failed to update
    if (!updatedUser) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(image.imageId);
      }
      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (user.imageId && hasFileToUpdate) {
      await deleteFile(user.imageId);
    }

    return updatedUser;
  } catch (error) {
    console.log(error);
  }
}

// ============================================================
// COMMENT
// ============================================================

export async function createComment(comment: IComment) {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) {
      throw new Error("You must be signed in to create a comment.");
    }

    const newComment = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.commentCollectionId,
      ID.unique(),
      {
        post: comment.postId,
        user: comment.userId,
        comment_text: comment.comment_text,
        parentCommentID: comment.parentCommentID,
        childrenCommentId: comment.childrenCommentId,
        likes: [],
      },
      [
        Permission.read(Role.users()),
        Permission.update(Role.user(currentAccount.$id)),
        Permission.delete(Role.user(currentAccount.$id)),
      ],
    );

    if (!newComment) {
      throw Error;
    }
    return newComment;
  } catch (error) {
    console.log(error);
  }
}

export async function getPostComments(postId: string) {
  if (!postId) {
    throw new Error("Post ID is required to fetch comments.");
  }
  try {
    const comments = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.commentCollectionId,
      [Query.equal("post", postId), Query.orderDesc("$createdAt")],
    );

    if (!comments) throw Error;

    const rootComments = comments.documents.filter(
      (comment) => !comment.parentCommentID,
    );

    return {
      ...comments,
      total: rootComments.length,
      documents: rootComments,
    };
  } catch (error) {
    console.error("Failed to fetch post comments:", error);
    throw error;
  }
}

export async function likedComment(commentId: string, likesArray: string[]) {
  try {
    const updateComment = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.commentCollectionId,
      commentId,
      {
        likes: likesArray,
      },
    );
    if (!updateComment) throw Error;
    return updateComment;
  } catch (error) {
    console.log(error);
  }
}

export async function addNestedComment(
  commentId: string,
  childrenComment: string[],
) {
  try {
    const updateComment = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.commentCollectionId,
      commentId,
      {
        childrenCommentId: childrenComment,
      },
    );
    if (!updateComment) throw Error;
    return updateComment;
  } catch (error) {
    console.log(error);
  }
}

export async function getCommentById(commentId: string) {
  try {
    const comment = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.commentCollectionId,
      commentId,
    );
    return comment;
  } catch (error) {
    console.log(error);
  }
}

export async function deleteComment(commentId: string) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.commentCollectionId,
      commentId,
    );
    return { status: "ok", commentId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getChildComments(parentCommentID: string) {
  if (!parentCommentID) {
    throw new Error("Parent comment ID is required to fetch replies.");
  }

  try {
    const childComments = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.commentCollectionId,
      [
        Query.equal("parentCommentID", parentCommentID),
        Query.orderDesc("$createdAt"),
      ],
    );

    if (!childComments) throw Error;

    return childComments;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================================================
// SHARE
// ============================================================

export async function createShareEvent(share: IShareEvent) {
  if (!appwriteConfig.sharesCollectionId) {
    throw new Error("Shares collection is not configured.");
  }

  try {
    const currentAccount = await getAccount();

    if (!currentAccount) {
      throw new Error("You must be signed in to share a post.");
    }

    const shareEvent = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.sharesCollectionId,
      ID.unique(),
      {
        post: share.postId,
        user: share.userId,
        channel: share.channel,
      },
      [
        Permission.read(Role.users()),
        Permission.update(Role.user(currentAccount.$id)),
        Permission.delete(Role.user(currentAccount.$id)),
      ],
    );

    if (!shareEvent) throw Error;

    return shareEvent;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getPostSharesCount(postId: string) {
  if (!postId) {
    throw new Error("Post ID is required to fetch shares.");
  }

  if (!appwriteConfig.sharesCollectionId) {
    return { total: 0, uniqueSharers: 0 };
  }

  try {
    const uniqueSharers = new Set<string>();
    let total = 0;
    let lastDocumentId: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const queries = [
        Query.equal("post", postId),
        Query.orderAsc("$id"),
        Query.limit(100),
      ];

      if (lastDocumentId) {
        queries.push(Query.cursorAfter(lastDocumentId));
      }

      const shares = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.sharesCollectionId,
        queries,
      );

      if (!shares) throw Error;

      total = shares.total;

      shares.documents.forEach((share) => {
        const shareUserId =
          typeof share.user === "string" ? share.user : share.user?.$id;
        if (shareUserId) uniqueSharers.add(shareUserId);
      });

      hasMore = shares.documents.length === 100;
      lastDocumentId = shares.documents[shares.documents.length - 1]?.$id;
    }

    return {
      total,
      uniqueSharers: uniqueSharers.size,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================================================
// CHAT
// ============================================================

export function buildConversationId(userA: string, userB: string) {
  return [userA, userB].sort().join("__");
}

export async function createChatMessage(message: INewChatMessage) {
  if (!appwriteConfig.chatCollectionId) {
    throw new Error("Chat collection is not configured.");
  }

  const trimmed = message.text.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  try {
    const currentAccount = await getAccount();
    if (!currentAccount) {
      throw new Error("You must be signed in to send a message.");
    }

    const receiverUser = await getUserById(message.receiverId);
    const receiverAccountId = receiverUser?.accountId;
    if (!receiverAccountId) {
      throw new Error("Receiver account is missing.");
    }

    const participants = [message.senderId, message.receiverId].sort();
    const conversationId = buildConversationId(
      message.senderId,
      message.receiverId,
    );

    const newMessage = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.chatCollectionId,
      ID.unique(),
      {
        conversationId,
        participants,
        sender: message.senderId,
        receiver: message.receiverId,
        text: trimmed,
        isRead: false,
      },
      [
        Permission.read(Role.user(currentAccount.$id)),
        Permission.read(Role.user(receiverAccountId)),
        Permission.update(Role.user(currentAccount.$id)),
        Permission.update(Role.user(receiverAccountId)),
        Permission.delete(Role.user(currentAccount.$id)),
      ],
    );

    if (!newMessage) throw Error;
    return newMessage;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getChatConversations(
  userId: string,
): Promise<IChatConversation[]> {
  if (!appwriteConfig.chatCollectionId) {
    return [];
  }

  try {
    const [sentMessages, receivedMessages] = await Promise.all([
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.chatCollectionId,
        [
          Query.equal("sender", userId),
          Query.orderDesc("$createdAt"),
          Query.limit(200),
        ],
      ),
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.chatCollectionId,
        [
          Query.equal("receiver", userId),
          Query.orderDesc("$createdAt"),
          Query.limit(200),
        ],
      ),
    ]);

    const allMessagesMap = new Map<string, any>();
    [...sentMessages.documents, ...receivedMessages.documents].forEach(
      (message) => {
        allMessagesMap.set(message.$id, message);
      },
    );

    const messages = Array.from(allMessagesMap.values()).sort(
      (a, b) =>
        new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime(),
    );

    const map = new Map<string, IChatConversation>();

    messages.forEach((msg) => {
      const senderId =
        typeof msg.sender === "string" ? msg.sender : msg.sender?.$id;
      const receiverId =
        typeof msg.receiver === "string" ? msg.receiver : msg.receiver?.$id;
      if (!senderId || !receiverId) return;

      const partnerId = senderId === userId ? receiverId : senderId;
      const conversationId =
        msg.conversationId || buildConversationId(userId, partnerId);

      if (!map.has(conversationId)) {
        map.set(conversationId, {
          conversationId,
          partnerId,
          lastMessage: msg.text || "",
          lastMessageAt: msg.$createdAt,
          unreadCount: 0,
        });
      }

      const current = map.get(conversationId);
      if (!current) return;

      if (receiverId === userId && msg.isRead === false) {
        current.unreadCount += 1;
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getConversationMessages(userA: string, userB: string) {
  if (!appwriteConfig.chatCollectionId) {
    return { documents: [], total: 0 };
  }

  try {
    const conversationId = buildConversationId(userA, userB);

    const messages = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.chatCollectionId,
      [
        Query.equal("conversationId", conversationId),
        Query.orderAsc("$createdAt"),
        Query.limit(200),
      ],
    );

    if (!messages) throw Error;
    return messages;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUnreadMessagesCount(userId: string) {
  if (!appwriteConfig.chatCollectionId) {
    return 0;
  }

  try {
    const unread = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.chatCollectionId,
      [
        Query.equal("receiver", userId),
        Query.equal("isRead", false),
        Query.limit(1),
      ],
    );

    if (!unread) throw Error;
    return unread.total;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function markConversationAsRead(
  userId: string,
  partnerId: string,
) {
  if (!appwriteConfig.chatCollectionId) {
    throw new Error("Chat collection is not configured.");
  }

  try {
    const unread = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.chatCollectionId,
      [
        Query.equal("conversationId", buildConversationId(userId, partnerId)),
        Query.equal("receiver", userId),
        Query.equal("isRead", false),
        Query.limit(100),
      ],
    );

    if (!unread || unread.documents.length === 0) {
      return { updated: 0 };
    }

    await Promise.all(
      unread.documents.map((doc) =>
        databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.chatCollectionId as string,
          doc.$id,
          { isRead: true },
        ),
      ),
    );

    return { updated: unread.documents.length };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================================================
// REELS
// ============================================================

export async function getRecentReels() {
  if (!appwriteConfig.reelsCollectionId) {
    return { documents: [], total: 0 };
  }

  try {
    const reels = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.reelsCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(30)],
    );

    if (!reels) throw Error;

    return reels;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function updateReel(reel: IUpdateReel) {
  if (!appwriteConfig.reelsCollectionId) {
    throw new Error("Reels collection is not configured.");
  }

  try {
    const updatedReel = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.reelsCollectionId,
      reel.reelId,
      {
        caption: reel.caption,
      },
    );

    if (!updatedReel) throw Error;
    return updatedReel;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteReel(reelId: string, videoId?: string) {
  if (!appwriteConfig.reelsCollectionId) {
    throw new Error("Reels collection is not configured.");
  }

  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.reelsCollectionId,
      reelId,
    );

    if (videoId) {
      await deleteFile(videoId);
    }

    return { status: "ok", reelId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ============================================================
// FOLLOWS
// ============================================================

// ============================== FOLLOW USER (creates a pending request)
export async function followUser(followerId: string, followingId: string) {
  try {
    const follow = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      ID.unique(),
      { followerId, followingId, status: "pending" },
      [
        Permission.read(Role.any()),
        Permission.update(`user:${followingId}`), // target can accept/decline
        Permission.delete(`user:${followerId}`), // sender can cancel
        Permission.delete(`user:${followingId}`), // target can decline
      ],
    );
    return follow;
  } catch (error: any) {
    console.error("followUser failed:", error?.message || error);
    throw error;
  }
}

// ============================== UNFOLLOW / CANCEL REQUEST
export async function unfollowUser(followDocumentId: string) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      followDocumentId,
    );
    return { status: "ok" };
  } catch (error: any) {
    console.error("unfollowUser failed:", error?.message || error);
    throw error;
  }
}

// ============================== ACCEPT FOLLOW REQUEST
export async function acceptFollowRequest(followDocumentId: string) {
  try {
    const updated = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      followDocumentId,
      { status: "accepted" },
    );
    return updated;
  } catch (error: any) {
    console.error("acceptFollowRequest failed:", error?.message || error);
    throw error;
  }
}

// ============================== DECLINE FOLLOW REQUEST (deletes the doc)
export async function declineFollowRequest(followDocumentId: string) {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      followDocumentId,
    );
    return { status: "ok" };
  } catch (error: any) {
    console.error("declineFollowRequest failed:", error?.message || error);
    throw error;
  }
}

// ============================== GET FOLLOW DOCUMENT (any status)
export async function getFollowDocument(
  followerId: string,
  followingId: string,
) {
  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal("followerId", followerId),
        Query.equal("followingId", followingId),
        Query.limit(1),
      ],
    );
    return result.documents[0] || null;
  } catch (error: any) {
    console.error("getFollowDocument failed:", error?.message || error);
    return null;
  }
}

// ============================== GET FOLLOWING (accepted only)
export async function getFollowing(userId: string) {
  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal("followerId", userId),
        Query.equal("status", "accepted"),
        Query.limit(500),
      ],
    );
    return result.documents;
  } catch (error: any) {
    console.error("getFollowing failed:", error?.message || error);
    return [];
  }
}

// ============================== GET FOLLOWERS (accepted only)
export async function getFollowers(userId: string) {
  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal("followingId", userId),
        Query.equal("status", "accepted"),
        Query.limit(500),
      ],
    );
    return result.documents;
  } catch (error: any) {
    console.error("getFollowers failed:", error?.message || error);
    return [];
  }
}

// ============================== GET PENDING FOLLOW REQUESTS (for the target user)
export async function getPendingFollowRequests(userId: string) {
  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.followsCollectionId,
      [
        Query.equal("followingId", userId),
        Query.equal("status", "pending"),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ],
    );
    return result.documents;
  } catch (error: any) {
    console.error("getPendingFollowRequests failed:", error?.message || error);
    return [];
  }
}

// ============================== GET USERS BY IDS
export async function getUsersByIds(userIds: string[]) {
  if (!userIds.length) return { documents: [], total: 0 };
  try {
    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("$id", userIds), Query.limit(500)],
    );
    return result;
  } catch (error: any) {
    console.error("getUsersByIds failed:", error?.message || error);
    return { documents: [], total: 0 };
  }
}
