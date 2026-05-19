import React, { useState, useEffect } from "react";
import { useUserContext } from "../../context/AuthContext";
import { Loader } from "@/components/shared";
import { useUpdateUser } from "@/lib/react-query/queriesAndMutations";

const Settings: React.FC = () => {
  const { user, isLoading, setIsAuthenticated, setUser } = useUserContext();

  // Example state for toggles
  const [isPrivate, setIsPrivate] = useState(false);
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    messages: true,
  });

  useEffect(() => {
    if (user?.notificationPreferences) {
      setNotifications(user.notificationPreferences);
    }
  }, [user.notificationPreferences]);

  const { mutate: updateUser } = useUpdateUser();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Handlers (replace with real API calls)
  const handlePrivacyToggle = () => setIsPrivate((v) => !v);

  const handleNotificationToggle = (key: string) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key as keyof typeof prev] };
      // Persist to backend
      updateUser({
        userId: user.id,
        name: user.name,
        bio: user.bio,
        imageId: "", // Not updating image here
        imageUrl: user.imageUrl,
        file: [],
        notificationPreferences: updated,
      });
      // Also update in context
      setUser({ ...user, notificationPreferences: updated });
      return updated;
    });
  };
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser({
      id: "",
      name: "",
      username: "",
      email: "",
      imageUrl: "",
      bio: "",
    });
    window.location.href = "/sign-in";
  };
  const handleDeleteAccount = () => alert("Delete account not implemented");

  if (isLoading || !user?.email) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-lg mx-auto p-4 space-y-8 mt-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        {/* Account Section */}
        <section className="bg-dark-2 border border-dark-4 rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-3 text-white">Account</h2>
          <div className="mb-4 text-light-3">
            <div className="mb-2">
              <span className="font-semibold">Name:</span> {user.name}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Username:</span> @{user.username}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Email:</span> {user.email}
            </div>
          </div>
          <button
            className="btn w-full transition-colors duration-150 hover:text-yellow-400"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </section>

        {/* Privacy Section */}
        <section className="bg-dark-2 border border-dark-4 rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-3 text-white">Privacy</h2>
          <div className="flex items-center justify-between mb-2 text-light-3">
            <span>Private Account</span>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={handlePrivacyToggle}
              className="toggle-checkbox"
            />
          </div>
        </section>

        {/* Notifications Section */}
        <section className="bg-dark-2 border border-dark-4 rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-3 text-white">Notifications</h2>
          <div className="space-y-2">
            {Object.keys(notifications).map((key) => (
              <div
                key={key}
                className="flex items-center justify-between text-light-3"
              >
                <span className="capitalize">{key} notifications</span>
                <input
                  type="checkbox"
                  checked={notifications[key as keyof typeof notifications]}
                  onChange={() => handleNotificationToggle(key)}
                  className="toggle-checkbox"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-dark-2 border border-dark-4 rounded-xl shadow p-6">
          <h2 className="text-xl font-bold mb-3" style={{ color: "#ef4444" }}>
            Danger Zone
          </h2>
          <button
            className="btn btn-danger w-full transition-colors duration-150"
            style={{ transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "")}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </button>
        </section>
      </div>
      {/* Delete Account Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-dark-2 border border-dark-4 p-6 rounded-xl shadow-lg max-w-sm w-full">
            <h3 className="text-xl font-bold mb-2 text-red-600">
              Are you sure?
            </h3>
            <p className="mb-4 text-base text-gray-700">
              This action cannot be undone. Your account and all data will be
              permanently deleted.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                className="btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteAccount}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;
