import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Profile, Post, Story, Message, Notification, Comment } from '@/lib/api';
import { useToast } from './use-toast';

// Profile hooks
export function useCurrentProfile() {
  return useQuery({
    queryKey: ['profile', 'current'],
    queryFn: () => api.getCurrentProfile(),
  });
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.getProfile(username),
    enabled: !!username,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (updates: Partial<Profile>) => api.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الملف الشخصي بنجاح',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل تحديث الملف الشخصي',
      });
    },
  });
}

// Feed hooks
export function useFeed(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['feed', limit, offset],
    queryFn: () => api.getFeed(limit, offset),
  });
}

export function useExplorePosts(limit = 30) {
  return useQuery({
    queryKey: ['explore', limit],
    queryFn: () => api.getExplorePosts(limit),
  });
}

export function useUserPosts(userId: string) {
  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: () => api.getUserPosts(userId),
    enabled: !!userId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ caption, imageUrl, location }: { caption: string; imageUrl: string; location?: string }) =>
      api.createPost(caption, imageUrl, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'تم النشر',
        description: 'تم نشر المنشور بنجاح',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل نشر المنشور',
      });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (postId: string) => api.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنشور بنجاح',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل حذف المنشور',
      });
    },
  });
}

// Like hooks
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.toggleLike(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      
      const previousData = queryClient.getQueryData(['feed']);
      
      queryClient.setQueryData(['feed'], (old: any) => {
        if (!old) return old;
        return old.map((post: Post) => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: !post.is_liked,
              likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1,
            };
          }
          return post;
        });
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['feed'], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// Comment hooks
export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => api.getComments(postId),
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      api.createComment(postId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل إضافة التعليق',
      });
    },
  });
}

// Stories hooks
export function useStories() {
  return useQuery({
    queryKey: ['stories'],
    queryFn: () => api.getStories(),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: 'image' | 'video' }) =>
      api.createStory(mediaUrl, mediaType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast({
        title: 'تم النشر',
        description: 'تم نشر القصة بنجاح',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'فشل نشر القصة',
      });
    },
  });
}

// Follow hooks
export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) => api.toggleFollow(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useIsFollowing(targetUserId: string) {
  return useQuery({
    queryKey: ['following', targetUserId],
    queryFn: () => api.isFollowing(targetUserId),
    enabled: !!targetUserId,
  });
}

// Messages hooks
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
  });
}

export function useMessages(userId: string) {
  return useQuery({
    queryKey: ['messages', userId],
    queryFn: () => api.getMessages(userId),
    enabled: !!userId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: string; content: string }) =>
      api.sendMessage(receiverId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.receiverId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

// Notifications hooks
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => api.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Saved Posts hooks
export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => api.toggleSave(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      
      const previousData = queryClient.getQueryData(['feed']);
      
      queryClient.setQueryData(['feed'], (old: any) => {
        if (!old) return old;
        return old.map((post: Post) => {
          if (post.id === postId) {
            return {
              ...post,
              is_saved: !post.is_saved,
            };
          }
          return post;
        });
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['feed'], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}

export function useSavedPosts() {
  return useQuery({
    queryKey: ['saved'],
    queryFn: () => api.getSavedPosts(),
  });
}

// Suggestions
export function useSuggestedUsers(limit = 5) {
  return useQuery({
    queryKey: ['suggestions', limit],
    queryFn: () => api.getSuggestedUsers(limit),
  });
}
