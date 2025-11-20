import { pgTable, text, uuid, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Profiles table (extends Supabase auth.users)
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  coverUrl: text("cover_url"),
  website: text("website"),
  location: text("location"),
  isVerified: boolean("is_verified").default(false),
  isPrivate: boolean("is_private").default(false),
  followersCount: integer("followers_count").default(0),
  followingCount: integer("following_count").default(0),
  postsCount: integer("posts_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  caption: text("caption"),
  imageUrl: text("image_url"),
  location: text("location"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Likes table
export const likes = pgTable("likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Follows table
export const follows = pgTable("follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  followerId: uuid("follower_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  followingId: uuid("following_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stories table
export const stories = pgTable("stories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").default("image"),
  viewsCount: integer("views_count").default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Story views table
export const storyViews = pgTable("story_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  storyId: uuid("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  receiverId: uuid("receiver_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => comments.id, { onDelete: "cascade" }),
  content: text("content"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved posts table
export const savedPosts = pgTable("saved_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
  likes: many(likes),
  followers: many(follows, { relationName: "following" }),
  following: many(follows, { relationName: "follower" }),
  stories: many(stories),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  notifications: many(notifications),
  savedPosts: many(savedPosts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(profiles, {
    fields: [posts.userId],
    references: [profiles.id],
  }),
  comments: many(comments),
  likes: many(likes),
  savedBy: many(savedPosts),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(profiles, {
    fields: [comments.userId],
    references: [profiles.id],
  }),
  likes: many(likes),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  post: one(posts, {
    fields: [likes.postId],
    references: [posts.id],
  }),
  comment: one(comments, {
    fields: [likes.commentId],
    references: [comments.id],
  }),
  user: one(profiles, {
    fields: [likes.userId],
    references: [profiles.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(profiles, {
    fields: [follows.followerId],
    references: [profiles.id],
    relationName: "follower",
  }),
  following: one(profiles, {
    fields: [follows.followingId],
    references: [profiles.id],
    relationName: "following",
  }),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  author: one(profiles, {
    fields: [stories.userId],
    references: [profiles.id],
  }),
  views: many(storyViews),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(profiles, {
    fields: [messages.senderId],
    references: [profiles.id],
    relationName: "sender",
  }),
  receiver: one(profiles, {
    fields: [messages.receiverId],
    references: [profiles.id],
    relationName: "receiver",
  }),
}));

// Types
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;

export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type SavedPost = typeof savedPosts.$inferSelect;
export type InsertSavedPost = typeof savedPosts.$inferInsert;
