import { supabase } from './supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website: string | null;
  location: string | null;
  is_verified: boolean;
  is_private: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  views_count: number;
  expires_at: string;
  created_at: string;
  profile?: Profile;
  is_viewed?: boolean;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'like' | 'comment' | 'follow' | 'mention';
  post_id: string | null;
  comment_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
}

export const api = {
  // Profile APIs
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async uploadAvatar(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get current profile to save old avatar URL
    const currentProfile = await this.getCurrentProfile();
    const oldAvatarUrl = currentProfile?.avatar_url;

    // Create unique filename with proper folder structure
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Report initial progress
    if (onProgress) onProgress(10);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Report upload complete
    if (onProgress) onProgress(80);

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const newAvatarUrl = data.publicUrl;

    // Only delete old avatar after successful upload
    if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
      try {
        await this.deleteAvatar(oldAvatarUrl);
      } catch (error) {
        console.warn('Failed to delete old avatar:', error);
        // Don't fail the upload if deletion fails
      }
    }

    if (onProgress) onProgress(100);

    return newAvatarUrl;
  },

  async deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl || !avatarUrl.includes('/storage/v1/object/public/avatars/')) return;

    try {
      // Extract file path from URL
      // URL format: https://.../storage/v1/object/public/avatars/user-id/filename.ext
      const urlParts = avatarUrl.split('/storage/v1/object/public/avatars/');
      if (urlParts.length < 2) return;
      
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) {
        console.warn('Failed to delete avatar from storage:', error);
      }
    } catch (error) {
      console.warn('Error deleting avatar:', error);
    }
  },

  async getProfile(username: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(updates: Partial<Profile>): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createProfile(userId: string, username: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username,
        full_name: username,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Posts APIs
  async getFeed(limit = 20, offset = 0): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!posts_user_id_fkey(*)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    const posts = data || [];

    if (user) {
      const postIds = posts.map(p => p.id);
      const [likesData, savedData] = await Promise.all([
        supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
      ]);

      const likedIds = new Set(likesData.data?.map(l => l.post_id) || []);
      const savedIds = new Set(savedData.data?.map(s => s.post_id) || []);

      return posts.map(post => ({
        ...post,
        is_liked: likedIds.has(post.id),
        is_saved: savedIds.has(post.id)
      }));
    }

    return posts;
  },

  async getExplorePosts(limit = 30): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!posts_user_id_fkey(*)
      `)
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles!posts_user_id_fkey(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async uploadPostImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create unique filename with proper folder structure
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Report initial progress
    if (onProgress) onProgress(10);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('posts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Report upload complete
    if (onProgress) onProgress(80);

    // Get public URL
    const { data } = supabase.storage
      .from('posts')
      .getPublicUrl(filePath);

    if (onProgress) onProgress(100);

    return data.publicUrl;
  },

  async createPost(caption: string, imageUrl: string, location?: string): Promise<Post> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        caption,
        image_url: imageUrl,
        location
      })
      .select(`
        *,
        profile:profiles!posts_user_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    await supabase.rpc('increment_posts_count', { profile_id: user.id });

    return data;
  },

  async deletePost(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) throw error;

    await supabase.rpc('decrement_posts_count', { profile_id: user.id });
  },

  // Likes APIs
  async toggleLike(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
      await supabase.rpc('decrement_likes_count', { post_id: postId });
      return false;
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      await supabase.rpc('increment_likes_count', { post_id: postId });
      return true;
    }
  },

  // Comments APIs
  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles!comments_user_id_fkey(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createComment(postId: string, content: string): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content
      })
      .select(`
        *,
        profile:profiles!comments_user_id_fkey(*)
      `)
      .single();

    if (error) throw error;

    await supabase.rpc('increment_comments_count', { post_id: postId });

    return data;
  },

  // Stories APIs
  async getStories(): Promise<Story[]> {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        profile:profiles!stories_user_id_fkey(*)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createStory(mediaUrl: string, mediaType: 'image' | 'video' = 'image'): Promise<Story> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        media_url: mediaUrl,
        media_type: mediaType
      })
      .select(`
        *,
        profile:profiles!stories_user_id_fkey(*)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Follow APIs
  async toggleFollow(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      await supabase.from('follows').delete().eq('id', existingFollow.id);
      await Promise.all([
        supabase.rpc('decrement_following_count', { profile_id: user.id }),
        supabase.rpc('decrement_followers_count', { profile_id: targetUserId })
      ]);
      return false;
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: targetUserId
      });
      await Promise.all([
        supabase.rpc('increment_following_count', { profile_id: user.id }),
        supabase.rpc('increment_followers_count', { profile_id: targetUserId })
      ]);
      return true;
    }
  },

  async isFollowing(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    return !!data;
  },

  // Messages APIs
  async getConversations(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get all messages where current user is involved
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group messages by conversation (unique pair of users)
    const conversations = new Map();
    (data || []).forEach(message => {
      // Determine who the other user is in this conversation
      const isCurrentUserSender = message.sender_id === user.id;
      const otherUserId = isCurrentUserSender ? message.receiver_id : message.sender_id;
      const otherUserProfile = isCurrentUserSender ? message.receiver : message.sender;
      
      // Only add if this conversation hasn't been added yet
      // Since messages are ordered by created_at DESC, the first occurrence is the latest message
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          user: otherUserProfile,
          lastMessage: message,
          unreadCount: 0
        });
      }
    });

    return Array.from(conversations.values());
  },

  async getMessages(userId: string): Promise<Message[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    console.log(`📨 getMessages called - Current User: ${user.id}, Target User: ${userId}`);
    
    // Prevent fetching messages to self
    if (user.id === userId) {
      console.warn('⚠️ Attempting to fetch messages to self! Returning empty array.');
      return [];
    }

    // Get all messages between current user and the specified user
    // This includes:
    // 1. Messages sent by current user TO userId
    // 2. Messages sent by userId TO current user
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching messages:', error);
      throw error;
    }
    
    console.log(`✅ Fetched ${data?.length || 0} messages between Current User (${user.id}) and Target User (${userId})`);
    return data || [];
  },

  async sendMessage(receiverId: string, content: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Prevent sending messages to self
    if (user.id === receiverId) {
      console.error('⚠️ Attempted to send message to self!');
      throw new Error('Cannot send messages to yourself');
    }

    console.log(`📤 Sending message from ${user.id} to ${receiverId}`);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(*),
        receiver:profiles!messages_receiver_id_fkey(*)
      `)
      .single();

    if (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
    
    console.log(`✅ Message sent successfully`);
    return data;
  },

  // Notifications APIs
  async getNotifications(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Saved Posts APIs
  async toggleSave(postId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingSave } = await supabase
      .from('saved_posts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingSave) {
      await supabase.from('saved_posts').delete().eq('id', existingSave.id);
      return false;
    } else {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
      return true;
    }
  },

  async getSavedPosts(): Promise<Post[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_posts')
      .select(`
        post_id,
        posts!inner(
          *,
          profile:profiles!posts_user_id_fkey(*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data?.map((item: any) => ({ ...item.posts, is_saved: true })) || [];
  },

  // Suggestions
  async getSuggestedUsers(limit = 5): Promise<Profile[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Search
  async searchUsers(query: string, limit = 20): Promise<Profile[]> {
    if (!query || query.trim().length === 0) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getProfileById(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }
};
