import Layout from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Edit, 
  Search, 
  Camera, 
  Phone, 
  Video, 
  Info, 
  Image as ImageIcon, 
  Heart, 
  Smile, 
  Mic, 
  MessageCircle,
  Send,
  MoreVertical,
  ChevronLeft
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";

export default function Messages() {
  const { language, direction } = useLanguage();
  const t = getTranslation(language.code).messages;
  const { user: currentUser } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRTL = direction === "rtl";

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
    enabled: !!currentUser,
  });

  // Fetch messages for selected user
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', selectedUserId],
    queryFn: () => selectedUserId ? api.getMessages(selectedUserId) : Promise.resolve([]),
    enabled: !!selectedUserId && !!currentUser,
  });

  // Fetch selected user profile (for when starting a new conversation)
  const { data: selectedUserProfile } = useQuery({
    queryKey: ['profile', selectedUserId],
    queryFn: () => selectedUserId ? api.getProfileById(selectedUserId) : Promise.resolve(null),
    enabled: !!selectedUserId && !!currentUser,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: string; content: string }) =>
      api.sendMessage(receiverId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageInput("");
    },
  });

  // Check if user came from profile (URL param: ?user=userId)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const targetUserId = searchParams.get('user');
    
    if (targetUserId) {
      setSelectedUserId(targetUserId);
    }
  }, [location]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscription for new messages and typing indicators
  useEffect(() => {
    if (!currentUser || !selectedUserId) return;
    
    console.log('🔔 Setting up real-time subscription for messages with user:', selectedUserId);

    // Create unique channel name for this conversation
    const userIds = [currentUser.id, selectedUserId].sort();
    const channelName = `chat-${userIds[0]}-${userIds[1]}`;

    const channel = supabase
      .channel(channelName)
      // Listen for new messages
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload: any) => {
          const newMessage = payload.new;
          console.log('📨 New message received via real-time:', newMessage);
          
          // Check if this message is relevant to current conversation
          const isRelevant = 
            (newMessage.sender_id === currentUser.id && newMessage.receiver_id === selectedUserId) ||
            (newMessage.sender_id === selectedUserId && newMessage.receiver_id === currentUser.id);
          
          if (isRelevant) {
            console.log('✅ Message is relevant, updating UI');
            // Invalidate messages query to refetch and show new message
            queryClient.invalidateQueries({ queryKey: ['messages', selectedUserId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
        }
      )
      // Listen for typing events
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        console.log('⌨️ Typing event received:', payload);
        const { userId, isTyping: typing } = payload.payload;
        
        // Only show typing if it's from the other person
        if (userId === selectedUserId) {
          setIsTyping(typing);
          
          // Auto-hide typing indicator after 3 seconds
          if (typing && typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          if (typing) {
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
            }, 3000);
          }
        }
      })
      .subscribe((status: any) => {
        console.log('📡 Realtime subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔕 Cleaning up real-time subscription');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedUserId, queryClient]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedUserId) {
      // Send typing stopped event
      sendTypingEvent(false);
      
      sendMessageMutation.mutate({
        receiverId: selectedUserId,
        content: messageInput.trim(),
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Send typing indicator to other user
  const sendTypingEvent = (typing: boolean) => {
    if (!currentUser || !selectedUserId) return;
    
    const userIds = [currentUser.id, selectedUserId].sort();
    const channelName = `chat-${userIds[0]}-${userIds[1]}`;
    
    supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUser.id, isTyping: typing }
    });
  };

  // Handle input change and send typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Send typing started event
    if (value.length > 0) {
      sendTypingEvent(true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to send typing stopped after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingEvent(false);
      }, 2000);
    } else {
      sendTypingEvent(false);
    }
  };

  // Find existing conversation or create temporary one from selected user profile
  const selectedConversation = selectedUserId 
    ? conversations.find(c => c.user?.id === selectedUserId) || (selectedUserProfile ? {
        user: selectedUserProfile,
        lastMessage: null
      } : null)
    : null;

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">{isRTL ? "يرجى تسجيل الدخول لعرض الرسائل" : "Please log in to view messages"}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] md:h-screen w-full bg-background text-foreground overflow-hidden border-t border-border md:border-0">
        
        {/* Conversations Sidebar */}
        <div className={cn(
          "w-full md:w-[400px] flex flex-col border-e border-border bg-background",
          selectedUserId ? "hidden md:flex" : "flex"
        )}>
          
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl">{currentUser?.user_metadata?.username || "Messages"}</span>
            </div>
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Edit className="w-5 h-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-border">
             <div className="relative">
                <Search className={cn(
                  "absolute top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4", 
                  isRTL ? "right-3" : "left-3"
                )} />
                <Input 
                  placeholder={t.search_placeholder || "Search..."} 
                  className={cn(
                      "bg-secondary border-none rounded-xl h-10 placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary",
                      isRTL ? "pr-10 text-right" : "pl-10"
                  )} 
                />
             </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner className="w-6 h-6" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">{isRTL ? "لا توجد محادثات بعد" : "No conversations yet"}</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {conversations.map((conv: any) => (
                  <button
                    key={conv.user?.id}
                    onClick={() => setSelectedUserId(conv.user?.id)}
                    className={cn(
                      "flex items-center gap-3 p-4 hover:bg-accent cursor-pointer transition-all duration-200 border-b border-border/50 last:border-0 text-left",
                      selectedUserId === conv.user?.id && "bg-accent"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="w-14 h-14">
                        <AvatarImage src={conv.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.user?.username}`} />
                        <AvatarFallback>{conv.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate">{conv.user?.full_name || conv.user?.username}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                          {new Date(conv.lastMessage?.created_at).toLocaleDateString(isRTL ? 'ar' : 'en', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate flex-1">{conv.lastMessage?.content}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn(
            "flex-1 flex flex-col bg-background",
            selectedUserId ? "flex" : "hidden md:flex"
        )}>
            {selectedUserId && selectedConversation ? (
                <>
                    {/* Chat Header */}
                    <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-background shrink-0">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="md:hidden hover:bg-accent"
                                onClick={() => setSelectedUserId(null)}
                            >
                                <ChevronLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
                            </Button>
                            <Link href={`/user?id=${selectedConversation.user?.id}`}>
                                <Avatar className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity">
                                    <AvatarImage src={selectedConversation.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.user?.username}`} />
                                    <AvatarFallback>{selectedConversation.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex flex-col min-w-0 flex-1">
                                <Link href={`/user?id=${selectedConversation.user?.id}`} className="font-semibold text-sm truncate hover:opacity-80 transition-opacity">
                                    {selectedConversation.user?.full_name || selectedConversation.user?.username}
                                </Link>
                                <span className="text-xs text-muted-foreground">
                                  {isRTL ? "نشط" : "Active"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="hover:bg-accent">
                              <Phone className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:bg-accent">
                              <Video className="w-5 h-5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="hover:bg-accent">
                              <Info className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <ScrollArea className="flex-1 p-4 bg-background">
                        {messagesLoading ? (
                          <div className="flex items-center justify-center py-10">
                            <Spinner className="w-6 h-6" />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 max-w-3xl mx-auto">
                            {messages.map((msg: any) => {
                              const isMe = msg.sender_id === currentUser?.id;
                              
                              return (
                                <div 
                                    key={msg.id} 
                                    className={cn(
                                        "flex w-full gap-2 animate-in slide-in-from-bottom-2 duration-300",
                                        isMe ? "justify-end" : "justify-start"
                                    )}
                                >
                                    {!isMe && (
                                        <Avatar className="w-8 h-8 mt-1">
                                            <AvatarImage src={selectedConversation.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.user?.username}`} />
                                            <AvatarFallback>{selectedConversation.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "max-w-[70%] rounded-3xl px-4 py-2 text-sm shadow-sm",
                                        isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                              );
                            })}
                            
                            {/* Typing Indicator */}
                            {isTyping && (
                              <div className="flex w-full justify-start gap-2 animate-in slide-in-from-bottom-2 duration-300">
                                <Avatar className="w-8 h-8 mt-1">
                                  <AvatarImage src={selectedConversation.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConversation.user?.username}`} />
                                  <AvatarFallback>{selectedConversation.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="max-w-[70%] rounded-3xl px-4 py-3 bg-secondary text-foreground shadow-sm">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t border-border bg-background shrink-0">
                        <div className="flex items-center gap-2 max-w-3xl mx-auto">
                            <Button variant="ghost" size="icon" className="hover:bg-accent flex-shrink-0">
                                <ImageIcon className="w-5 h-5" />
                            </Button>
                            <Input 
                                value={messageInput}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."} 
                                className={cn(
                                    "flex-1 rounded-full bg-secondary border-none focus-visible:ring-1 focus-visible:ring-primary",
                                    isRTL && "text-right"
                                )}
                            />
                            <Button 
                              onClick={handleSendMessage}
                              disabled={!messageInput.trim() || sendMessageMutation.isPending}
                              size="icon" 
                              className="rounded-full flex-shrink-0"
                            >
                                {sendMessageMutation.isPending ? (
                                  <Spinner className="w-5 h-5" />
                                ) : (
                                  <Send className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      {isRTL ? "رسائلك" : "Your Messages"}
                    </h3>
                    <p className="text-muted-foreground max-w-sm">
                      {isRTL ? "أرسل رسائل خاصة إلى صديق أو مجموعة" : "Send private messages to a friend or group"}
                    </p>
                </div>
            )}
        </div>
      </div>
    </Layout>
  );
}
