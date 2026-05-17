import { useEffect, useState } from "react";
import { GridPostList, SearchResults, Loader } from "@/components/shared";
import { useInView } from "react-intersection-observer";
import { Input } from "@/components/ui";
import useDebounce from "@/hooks/useDebounce";
import {
  useGetPosts,
  useSearchPosts,
  useGetFollowing,
} from "@/lib/react-query/queriesAndMutations";
import { useUserContext } from "@/context/AuthContext";

type FeedMode =
  | "all"
  | "trending"
  | "latest"
  | "following"
  | "most-discussed"
  | "most-shared";

type CreatorType = "all" | "following" | "verified" | "new";
type TimeWindow = "all" | "today" | "week" | "month";

const normalizeTag = (tag: string) =>
  String(tag || "").replace(/^#+/, "").toLowerCase();

const getTimeStart = (window: TimeWindow) => {
  const now = new Date();
  switch (window) {
    case "today":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
};

const getCountMetric = (post: any, keys: string[]) => {
  for (const key of keys) {
    const value = post?.[key];
    if (Array.isArray(value)) return value.length;
    if (typeof value === "number") return value;
  }
  return 0;
};

const Explore = () => {
  const { ref, inView } = useInView();
  const { user } = useUserContext();
  const { data: posts, fetchNextPage, hasNextPage } = useGetPosts();
  const { data: followingDocs = [] } = useGetFollowing(user.id);

  const [searchValue, setSearchValue] = useState("");
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [creatorType, setCreatorType] = useState<CreatorType>("all");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearch = useDebounce(searchValue, 500);
  const { data: searchedPosts, isFetching: isSearchFetching } =
    useSearchPosts(debouncedSearch);

  useEffect(() => {
    if (inView && !searchValue) {
      fetchNextPage();
    }
  }, [inView, searchValue, fetchNextPage]);

  if (!posts) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  const shouldShowSearchResults = searchValue.trim() !== "";
  const allPosts = posts.pages.flatMap((item: any) => item?.documents || []);
  const shouldShowPosts = !shouldShowSearchResults && allPosts.length === 0;

  const followingSet = new Set(
    (followingDocs as any[]).map((doc) => doc.followingId as string),
  );

  const filteredPosts = allPosts
    .filter((post: any) => {
      const createdAt = new Date(post?.$createdAt || post?.$updatedAt || Date.now());
      const timeStart = getTimeStart(timeWindow);
      if (timeStart && createdAt < timeStart) return false;

      if (selectedTags.length > 0) {
        const postTags = (post?.tags || []).map((tag: string) => normalizeTag(tag));
        const hasTag = selectedTags.some((tag) => postTags.includes(normalizeTag(tag)));
        if (!hasTag) return false;
      }

      if (creatorType === "following") {
        const creatorId = String(post?.creator?.$id || post?.creator || "");
        if (!followingSet.has(creatorId)) return false;
      }

      if (creatorType === "verified" && !Boolean(post?.creator?.verified)) {
        return false;
      }

      if (creatorType === "new") {
        const creatorCreatedAt = new Date(post?.creator?.$createdAt || Date.now());
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (creatorCreatedAt < monthAgo) return false;
      }

      if (feedMode === "following") {
        const creatorId = String(post?.creator?.$id || post?.creator || "");
        if (!followingSet.has(creatorId)) return false;
      }

      return true;
    })
    .sort((a: any, b: any) => {
      const aCreated = new Date(a?.$createdAt || 0).getTime();
      const bCreated = new Date(b?.$createdAt || 0).getTime();

      const aLikes = Array.isArray(a?.likes) ? a.likes.length : 0;
      const bLikes = Array.isArray(b?.likes) ? b.likes.length : 0;

      const aComments = getCountMetric(a, ["commentsCount", "commentCount", "comments"]);
      const bComments = getCountMetric(b, ["commentsCount", "commentCount", "comments"]);

      const aShares = getCountMetric(a, ["sharesCount", "shareCount", "shares"]);
      const bShares = getCountMetric(b, ["sharesCount", "shareCount", "shares"]);

      if (feedMode === "latest") return bCreated - aCreated;
      if (feedMode === "most-discussed") return bComments - aComments || bCreated - aCreated;
      if (feedMode === "most-shared") return bShares - aShares || bCreated - aCreated;
      if (feedMode === "trending") {
        const aScore = aLikes * 2 + aComments * 1.5 + aShares * 2;
        const bScore = bLikes * 2 + bComments * 1.5 + bShares * 2;
        return bScore - aScore || bCreated - aCreated;
      }

      return bCreated - aCreated;
    });

  const popularTags = Array.from(
    new Set(allPosts.flatMap((post: any) => post?.tags || [])),
  ).slice(0, 10);

  const toggleTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    setSelectedTags((prev) =>
      prev.includes(normalized)
        ? prev.filter((item) => item !== normalized)
        : [...prev, normalized],
    );
  };

  const feedModeLabel =
    feedMode === "all"
      ? "All"
      : feedMode
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");

  const timeWindowLabel =
    timeWindow === "all"
      ? null
      : timeWindow === "today"
        ? "Today"
        : timeWindow === "week"
          ? "This Week"
          : "This Month";

  const creatorTypeLabel =
    creatorType === "all"
      ? null
      : creatorType === "following"
        ? "Following Creators"
        : creatorType === "verified"
          ? "Verified Creators"
          : "New Creators";

  const filterSummaryParts = [
    feedModeLabel !== "All" ? feedModeLabel : null,
    timeWindowLabel,
    creatorTypeLabel,
    selectedTags.length > 0 ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""}` : null,
  ].filter(Boolean) as string[];

  const alwaysVisibleFilterLabel = [
    feedModeLabel,
    timeWindow === "all"
      ? "All Time"
      : timeWindow === "today"
        ? "Today"
        : timeWindow === "week"
          ? "This Week"
          : "This Month",
    creatorType === "all"
      ? "All Creators"
      : creatorType === "following"
        ? "Following Creators"
        : creatorType === "verified"
          ? "Verified Creators"
          : "New Creators",
    selectedTags.length > 0 ? `${selectedTags.length} tag${selectedTags.length > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const activeFilterCount = filterSummaryParts.length;

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img src="/assets/icons/search.svg" height={24} width={24} alt="search" />
          <Input
            type="text"
            placeholder="Search caption or #tag"
            className="explore-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {popularTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full small-medium ${
                  selectedTags.includes(normalizeTag(tag))
                    ? "bg-primary-500 text-white"
                    : "bg-dark-4 text-light-2 hover:bg-dark-3"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <h3 className="body-bold md:h3-bold">Popular Today</h3>
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className="flex-center gap-3 bg-dark-3 rounded-xl px-4 py-2 cursor-pointer"
        >
          <p className="text-[10px] md:text-xs text-light-3 line-clamp-1 max-w-[320px] text-left">
            {alwaysVisibleFilterLabel}
          </p>
          <img src="/assets/icons/filter.svg" height={20} width={20} alt="filter" />
        </button>
      </div>

      {activeFilterCount > 0 && (
        <div className="w-full max-w-5xl mb-4 flex flex-wrap gap-2">
          {filterSummaryParts.map((part) => (
            <span
              key={part}
              className="px-2 py-1 rounded-full bg-dark-4 text-light-3 text-[10px] md:text-xs"
            >
              {part}
            </span>
          ))}
        </div>
      )}

      {showFilters && (
        <div className="w-full max-w-5xl mb-7 p-4 rounded-xl bg-dark-3 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All" },
              { key: "trending", label: "Trending" },
              { key: "latest", label: "Latest" },
              { key: "following", label: "Following" },
              { key: "most-discussed", label: "Most Discussed" },
              { key: "most-shared", label: "Most Shared" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setFeedMode(option.key as FeedMode)}
                className={`px-3 py-1 rounded-full small-medium ${
                  feedMode === option.key
                    ? "bg-primary-500 text-white"
                    : "bg-dark-4 text-light-2"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Time" },
              { key: "today", label: "Today" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setTimeWindow(option.key as TimeWindow)}
                className={`px-3 py-1 rounded-full small-medium ${
                  timeWindow === option.key
                    ? "bg-primary-500 text-white"
                    : "bg-dark-4 text-light-2"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Creators" },
              { key: "following", label: "Following" },
              { key: "verified", label: "Verified" },
              { key: "new", label: "New Creators" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setCreatorType(option.key as CreatorType)}
                className={`px-3 py-1 rounded-full small-medium ${
                  creatorType === option.key
                    ? "bg-primary-500 text-white"
                    : "bg-dark-4 text-light-2"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2">
              <p className="small-regular text-light-3">Active tags:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-primary-500/20 text-primary-500 small-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="small-regular text-light-3 hover:text-light-1"
              >
                Clear tags
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-9 w-full max-w-5xl">
        {shouldShowSearchResults ? (
          <SearchResults
            isSearchFetching={isSearchFetching}
            searchedPosts={searchedPosts}
          />
        ) : shouldShowPosts ? (
          <p className="text-light-4 mt-10 text-center w-full">End of posts</p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-light-4 mt-10 text-center w-full">
            No posts match the selected filters
          </p>
        ) : (
          <GridPostList posts={filteredPosts as any} />
        )}
      </div>

      {hasNextPage && !searchValue && (
        <div ref={ref} className="mt-10">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default Explore;
