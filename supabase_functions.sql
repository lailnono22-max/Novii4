-- Helper functions for counters
-- Run this in Supabase SQL Editor after running supabase_schema.sql

-- Increment likes count
CREATE OR REPLACE FUNCTION increment_likes_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement likes count
CREATE OR REPLACE FUNCTION decrement_likes_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment comments count
CREATE OR REPLACE FUNCTION increment_comments_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement comments count
CREATE OR REPLACE FUNCTION decrement_comments_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment followers count
CREATE OR REPLACE FUNCTION increment_followers_count(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET followers_count = followers_count + 1 WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement followers count
CREATE OR REPLACE FUNCTION decrement_followers_count(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- Increment following count
CREATE OR REPLACE FUNCTION increment_following_count(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET following_count = following_count + 1 WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement following count
CREATE OR REPLACE FUNCTION decrement_following_count(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET following_count = GREATEST(following_count - 1, 0) WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- Increment posts count
CREATE OR REPLACE FUNCTION increment_posts_count(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET posts_count = posts_count + 1 WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement posts count
CREATE OR REPLACE FUNCTION decrement_posts_count(profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET posts_count = GREATEST(posts_count - 1, 0) WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;
