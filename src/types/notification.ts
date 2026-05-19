// Notification type for Appwrite collection
export interface INotification {
  $id: string;
  userId: string; // Who receives the notification
  type: "like" | "comment" | "follow" | "mention" | "system";
  message: string;
  link?: string; // Optional link to post/profile
  createdAt: string;
  read: boolean;
}
