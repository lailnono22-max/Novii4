import type { Post } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { useToggleLike, useToggleSave } from "@/hooks/use-data";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { Link } from "wouter";

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [isDoubleTapLiked, setIsDoubleTapLiked] = useState(false);
  const toggleLike = useToggleLike();
  const toggleSave = useToggleSave();

  const handleLike = () => {
    toggleLike.mutate(post.id);
  };

  const handleSave = () => {
    toggleSave.mutate(post.id);
  };

  const handleDoubleTap = () => {
    if (!post.is_liked) {
      toggleLike.mutate(post.id);
    }
    setIsDoubleTapLiked(true);
    setTimeout(() => setIsDoubleTapLiked(false), 1000);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ar });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex flex-col w-full bg-card border-b border-border md:border md:rounded-3xl overflow-hidden mb-6 animate-in fade-in-50 slide-in-from-bottom-5 duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link href={`/user?id=${post.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar className="w-10 h-10 border border-border/50">
            <AvatarImage src={post.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + post.user_id} alt={post.profile?.username} />
            <AvatarFallback>{post.profile?.username?.[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm">{post.profile?.username}</span>
              {post.profile?.is_verified && <VerifiedBadge size="sm" />}
            </div>
            <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Image */}
      <div 
        className="relative w-full aspect-square md:aspect-[4/5] bg-muted overflow-hidden cursor-pointer group"
        onDoubleClick={handleDoubleTap}
      >
        <img 
            src={post.image_url || "https://via.placeholder.com/600x600?text=No+Image"} 
            alt="Post content" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
        />
        
        {/* Heart Animation Overlay */}
        <div className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
            isDoubleTapLiked ? "opacity-100" : "opacity-0"
        )}>
            <Heart className="w-24 h-24 text-white fill-white animate-bounce drop-shadow-2xl" />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button 
                onClick={handleLike}
                className="group focus:outline-none"
                data-testid={`button-like-${post.id}`}
            >
                <Heart className={cn(
                    "w-7 h-7 transition-all duration-200 group-active:scale-75",
                    post.is_liked ? "fill-destructive text-destructive" : "text-foreground hover:text-muted-foreground"
                )} />
            </button>
            
            <button className="group focus:outline-none hover:text-muted-foreground transition-colors">
                <MessageCircle className="w-7 h-7 -rotate-90" />
            </button>

            <button className="group focus:outline-none hover:text-muted-foreground transition-colors">
                <Share2 className="w-7 h-7" />
            </button>
        </div>

        <button 
          onClick={handleSave}
          className="group focus:outline-none hover:text-muted-foreground transition-colors"
        >
            <Bookmark className={cn(
              "w-7 h-7 transition-all duration-200",
              post.is_saved ? "fill-foreground text-foreground" : ""
            )} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-6 space-y-2">
        <div className="font-bold text-sm">{post.likes_count.toLocaleString()} إعجاب</div>
        <div className="text-sm">
            <Link href={`/user?id=${post.user_id}`} className="inline-flex items-center gap-1 font-bold mr-2 hover:opacity-80 transition-opacity">
              {post.profile?.username}
              {post.profile?.is_verified && <VerifiedBadge size="sm" />}
            </Link>
            <span className="text-foreground/90 leading-relaxed">{post.caption}</span>
        </div>
        {post.comments_count > 0 && (
            <div className="text-muted-foreground text-sm font-medium cursor-pointer hover:text-foreground transition-colors">
                عرض جميع التعليقات ({post.comments_count})
            </div>
        )}
      </div>
    </div>
  );
}
