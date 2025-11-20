import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Settings, Grid3X3, Bookmark, UserSquare2, Heart, MessageCircle, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function UserProfile() {
  const { user: currentUser } = useAuth();
  const { direction } = useLanguage();
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  
  const isRTL = direction === "rtl";
  
  // Get userId from URL query params - use window.location.search instead
  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get('id');
  
  console.log('🔍 UserProfile - Current URL:', window.location.href);
  console.log('🔍 UserProfile - UserId from URL:', userId);
  console.log('🔍 UserProfile - Current User ID:', currentUser?.id);
  
  // Redirect to own profile only if no userId
  if (!userId) {
    window.location.href = '/profile';
    return null;
  }
  
  // Check if viewing own profile
  const isOwnProfile = userId === currentUser?.id;
  console.log('🔍 UserProfile - Is Own Profile?', isOwnProfile);

  // Invalidate queries when userId changes
  useEffect(() => {
    if (userId) {
      console.log('♻️ Refreshing data for userId:', userId);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['userPosts', userId] });
      queryClient.invalidateQueries({ queryKey: ['isFollowing', userId] });
    }
  }, [userId, queryClient]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => api.getProfileById(userId),
    enabled: !!userId,
  });

  // Fetch user posts
  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => api.getUserPosts(userId),
    enabled: !!userId,
  });

  // Check if following
  const { data: isFollowing, isLoading: followLoading } = useQuery({
    queryKey: ['isFollowing', userId],
    queryFn: () => api.isFollowing(userId),
    enabled: !!userId && !!currentUser,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: () => api.toggleFollow(userId),
    onSuccess: (newFollowState) => {
      queryClient.setQueryData(['isFollowing', userId], newFollowState);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', currentUser?.id] });
      
      toast({
        title: isRTL ? (newFollowState ? "تمت المتابعة" : "تم إلغاء المتابعة") : (newFollowState ? "Following" : "Unfollowed"),
        description: isRTL 
          ? (newFollowState ? `أنت الآن تتابع ${profile?.username}` : `لم تعد تتابع ${profile?.username}`)
          : (newFollowState ? `You are now following ${profile?.username}` : `You unfollowed ${profile?.username}`),
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: error.message || (isRTL ? "فشل تحديث المتابعة" : "Failed to update follow status"),
      });
    },
  });

  if (profileLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="w-8 h-8" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">{isRTL ? "الملف الشخصي غير موجود" : "Profile not found"}</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isRTL ? "العودة للرئيسية" : "Go back"}
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col w-full min-h-screen bg-background">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 p-6 md:py-10 max-w-4xl mx-auto w-full animate-in fade-in duration-500">
            
            {/* Avatar */}
            <div className="relative group">
                <div className="w-24 h-24 md:w-36 md:h-36 rounded-full p-1 border-2 border-border group-hover:border-primary transition-colors duration-300">
                    <img 
                        src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
                        alt={profile.username} 
                        className="w-full h-full object-cover rounded-full"
                    />
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col items-center md:items-start gap-4 text-center md:text-left">
                <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl md:text-3xl font-display font-bold">{profile.username}</h1>
                      {profile.is_verified && <VerifiedBadge size="lg" />}
                    </div>
                    {!isOwnProfile && (
                      <div className="flex gap-2">
                          <Button 
                            variant={isFollowing ? "secondary" : "default"} 
                            className="h-8 px-4 font-semibold rounded-lg"
                            onClick={() => followMutation.mutate()}
                            disabled={followMutation.isPending || followLoading}
                          >
                            {followMutation.isPending ? (
                              <Spinner className="w-4 h-4" />
                            ) : isFollowing ? (
                              isRTL ? "متابَع" : "Following"
                            ) : (
                              isRTL ? "متابعة" : "Follow"
                            )}
                          </Button>
                          <Link href={`/messages?user=${userId}`}>
                            <Button variant="secondary" className="h-8 px-4 font-semibold rounded-lg">
                              {isRTL ? "رسالة" : "Message"}
                            </Button>
                          </Link>
                      </div>
                    )}
                </div>

                <div className="flex items-center gap-6 md:gap-10 text-sm md:text-base">
                    <div className="flex flex-col md:flex-row gap-1 items-center md:items-baseline">
                        <span className="font-bold text-foreground">{profile.posts_count}</span>
                        <span className="text-muted-foreground">{isRTL ? "منشور" : "posts"}</span>
                    </div>
                    <button 
                      onClick={() => setShowFollowers(true)}
                      className="flex flex-col md:flex-row gap-1 items-center md:items-baseline hover:opacity-70 transition-opacity"
                    >
                        <span className="font-bold text-foreground">{profile.followers_count}</span>
                        <span className="text-muted-foreground">{isRTL ? "متابع" : "followers"}</span>
                    </button>
                    <button 
                      onClick={() => setShowFollowing(true)}
                      className="flex flex-col md:flex-row gap-1 items-center md:items-baseline hover:opacity-70 transition-opacity"
                    >
                        <span className="font-bold text-foreground">{profile.following_count}</span>
                        <span className="text-muted-foreground">{isRTL ? "متابَع" : "following"}</span>
                    </button>
                </div>

                <div className="max-w-md space-y-1">
                    <div className="font-bold text-md">{profile.full_name || profile.username}</div>
                    {profile.bio && (
                      <div className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground md:text-foreground">{profile.bio}</div>
                    )}
                    {profile.website && (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
                        {profile.website}
                      </a>
                    )}
                    {profile.location && (
                      <div className="text-sm text-muted-foreground">{profile.location}</div>
                    )}
                </div>
            </div>
        </div>

        {/* Tabs & Grid */}
        <div className="flex-1 border-t border-border mt-2">
            <Tabs defaultValue="posts" className="w-full">
                <div className="flex justify-center border-b border-border">
                    <TabsList className="h-12 bg-transparent gap-8">
                        <TabsTrigger value="posts" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none">
                            <Grid3X3 className="w-4 h-4" /> {isRTL ? "منشورات" : "POSTS"}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="posts" className="p-1 md:p-4 max-w-4xl mx-auto mt-0">
                    {postsLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Spinner className="w-6 h-6" />
                      </div>
                    ) : userPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Grid3X3 className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">{isRTL ? "لا توجد منشورات" : "No Posts Yet"}</h3>
                        <p className="text-muted-foreground">{isRTL ? "لم يشارك أي منشورات بعد" : "No posts shared yet"}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1 md:gap-4">
                        {userPosts.map((post) => (
                            <div key={post.id} className="relative aspect-square group cursor-pointer overflow-hidden bg-muted">
                                {post.image_url ? (
                                  <img src={post.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Post" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <Grid3X3 className="w-12 h-12 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 text-white font-bold">
                                    <div className="flex items-center gap-1"><Heart className="w-5 h-5 fill-white" /> {post.likes_count}</div>
                                    <div className="flex items-center gap-1"><MessageCircle className="w-5 h-5 fill-white" /> {post.comments_count}</div>
                                </div>
                            </div>
                        ))}
                      </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
      </div>

      {/* Followers Dialog */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? "المتابعون" : "Followers"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              {isRTL ? "قريباً..." : "Coming soon..."}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? "المتابَعون" : "Following"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              {isRTL ? "قريباً..." : "Coming soon..."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
