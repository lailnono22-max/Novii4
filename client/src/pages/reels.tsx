import Layout from "@/components/layout";
import { Heart, MessageCircle, Share2, MoreHorizontal, Music2, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Import generated reels thumbnails
import travelThumb from "@assets/generated_images/cinematic_travel_video_thumbnail.png";
import foodThumb from "@assets/generated_images/cooking_recipe_video_thumbnail.png";
import fitnessThumb from "@assets/generated_images/fitness_workout_video_thumbnail.png";
import catThumb from "@assets/generated_images/funny_cat_video_thumbnail.png";
import { users } from "@/lib/dummy-data";

interface Reel {
  id: string;
  video: string; // Using image as placeholder for video thumbnail
  user: typeof users[0];
  caption: string;
  likes: string;
  comments: string;
  song: string;
}

const reelsData: Reel[] = [
  {
    id: "r1",
    video: travelThumb,
    user: users[1],
    caption: "Road trip through the autumn leaves 🍂🍁 #travel #fall #vibes",
    likes: "45.2K",
    comments: "1.2K",
    song: "Chill Lo-Fi Beats - Original Audio",
  },
  {
    id: "r2",
    video: foodThumb,
    user: users[2],
    caption: "Sunday breakfast goals 🥞🍓 #pancakes #foodie #recipe",
    likes: "128K",
    comments: "3.4K",
    song: "Morning Jazz - Cafe Vibes",
  },
  {
    id: "r3",
    video: fitnessThumb,
    user: users[3],
    caption: "Morning yoga flow by the cliffs 🧘‍♀️✨ #yoga #mindfulness",
    likes: "22.5K",
    comments: "856",
    song: "Serenity - Nature Sounds",
  },
  {
    id: "r4",
    video: catThumb,
    user: users[0],
    caption: "He thinks he's cool 😎🐱 #catsoftiktok #funny",
    likes: "500K",
    comments: "12K",
    song: "Skater Boy - Punk Rock Cover",
  },
];

export default function Reels() {
  const [activeReelId, setActiveReelId] = useState(reelsData[0].id);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple Intersection Observer to detect which reel is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-id");
            if (id) setActiveReelId(id);
          }
        });
      },
      { threshold: 0.6 } 
    );

    const elements = document.querySelectorAll(".reel-container");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <Layout>
      <div 
        ref={containerRef}
        className="h-[calc(100vh-4rem)] md:h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-background transition-colors duration-300"
      >
        {reelsData.map((reel) => (
          <div 
            key={reel.id} 
            data-id={reel.id}
            className="reel-container relative w-full h-full snap-start flex items-center justify-center bg-background transition-colors duration-300"
          >
            {/* Video Content (Image Placeholder) */}
            <div className="relative w-full h-full md:h-[90%] md:w-[400px] md:rounded-xl overflow-hidden bg-black shadow-2xl">
               <img 
                 src={reel.video} 
                 alt="Reel" 
                 className="w-full h-full object-cover opacity-90"
               />
               
               {/* Gradient Overlay */}
               <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />

               {/* Right Sidebar Actions */}
               <div className="absolute bottom-20 right-4 flex flex-col items-center gap-6 z-20">
                  <div className="flex flex-col items-center gap-1">
                    <button className="p-2 rounded-full hover:bg-black/20 transition-colors group">
                        <Heart className={cn("w-8 h-8 stroke-[2px]", activeReelId === reel.id ? "animate-pulse" : "")} color="white" />
                    </button>
                    <span className="text-white text-xs font-medium">{reel.likes}</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1">
                    <button className="p-2 rounded-full hover:bg-black/20 transition-colors">
                        <MessageCircle className="w-8 h-8 stroke-[2px]" color="white" />
                    </button>
                    <span className="text-white text-xs font-medium">{reel.comments}</span>
                  </div>

                  <button className="p-2 rounded-full hover:bg-black/20 transition-colors">
                      <Share2 className="w-8 h-8 stroke-[2px]" color="white" />
                  </button>

                  <button className="p-2 rounded-full hover:bg-black/20 transition-colors">
                      <MoreHorizontal className="w-6 h-6 stroke-[2px]" color="white" />
                  </button>

                  <div className="w-8 h-8 rounded-md border-2 border-white overflow-hidden mt-2">
                      <img src={reel.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reel.user?.username}`} className="w-full h-full object-cover" />
                  </div>
               </div>

               {/* Bottom Info */}
               <div className="absolute bottom-4 left-4 right-16 z-20 text-white">
                  <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-9 h-9 border border-white/50">
                          <AvatarImage src={reel.user.avatar} />
                          <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm hover:underline cursor-pointer">{reel.user.username}</span>
                      <button className="px-2 py-1 rounded-md border border-white/40 text-xs font-semibold backdrop-blur-sm hover:bg-white/20 transition-colors">
                          Follow
                      </button>
                  </div>
                  
                  <p className="text-sm mb-4 line-clamp-2 leading-relaxed">
                      {reel.caption}
                  </p>

                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full w-fit">
                      <Music2 className="w-3 h-3" />
                      <div className="text-xs font-medium w-32 truncate overflow-hidden">
                          <span className="animate-marquee whitespace-nowrap">{reel.song}</span>
                      </div>
                  </div>
               </div>

               {/* Top Camera Icon (Mobile only usually) */}
               <div className="absolute top-4 right-4 md:hidden">
                  <Camera className="w-6 h-6 text-white" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
