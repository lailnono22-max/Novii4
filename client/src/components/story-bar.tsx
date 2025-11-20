import type { Story } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface StoryBarProps {
  stories: Story[];
  currentUserAvatar: string;
}

export default function StoryBar({ stories, currentUserAvatar }: StoryBarProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-4 px-4 md:px-0">
      <div className="flex items-center gap-4 min-w-max">
        {/* Current User "Add Story" */}
        <div className="flex flex-col items-center gap-1 cursor-pointer group">
          <div className="relative w-16 h-16 md:w-20 md:h-20">
            <div className="w-full h-full rounded-full p-[2px] border border-border/50">
                 <img 
                    src={currentUserAvatar} 
                    alt="Your Story" 
                    className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105" 
                 />
            </div>
            <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 border-2 border-background">
                <Plus className="w-3 h-3 md:w-4 md:h-4" strokeWidth={3} />
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-medium">You</span>
        </div>

        {/* Other Stories */}
        {stories.map((story, index) => {
            // Mock "Live" status for the 3rd story (index 2)
            const isLive = index === 2;
            
            return (
            <div key={story.id} className="flex flex-col items-center gap-1 cursor-pointer group">
                <div className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-full p-[2px] transition-all duration-300 relative",
                    isLive ? "live-ring" : "",
                    !story.is_viewed 
                        ? "bg-gradient-to-tr from-yellow-400 via-orange-500 to-primary" 
                        : "bg-border",
                    isLive && "bg-destructive border-none"
                )}>
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-background relative z-10">
                    <img 
                        src={story.profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + story.user_id} 
                        alt={story.profile?.username} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    />
                </div>
                {isLive && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-destructive text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider border-2 border-background">
                        Live
                    </div>
                )}
                </div>
                <span className="text-xs text-muted-foreground font-medium truncate max-w-[70px] text-center">
                    {story.profile?.username}
                </span>
            </div>
            );
        })}
      </div>
    </div>
  );
}
