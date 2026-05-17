import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui";
import { Loader } from "@/components/shared";
import { GridPostList, PostStats } from "@/components/shared";

import {
  useGetPostById,
  useGetUserPosts,
  useDeletePost,
} from "@/lib/react-query/queriesAndMutations";
import { multiFormatDateString } from "@/lib/utils";
import { useUserContext } from "@/context/AuthContext";
import ShowComments from "@/components/shared/ShowComments";
import CreateComment from "@/components/shared/CreateComment";

const PostDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUserContext();

  const { data: post, isLoading } = useGetPostById(id);
  const { data: userPosts, isLoading: isUserPostLoading } = useGetUserPosts(
    post?.creator.$id,
  );
  const { mutate: deletePost } = useDeletePost();

  const relatedPosts = userPosts?.documents.filter(
    (userPost) => userPost.$id !== id,
  );

  const handleDeletePost = () => {
    deletePost({ postId: id || "", imageId: post?.imageId });

    navigate(-1);
  };

  return (
    <div className="post_details-container">
      {post && (
        <Helmet>
          <title>
            {post.caption ? `${post.caption} — Photo Op` : "Photo Op"}
          </title>
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content="Photo Op" />
          <meta
            property="og:title"
            content={post.caption || "Check out this post on Photo Op"}
          />
          <meta
            property="og:description"
            content={
              post.caption
                ? `${post.caption} — shared on Photo Op`
                : "Shared on Photo Op"
            }
          />
          {post.imageUrl && (
            <meta property="og:image" content={post.imageUrl} />
          )}
          <meta
            property="og:url"
            content={`${window.location.origin}/posts/${post.$id}`}
          />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content={post.caption || "Check out this post on Photo Op"}
          />
          {post.imageUrl && (
            <meta name="twitter:image" content={post.imageUrl} />
          )}
        </Helmet>
      )}
      <div className="hidden md:flex max-w-5xl w-full">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="shad-button_ghost"
        >
          <img
            src={"/assets/icons/back.svg"}
            alt="back"
            width={24}
            height={24}
            className=" mb-[-20px]"
          />
          <p className="small-medium lg:base-medium mt-[20px]">Back</p>
        </Button>
      </div>

      {isLoading || !post ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          <img src={post?.imageUrl} alt="post" className="post_details-img" />

          <div className="post_details-info">
            <div className="flex-between w-full">
              <Link
                to={`/profile/${post?.creator.$id}`}
                className="flex items-center gap-3"
              >
                <img
                  src={
                    post?.creator.imageUrl ||
                    "/assets/icons/profile-placeholder.svg"
                  }
                  alt="creator"
                  className="w-8 h-8 lg:w-12 lg:h-12 rounded-full"
                />
                <div className="flex flex-col">
                  <p className="base-medium lg:body-bold text-light-1">
                    {post?.creator.name}
                  </p>
                  <div className="flex-start text-light-3 ">
                    <p className="subtle-semibold tiny-medium lg:small-regular ">
                      {multiFormatDateString(post?.$createdAt)}
                    </p>
                  </div>
                  <div className="flex-start text-light-3 mt-[-2px]">
                    <p className="subtle-semibold tiny-medium lg:small-regular">
                      {post?.location}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="flex-center gap-3 !mt-[-32px]">
                <Link
                  to={`/update-post/${post?.$id}`}
                  className={`${user.id !== post?.creator.$id && "hidden"}`}
                >
                  <img
                    src={"/assets/icons/edit.svg"}
                    alt="edit"
                    width={20}
                    height={20}
                  />
                </Link>

                <Button
                  onClick={handleDeletePost}
                  variant="ghost"
                  className={`ghost_details-delete_btn mr-[-2] ${user.id !== post?.creator.$id && "hidden"}`}
                  size="default1"
                >
                  <img
                    src={"/assets/icons/delete.svg"}
                    alt="delete"
                    width={20}
                    height={20}
                  />
                </Button>
              </div>
            </div>

            {/* <hr className="border w-full border-dark-4/80" /> */}

            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p>{post?.caption}</p>
              <ul className="flex gap-1 mt-2">
                {post?.tags.map((tag: string, index: string) => (
                  <li
                    key={`${tag}${index}`}
                    className="text-light-3 tiny-medium lg:small-regular"
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full">
              <PostStats post={post} userId={user.id} />
            </div>
            <hr className="border w-full border-dark-4/80" />
            <div className="comments-container">
              <ShowComments postId={post.$id} />
            </div>
            <div className="w-full">
              <CreateComment userId={user.id} post={post} />
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl">
        <hr className="border w-full border-dark-4/80" />

        <h3 className="body-bold md:h3-bold w-full my-10">
          More Related Posts
        </h3>
        {isUserPostLoading || !relatedPosts ? (
          <Loader />
        ) : (
          <GridPostList posts={relatedPosts} />
        )}
      </div>
    </div>
  );
};

export default PostDetails;
