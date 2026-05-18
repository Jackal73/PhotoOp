// Minimal Appwrite session validity test
// Place this in your src/ directory and run it in your app to verify session and permissions

import { account } from "@/lib/appwrite/config";

export async function testAppwriteSession() {
  try {
    const session = await account.getSession("current");
    console.log("[Appwrite Session Test] Session:", session);
    if (!session) {
      console.warn(
        "[Appwrite Session Test] No active session. User is not logged in.",
      );
      return false;
    }
    const user = await account.get();
    console.log("[Appwrite Session Test] User:", user);
    return true;
  } catch (error) {
    console.error("[Appwrite Session Test] Error:", error);
    return false;
  }
}

// Usage: import and call testAppwriteSession() from any component or dev tool.
