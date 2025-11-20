import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "wouter";
import { Spinner } from "@/components/ui/spinner";

export default function SuggestionsSidebar() {
  const queryClient = useQueryClient();
  
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['suggestedUsers'],
    queryFn: () => api.getSuggestedUsers(5),
  });

  const followMutation = useMutation({
    mutationFn: (userId: string) => api.toggleFollow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return (
    <aside className="hidden xl:flex flex-col w-80 h-screen sticky top-0 p-6 pt-10 z-40">
      <div className="flex items-center justify-between mb-4">
        <span className="font-bold text-muted-foreground text-sm">Suggestions for you</span>
        <button className="text-xs font-bold hover:text-muted-foreground">See All</button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Spinner className="w-5 h-5" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {suggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <Link href={`/user?id=${user.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-bold text-sm leading-none">{user.username}</span>
                  <span className="text-xs text-muted-foreground mt-1 truncate w-32">
                    {user.full_name || 'Suggested for you'}
                  </span>
                </div>
              </Link>
              <button 
                onClick={() => followMutation.mutate(user.id)}
                disabled={followMutation.isPending}
                className="text-xs font-bold text-primary hover:text-primary/80 disabled:opacity-50"
              >
                {followMutation.isPending ? <Spinner className="w-3 h-3" /> : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto text-xs text-muted-foreground/50 space-y-2">
        <p>About • Help • Press • API • Jobs • Privacy • Terms</p>
        <p>© 2025 NOVII FROM REPLIT</p>
      </div>
    </aside>
  );
}
