import { Client, Account, Databases, Storage, Avatars } from "appwrite";

export const appwriteConfig = {
  url: import.meta.env.VITE_APPWRITE_URL,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  storageId: import.meta.env.VITE_APPWRITE_STORAGE_ID,
  userCollectionId: import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID,
  postCollectionId: import.meta.env.VITE_APPWRITE_POST_COLLECTION_ID,
  savesCollectionId: import.meta.env.VITE_APPWRITE_SAVES_COLLECTION_ID,
  commentCollectionId: import.meta.env.VITE_APPWRITE_COMMENT_COLLECTION_ID,
  sharesCollectionId: import.meta.env.VITE_APPWRITE_SHARES_COLLECTION_ID,
  chatCollectionId: import.meta.env.VITE_APPWRITE_CHAT_COLLECTION_ID,
  reelsCollectionId: import.meta.env.VITE_APPWRITE_REELS_COLLECTION_ID,
  followsCollectionId: import.meta.env.VITE_APPWRITE_FOLLOWS_COLLECTION_ID,
};

export const client = new Client();

// Runtime check for VITE_APPWRITE_URL
if (!appwriteConfig.url) {
  throw new Error(
    "[Appwrite] VITE_APPWRITE_URL is missing! Check your environment variables.",
  );
}

const resolvedEndpoint = appwriteConfig.url?.startsWith("http")
  ? appwriteConfig.url
  : `${window.location.origin}${appwriteConfig.url}`;

// Log the resolved endpoint for debugging (only in development)
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.log("[Appwrite] Using endpoint:", resolvedEndpoint);
}

client.setEndpoint(resolvedEndpoint);
client.setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
