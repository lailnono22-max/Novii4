import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Settings, Grid3X3, Bookmark, UserSquare2, Heart, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { Link } from "wouter";

export default function Profile() {
  const { user } = useAuth();

  // Fetch current user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.getCurrentProfile(),
    enabled: !!user,
  });

  // Fetch user posts
  const { data: userPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['userPosts', user?.id],
    queryFn: () => user ? api.getUserPosts(user.id) : [],
    enabled: !!user,
  });

  // Fetch saved posts
  const { data: savedPosts = [], isLoading: savedLoading } = useQuery({
    queryKey: ['savedPosts', user?.id],
    queryFn: () => api.getSavedPosts(),
    enabled: !!user,
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
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Profile not found</p>
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
                    <div className="flex gap-2">
                        <EditProfileDialog profile={profile}>
                          <Button variant="secondary" className="h-8 px-4 font-semibold rounded-lg">Edit Profile</Button>
                        </EditProfileDialog>
                        <Link href="/settings">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Settings className="w-5 h-5" /></Button>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-6 md:gap-10 text-sm md:text-base">
                    <div className="flex flex-col md:flex-row gap-1 items-center md:items-baseline">
                        <span className="font-bold text-foreground">{profile.posts_count}</span>
                        <span className="text-muted-foreground">posts</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-1 items-center md:items-baseline">
                        <span className="font-bold text-foreground">{profile.followers_count}</span>
                        <span className="text-muted-foreground">followers</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-1 items-center md:items-baseline">
                        <span className="font-bold text-foreground">{profile.following_count}</span>
                        <span className="text-muted-foreground">following</span>
                    </div>
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
                            <Grid3X3 className="w-4 h-4" /> POSTS
                        </TabsTrigger>
                        <TabsTrigger value="saved" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none">
                            <Bookmark className="w-4 h-4" /> SAVED
                        </TabsTrigger>
                        <TabsTrigger value="tagged" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:text-foreground text-muted-foreground px-4 gap-2 uppercase text-xs tracking-widest font-bold bg-transparent shadow-none">
                            <UserSquare2 className="w-4 h-4" /> TAGGED
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
                        <h3 className="text-xl font-bold mb-2">No Posts Yet</h3>
                        <p className="text-muted-foreground">Start sharing your moments!</p>
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
                
                <TabsContent value="saved" className="p-1 md:p-4 max-w-4xl mx-auto mt-0">
                    {savedLoading ? (
                      <div className="flex items-center justify-center py-10">
                        <Spinner className="w-6 h-6" />
                      </div>
                    ) : savedPosts.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <Bookmark className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Saved Posts</h3>
                        <p className="text-muted-foreground">Save posts to view them later</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1 md:gap-4">
                        {savedPosts.map((post) => (
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
                
                <TabsContent value="tagged" className="p-1 md:p-4 max-w-4xl mx-auto mt-0">
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <UserSquare2 className="w-16 h-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-bold mb-2">No Tagged Posts</h3>
                      <p className="text-muted-foreground">Posts you're tagged in will appear here</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>

      </div>
    </Layout>
  );
}
