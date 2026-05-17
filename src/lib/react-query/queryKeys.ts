export enum QUERY_KEYS {
  // AUTH KEYS
  CREATE_USER_ACCOUNT = "createUserAccount",

  // USER KEYS
  GET_CURRENT_USER = "getCurrentUser",
  GET_USERS = "getUsers",
  GET_USER_BY_ID = "getUserById",

  // POST KEYS
  GET_POSTS = "getPosts",
  GET_INFINITE_POSTS = "getInfinitePosts",
  GET_RECENT_POSTS = "getRecentPosts",
  GET_POST_BY_ID = "getPostById",
  GET_USER_POSTS = "getUserPosts",
  GET_FILE_PREVIEW = "getFilePreview",

  //  SEARCH KEYS
  SEARCH_POSTS = "getSearchPosts",

  // COMMENT KEYS
  GET_COMMENTS = "getComments",
  GET_POST_COMMENTS = "getRecentComments",
  GET_COMMENT_BY_ID = "getCommentById",
  GET_CHILD_COMMENTS = "getChildComments",

  // SHARE KEYS
  GET_POST_SHARES = "getPostShares",

  // CHAT KEYS
  GET_CHAT_CONVERSATIONS = "getChatConversations",
  GET_CHAT_MESSAGES = "getChatMessages",
  GET_CHAT_UNREAD_COUNT = "getChatUnreadCount",

  // REELS KEYS
  GET_RECENT_REELS = "getRecentReels",

  // FOLLOW KEYS
  GET_FOLLOW_DOCUMENT = "getFollowDocument",
  GET_FOLLOWING = "getFollowing",
  GET_FOLLOWERS = "getFollowers",
  GET_PENDING_FOLLOW_REQUESTS = "getPendingFollowRequests",
}
