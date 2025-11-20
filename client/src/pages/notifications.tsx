import Layout from "@/components/layout";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { users } from "@/lib/dummy-data";
import { Link } from "wouter";

export default function Notifications() {
  const { language } = useLanguage();
  const t = getTranslation(language.code).notifications;

  const notifications = [
    { id: 1, user: users[1], type: "like", time: "2m", content: t.liked_your_photo },
    { id: 2, user: users[2], type: "follow", time: "15m", content: t.started_following },
    { id: 3, user: users[3], type: "comment", time: "2h", content: t.commented + "Great shot! 🔥" },
    { id: 4, user: users[1], type: "mention", time: "1d", content: t.mentioned },
    // Duplicates for demo scroll
    { id: 5, user: users[2], type: "like", time: "2d", content: t.liked_your_photo },
    { id: 6, user: users[3], type: "follow", time: "3d", content: t.started_following },
  ];

  return (
    <Layout>
      <div className="w-full min-h-screen bg-background p-4 md:p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">{t.title}</h1>

        <div className="space-y-6">
            {/* Time Sections */}
            <div>
                <h2 className="font-bold text-base mb-4 px-2">{t.this_week}</h2>
                <div className="space-y-2">
                    {notifications.slice(0, 3).map((notif) => (
                        <NotificationItem key={notif.id} notif={notif} t={t} />
                    ))}
                </div>
            </div>

            <div>
                <h2 className="font-bold text-base mb-4 px-2 border-t border-border pt-4">{t.this_month}</h2>
                <div className="space-y-2">
                    {notifications.slice(3).map((notif) => (
                        <NotificationItem key={notif.id} notif={notif} t={t} />
                    ))}
                </div>
            </div>
        </div>
      </div>
    </Layout>
  );
}

function NotificationItem({ notif, t }: { notif: any, t: any }) {
    return (
        <div className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-xl transition-colors">
            <div className="flex items-center gap-3">
                <Link href={`/user?id=${notif.user.id}`} className="relative hover:opacity-80 transition-opacity">
                    <Avatar className="w-11 h-11">
                        <AvatarImage src={notif.user.avatar} />
                        <AvatarFallback>{notif.user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                         {notif.type === 'like' && <div className="bg-red-500 rounded-full p-1"><Heart className="w-3 h-3 text-white fill-white" /></div>}
                         {notif.type === 'comment' && <div className="bg-blue-500 rounded-full p-1"><MessageCircle className="w-3 h-3 text-white fill-white" /></div>}
                         {notif.type === 'follow' && <div className="bg-purple-500 rounded-full p-1"><UserPlus className="w-3 h-3 text-white" /></div>}
                    </div>
                </Link>
                <div className="text-sm leading-snug">
                    <Link href={`/user?id=${notif.user.id}`} className="font-bold mr-1 hover:opacity-80 transition-opacity">
                        {notif.user.username}
                    </Link>
                    <span className="text-foreground/80">{notif.content}</span>
                    <span className="text-muted-foreground text-xs ml-2">{notif.time}</span>
                </div>
            </div>

            {notif.type === 'follow' ? (
                <Button size="sm" className="h-8 px-4 text-xs font-bold">{t.follow_back}</Button>
            ) : (
                <div className="w-10 h-10 bg-muted rounded-md overflow-hidden">
                     {/* Placeholder for post image */}
                     <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-500/20" />
                </div>
            )}
        </div>
    )
}
