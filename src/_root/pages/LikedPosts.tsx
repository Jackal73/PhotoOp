import { useEffect, useState } from "react";
import { GridPostList, Loader } from "@/components/shared";
import { getPostById } from "@/lib/appwrite/api";

interface LikedPostsProps {
  liked: string[];
}

const LikedPosts = ({ liked }: LikedPostsProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const fetchedPosts = await Promise.all(
        (liked || []).map(async (postId) => {
          try {
            return await getPostById(postId);
          } catch {
            return null;
          }
        }),
      );
      setPosts(fetchedPosts.filter(Boolean));
      setLoading(false);
    };
    if (liked && liked.length > 0) fetchPosts();
    else setPosts([]);
  }, [liked]);

  if (loading) return <Loader />;

  if (!posts || posts.length === 0)
    return (
      <div className="flex-center w-full h-full">
        <p className="text-light-4">No liked posts</p>
      </div>
    );

  return <GridPostList posts={posts} showStats={true} />;
};

export default LikedPosts;
