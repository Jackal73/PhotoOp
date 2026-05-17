import { useEffect, useState } from "react";
import { GridPostList, Loader } from "@/components/shared";
import { Query } from "appwrite";
import { appwriteConfig, databases } from "@/lib/appwrite/config";
import { useUserContext } from "@/context/AuthContext";

const LikedPosts = () => {
  const { user } = useUserContext();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      setLoading(true);
      try {
        const res = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.postCollectionId,
          [Query.contains("likes", user.id)]
        );
        setPosts(res.documents || []);
      } catch (e) {
        setPosts([]);
      }
      setLoading(false);
    };
    if (user?.id) fetchLikedPosts();
  }, [user?.id]);

  if (loading) return <Loader />;
  if (!posts || posts.length === 0)
    return (
      <div className="flex-center w-full h-full">
        <p className="text-light-4">No liked posts</p>
      </div>
    );
  return <GridPostList posts={posts} showStats={false} />;
};

export default LikedPosts;
