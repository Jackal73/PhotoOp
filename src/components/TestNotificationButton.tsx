import { useEffect } from "react";
import { testNotification } from "@/lib/appwrite/api";
import { useUserContext } from "@/context/AuthContext";

export default function TestNotificationButton() {
  const { user } = useUserContext();

  const handleTest = async () => {
    if (!user?.id) {
      alert("No user ID found. Please sign in.");
      return;
    }
    try {
      await testNotification(user.id);
      alert("Test notification created!");
    } catch (err) {
      alert("Failed to create test notification. Check console for details.");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  return (
    <button
      onClick={handleTest}
      className="px-4 py-2 bg-blue-600 text-white rounded mt-4"
      type="button"
    >
      Send Test Notification
    </button>
  );
}
