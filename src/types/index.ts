export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type NotificationPreferences = {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
  notificationPreferences?: NotificationPreferences;
};

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: URL;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
  notificationPreferences?: NotificationPreferences;
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export type IComment = {
  postId: string;
  userId: string;
  comment_text: string;
  parentCommentID: string | null;
  childrenCommentId: string[] | null;
};

export type IShareEvent = {
  postId: string;
  userId: string;
  channel: "native" | "clipboard";
};

export type INewChatMessage = {
  senderId: string;
  receiverId: string;
  text: string;
};

export type IChatConversation = {
  conversationId: string;
  partnerId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type INewReel = {
  userId: string;
  caption: string;
  file: File;
  thumbnailUrl?: string;
  thumbnailId?: string;
};

export type IUpdateReel = {
  reelId: string;
  caption: string;
};
