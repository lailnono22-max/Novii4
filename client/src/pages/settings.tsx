import Layout from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch as ToggleSwitch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { languages, useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { 
  Search, Check, User, Lock, Star, Bell, Monitor, History, VolumeX, 
  MessageCircle, Heart, Users, Shield, Globe, Accessibility, HelpCircle, 
  Info, ChevronRight, ChevronLeft, Languages, HardDrive, CreditCard,
  LayoutDashboard, UserCog, BadgeCheck, EyeOff, AtSign, Share2,
  Archive, Download, Laptop, ShieldAlert,
  ExternalLink, ListTodo
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { AvatarUploader } from "@/components/avatar-uploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Type definition for menu items
type MenuItem = {
  id: string;
  labelKey: string;
  icon: any;
  isMeta?: boolean;
  isLink?: boolean;
  href?: string;
};

type MenuSection = {
  sectionKey: string;
  items: MenuItem[];
};

const settingsMenuStructure: MenuSection[] = [
  {
    sectionKey: "your_account",
    items: [
      { id: "accounts_center", labelKey: "accounts_center", icon: UserCog, isMeta: true },
    ]
  },
  {
    sectionKey: "how_you_use",
    items: [
      { id: "edit_profile", labelKey: "edit_profile", icon: User },
      { id: "notifications", labelKey: "notifications", icon: Bell },
      { id: "time_spent", labelKey: "time_spent", icon: History },
    ]
  },
  {
    sectionKey: "who_can_see",
    items: [
      { id: "account_privacy", labelKey: "account_privacy", icon: Lock },
      { id: "close_friends", labelKey: "close_friends", icon: Star },
      { id: "blocked", labelKey: "blocked", icon: Shield },
      { id: "hide_story", labelKey: "hide_story", icon: EyeOff },
    ]
  },
  {
    sectionKey: "how_others_interact",
    items: [
      { id: "messages", labelKey: "messages_replies", icon: MessageCircle },
      { id: "tags", labelKey: "tags", icon: AtSign },
      { id: "comments", labelKey: "comments", icon: MessageCircle },
      { id: "sharing", labelKey: "sharing", icon: Share2 },
      { id: "restricted", labelKey: "restricted", icon: ShieldAlert },
      { id: "hidden_words", labelKey: "hidden_words", icon: MessageCircle },
    ]
  },
  {
    sectionKey: "what_you_see",
    items: [
      { id: "favorites", labelKey: "favorites", icon: Star },
      { id: "muted", labelKey: "muted", icon: VolumeX },
      { id: "content_pref", labelKey: "content_pref", icon: LayoutDashboard },
      { id: "like_counts", labelKey: "like_counts", icon: Heart },
    ]
  },
  {
    sectionKey: "app_and_media",
    items: [
      { id: "archiving", labelKey: "archiving", icon: Download },
      { id: "accessibility", labelKey: "accessibility", icon: Accessibility },
      { id: "language", labelKey: "language", icon: Languages },
      { id: "website_permissions", labelKey: "website_permissions", icon: Laptop },
    ]
  },
  {
    sectionKey: "for_families",
    items: [
      { id: "supervision", labelKey: "supervision", icon: Users },
    ]
  },
  {
    sectionKey: "for_professionals",
    items: [
      { id: "account_type", labelKey: "account_type", icon: LayoutDashboard },
      { id: "verified", labelKey: "verified", icon: BadgeCheck },
    ]
  },
  {
    sectionKey: "more_info",
    items: [
      { id: "help", labelKey: "help", icon: HelpCircle },
      { id: "privacy_center", labelKey: "privacy_center", icon: Lock },
      { id: "about", labelKey: "about", icon: Info },
      { id: "dev_tasks", labelKey: "dev_tasks", icon: ListTodo, isLink: true, href: "/tasks" },
    ]
  }
];

export default function Settings() {
  const { language, setLanguage, direction } = useLanguage();
  const t = getTranslation(language.code).settings;
  const [activeTab, setActiveTab] = useState("edit_profile");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch current user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.getCurrentProfile(),
    enabled: !!user,
  });

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    bio: "",
    website: "",
    location: "",
    avatar_url: "",
  });
  const [gender, setGender] = useState("male");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        bio: profile.bio || "",
        website: profile.website || "",
        location: profile.location || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Upload avatar first if a file is selected
      if (selectedFile) {
        const avatarUrl = await api.uploadAvatar(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
        data.avatar_url = avatarUrl;
      }
      const result = await api.updateProfile(data);
      return result;
    },
    onSuccess: (updatedProfile) => {
      // Update all profile queries immediately
      queryClient.setQueryData(['profile', user?.id], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      
      toast.success("Profile updated successfully!");
      setSelectedFile(null);
      setPreviewUrl("");
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile");
      setUploadProgress(0);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl("");
  };
  
  const filteredLanguages = languages.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.nativeName.toLowerCase().includes(search.toLowerCase())
  );

  const Chevron = direction === 'rtl' ? ChevronLeft : ChevronRight;

  const renderContent = () => {
    switch (activeTab) {
      case "edit_profile":
        if (profileLoading) {
          return (
            <div className="flex items-center justify-center py-20">
              <Spinner className="w-8 h-8" />
            </div>
          );
        }

        if (!profile) {
          return (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Profile not found</p>
            </div>
          );
        }

        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-8">{t.edit_profile_title}</h2>
            
            {/* Avatar Uploader */}
            <div className="mb-8">
              <AvatarUploader
                currentAvatar={formData.avatar_url}
                username={profile.username}
                onFileSelect={handleFileSelect}
                onRemove={handleRemovePhoto}
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                isUploading={updateProfileMutation.isPending}
                uploadProgress={uploadProgress}
              />
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="font-bold text-lg">Username</h3>
                    <Input 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="Username" 
                      className="bg-card border-border" 
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-lg">Full Name</h3>
                    <Input 
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      placeholder="Full name" 
                      className="bg-card border-border" 
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-lg">{t.website}</h3>
                    <Input 
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder={t.website} 
                      className="bg-card border-border" 
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-lg">Location</h3>
                    <Input 
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="City, Country" 
                      className="bg-card border-border" 
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between">
                        <h3 className="font-bold text-lg">{t.bio}</h3>
                        <span className="text-xs text-muted-foreground">{formData.bio.length} / 150</span>
                    </div>
                    <Textarea 
                        value={formData.bio} 
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        className="bg-card border-border min-h-[100px]"
                        maxLength={150}
                    />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-lg">{t.gender}</h3>
                    <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger className="bg-card border-border">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="nottosay">Prefer not to say</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        This won't be part of your public profile.
                    </p>
                </div>

                <div className="space-y-4 py-4 border-t border-border">
                     <h3 className="font-bold text-lg">{t.show_suggestions}</h3>
                     <div className="flex items-center justify-between gap-4 border border-border rounded-xl p-4 bg-card">
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm">{t.show_suggestions}</span>
                            <span className="text-xs text-muted-foreground">
                                Choose whether people can see similar account suggestions on your profile, and whether your account can be suggested on other profiles.
                            </span>
                        </div>
                        <ToggleSwitch defaultChecked />
                     </div>
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-bold rounded-xl"
                >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Spinner className="w-5 h-5 mr-2" />
                        Saving...
                      </>
                    ) : (
                      t.submit
                    )}
                </Button>
            </div>
          </div>
        );

      case "language":
        return (
          <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <h2 className="text-2xl font-bold mb-4">{t.language}</h2>
            <div className="relative mb-6">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4", direction === 'rtl' ? "right-3" : "left-3")} />
              <Input 
                placeholder="Search" 
                className={cn("bg-card border-border", direction === 'rtl' ? "pr-10" : "pl-10")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                    language.code === lang.code 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-accent"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{lang.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{lang.name}</span>
                  </div>
                  {language.code === lang.code && (
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
    
      default:
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in duration-300 pb-20">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-6">
                    <SettingsIconForTab id={activeTab} className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Settings Section</h2>
                <p className="text-muted-foreground max-w-md">
                    This section ({activeTab}) is under construction. 
                    Please check "Edit Profile" or "Language" for implemented features.
                </p>
            </div>
        );
    }
  };

  const SettingsIconForTab = ({ id, className }: { id: string, className?: string }) => {
      for (const section of settingsMenuStructure) {
          const item = section.items.find(i => i.id === id);
          if (item) {
              const Icon = item.icon;
              return <Icon className={className} />;
          }
      }
      return <LayoutDashboard className={className} />;
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row w-full h-screen bg-background overflow-hidden">
        
        {/* Settings Sidebar - Mobile: Full width until item selected (logic needed for mobile drilldown, but for now split) */}
        {/* For this mockup, we'll keep side-by-side on desktop, and just list on mobile */}
        
        <div className={cn(
            "w-full md:w-[320px] lg:w-[380px] flex flex-col border-e border-border bg-card/30 h-full",
            // On mobile, if we were doing full drilldown, we'd hide this when activeTab is selected. 
            // But for simplicity in mockup:
            "md:flex" 
        )}>
            <div className="p-6 pb-2">
                <h1 className="text-2xl font-bold">{t.title}</h1>
            </div>
            
            <ScrollArea className="flex-1 px-4">
                <div className="bg-card border border-border rounded-xl p-4 mb-6 mt-2 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors group">
                    <div className="flex items-center gap-2 mb-3 text-[#0064e0]">
                        <Monitor className="w-5 h-5" />
                        <span className="font-bold text-sm">Novii</span>
                    </div>
                    <h3 className="font-bold text-lg mb-1">{t.accounts_center}</h3>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                        {t.meta_desc}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <User className="w-4 h-4" />
                        <span>{t.personal_details}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Shield className="w-4 h-4" />
                        <span>{t.password_security}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <CreditCard className="w-4 h-4" />
                        <span>{t.ad_preferences}</span>
                    </div>
                    <div className="text-[#0095f6] text-sm font-semibold mt-2 group-hover:underline">
                        {t.see_more}
                    </div>
                </div>

                <div className="pb-32 space-y-6">
                    {settingsMenuStructure.map((section, idx) => (
                        <div key={idx}>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                                {(t as any)[section.sectionKey]}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    if (item.isLink && item.href) {
                                        return (
                                            <Link href={item.href} key={item.id}>
                                                <a className="w-full flex items-center gap-4 p-3 rounded-lg text-sm font-medium transition-colors text-left hover:bg-accent text-muted-foreground hover:text-foreground">
                                                    <item.icon className="w-5 h-5" />
                                                    <span className="flex-1">{(t as any)[item.labelKey]}</span>
                                                    <ExternalLink className="w-4 h-4 text-muted-foreground/50" />
                                                </a>
                                            </Link>
                                        )
                                    }
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-3 rounded-lg text-sm font-medium transition-colors text-left",
                                                activeTab === item.id 
                                                    ? "bg-secondary text-foreground" 
                                                    : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="flex-1">{(t as any)[item.labelKey]}</span>
                                            {item.id === "language" && (
                                                <span className="text-xs text-muted-foreground mx-2 truncate max-w-[80px]">
                                                    {languages.find(l => l.code === language.code)?.nativeName}
                                                </span>
                                            )}
                                            <Chevron className="w-4 h-4 text-muted-foreground/50" />
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* Content Area - Hidden on mobile for now to keep list view usable, but typically would overlay */}
        <div className="hidden md:flex flex-1 flex-col h-full overflow-y-auto bg-background">
            <div className="p-8 pb-20">
                {renderContent()}
            </div>
            
            <footer className="mt-auto py-8 text-center text-xs text-muted-foreground border-t border-border mx-8">
                <div className="flex flex-wrap justify-center gap-4 mb-2">
                    <span>Novii</span>
                    <span>About</span>
                    <span>Blog</span>
                    <span>Jobs</span>
                    <span>Help</span>
                    <span>API</span>
                    <span>Privacy</span>
                    <span>Terms</span>
                    <span>Locations</span>
                    <span>Novii Lite</span>
                    <span>Contact Uploading & Non-Users</span>
                    <span>Novii Verified</span>
                </div>
                <p>© 2025 NOVII FROM REPLIT</p>
            </footer>
        </div>

      </div>
    </Layout>
  );
}
