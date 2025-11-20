import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { useCreatePost } from "@/hooks/use-data";
import { 
  X, 
  Image as ImageIcon, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  ChevronDown,
  Users,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImagePreview {
  url: string;
  file: File;
  filter?: string;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

type PostStep = 'select' | 'crop' | 'filter' | 'details';

const FILTERS = [
  { id: 'none', name: 'Original', nameAr: 'الأصل', cssClass: '' },
  { id: 'clarendon', name: 'Clarendon', nameAr: 'Clarendon', cssClass: 'brightness-110 contrast-110' },
  { id: 'gingham', name: 'Gingham', nameAr: 'Gingham', cssClass: 'hue-rotate-15' },
  { id: 'moon', name: 'Moon', nameAr: 'Moon', cssClass: 'grayscale brightness-110 contrast-110' },
  { id: 'lark', name: 'Lark', nameAr: 'Lark', cssClass: 'contrast-90' },
  { id: 'reyes', name: 'Reyes', nameAr: 'Reyes', cssClass: 'sepia-20 brightness-110 contrast-75 saturate-75' },
  { id: 'juno', name: 'Juno', nameAr: 'Juno', cssClass: 'sepia-20 brightness-110 contrast-110 saturate-125' },
  { id: 'slumber', name: 'Slumber', nameAr: 'Slumber', cssClass: 'saturate-75 brightness-110' },
  { id: 'crema', name: 'Crema', nameAr: 'Crema', cssClass: 'sepia-40' },
  { id: 'ludwig', name: 'Ludwig', nameAr: 'Ludwig', cssClass: 'brightness-110 contrast-110 saturate-110' },
  { id: 'aden', name: 'Aden', nameAr: 'Aden', cssClass: 'hue-rotate-30 contrast-90 saturate-75' },
  { id: 'perpetua', name: 'Perpetua', nameAr: 'Perpetua', cssClass: 'contrast-110 brightness-110' },
];

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const { direction } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const createPostMutation = useCreatePost();
  
  const [currentStep, setCurrentStep] = useState<PostStep>('select');
  const [caption, setCaption] = useState("");
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [hidelikeCount, setHideLikeCount] = useState(false);
  const [hideComments, setHideComments] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isRTL = direction === "rtl";

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const newImages = imageFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file: file,
        filter: 'none'
      }));
      setSelectedImages([...selectedImages, ...newImages]);
      if (selectedImages.length === 0 && newImages.length > 0) {
        setCurrentStep('crop');
      }
    }
  }, [selectedImages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => ({
        url: URL.createObjectURL(file),
        file: file,
        filter: 'none'
      }));
      setSelectedImages([...selectedImages, ...newImages]);
      if (selectedImages.length === 0 && newImages.length > 0) {
        setCurrentStep('crop');
      }
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(selectedImages[index].url);
    const newImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    
    if (newImages.length === 0) {
      setCurrentStep('select');
    }
    
    if (currentImageIndex >= newImages.length) {
      setCurrentImageIndex(Math.max(0, newImages.length - 1));
    }
  };

  const handlePost = async () => {
    if (selectedImages.length === 0) {
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: isRTL ? "يرجى إضافة صورة واحدة على الأقل" : "Please add at least one image",
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const imageUrl = await api.uploadPostImage(
        selectedImages[0].file,
        (progress) => setUploadProgress(progress)
      );

      await createPostMutation.mutateAsync({
        caption,
        imageUrl,
        location: location || undefined,
      });

      selectedImages.forEach(img => URL.revokeObjectURL(img.url));

      // Reset form
      setCaption("");
      setSelectedImages([]);
      setLocation("");
      setCurrentImageIndex(0);
      setUploadProgress(0);
      setCurrentStep('select');
      setSelectedFilter('none');
      setShowAdvanced(false);
      setHideLikeCount(false);
      setHideComments(false);
      onOpenChange(false);

      toast({
        title: isRTL ? "تم النشر!" : "Posted!",
        description: isRTL ? "تم نشر المنشور بنجاح" : "Your post has been published successfully",
      });
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: error.message || (isRTL ? "فشل نشر المنشور" : "Failed to create post"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % selectedImages.length);
  };

  const previousImage = () => {
    setCurrentImageIndex(
      (prev) => (prev - 1 + selectedImages.length) % selectedImages.length
    );
  };

  const goToNextStep = () => {
    if (currentStep === 'select') setCurrentStep('crop');
    else if (currentStep === 'crop') setCurrentStep('filter');
    else if (currentStep === 'filter') setCurrentStep('details');
  };

  const goToPreviousStep = () => {
    if (currentStep === 'details') setCurrentStep('filter');
    else if (currentStep === 'filter') setCurrentStep('crop');
    else if (currentStep === 'crop') setCurrentStep('select');
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'select':
        return isRTL ? "إنشاء منشور جديد" : "Create new post";
      case 'crop':
        return isRTL ? "اقتصاص" : "Crop";
      case 'filter':
        return isRTL ? "تعديل" : "Edit";
      case 'details':
        return isRTL ? "إنشاء منشور جديد" : "Create new post";
      default:
        return isRTL ? "إنشاء منشور جديد" : "Create new post";
    }
  };

  const canGoNext = () => {
    return selectedImages.length > 0 && currentStep !== 'details';
  };

  const canGoBack = () => {
    return currentStep !== 'select';
  };

  const applyFilter = (filterId: string) => {
    setSelectedFilter(filterId);
    const newImages = [...selectedImages];
    newImages[currentImageIndex] = {
      ...newImages[currentImageIndex],
      filter: filterId
    };
    setSelectedImages(newImages);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        multiple
        onChange={handleImageSelect}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              {canGoBack() && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousStep}
                  className="absolute left-4"
                >
                  <ChevronLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
                </Button>
              )}
              
              <DialogTitle className="text-center font-semibold flex-1">
                {getStepTitle()}
              </DialogTitle>
              
              {canGoNext() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToNextStep}
                  className="absolute right-4 text-primary font-semibold"
                >
                  {isRTL ? "التالي" : "Next"}
                </Button>
              )}
              
              {currentStep === 'details' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePost}
                  disabled={isLoading || selectedImages.length === 0}
                  className="absolute right-4 text-primary font-semibold"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    isRTL ? "مشاركة" : "Share"
                  )}
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex max-h-[80vh]">
            {/* Step 1: Select Images */}
            {currentStep === 'select' && (
              <div className="w-full">
                <div 
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center bg-muted/30 border-2 border-dashed transition-colors",
                    isDragging ? "border-primary bg-primary/10" : "border-border"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center text-center p-8">
                    <ImageIcon className="w-20 h-20 text-muted-foreground mb-4" />
                    <p className="text-2xl font-light text-foreground mb-2">
                      {isRTL ? "اسحب الصور ومقاطع الفيديو هنا" : "Drag photos and videos here"}
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-6"
                    >
                      {isRTL ? "تحديد من الكمبيوتر" : "Select from computer"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Crop */}
            {currentStep === 'crop' && selectedImages.length > 0 && (
              <div className="flex-1">
                <div className="relative bg-black aspect-square flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedImages[currentImageIndex].url}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain"
                  />

                  {selectedImages.length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-2 transition-all"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full p-2 transition-all"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {selectedImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-all",
                              index === currentImageIndex
                                ? "bg-white w-3"
                                : "bg-white/60 hover:bg-white/80"
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Filters */}
            {currentStep === 'filter' && selectedImages.length > 0 && (
              <div className="flex w-full">
                <div className="flex-1 relative bg-black aspect-square flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedImages[currentImageIndex].url}
                    alt="Preview"
                    className={cn(
                      "max-w-full max-h-full object-contain transition-all duration-300",
                      FILTERS.find(f => f.id === selectedFilter)?.cssClass
                    )}
                    style={{
                      filter: selectedFilter === 'none' ? 'none' : undefined
                    }}
                  />
                </div>
                
                <div className="w-80 border-l border-border bg-background">
                  <Tabs defaultValue="filters" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 rounded-none border-b h-12">
                      <TabsTrigger value="filters" className="rounded-none">
                        {isRTL ? "فلاتر" : "Filters"}
                      </TabsTrigger>
                      <TabsTrigger value="adjustments" className="rounded-none">
                        {isRTL ? "عمليات الضبط" : "Adjustments"}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="filters" className="mt-0 p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
                      <div className="grid grid-cols-3 gap-3">
                        {FILTERS.map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => applyFilter(filter.id)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-2 rounded-lg transition-all hover:bg-muted",
                              selectedFilter === filter.id && "bg-muted ring-2 ring-primary"
                            )}
                          >
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-black">
                              <img
                                src={selectedImages[currentImageIndex].url}
                                alt={filter.name}
                                className={cn(
                                  "w-full h-full object-cover",
                                  filter.cssClass
                                )}
                              />
                            </div>
                            <span className="text-xs font-medium">
                              {isRTL ? filter.nameAr : filter.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="adjustments" className="mt-0 p-4">
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {isRTL ? "قريباً..." : "Coming soon..."}
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            {/* Step 4: Details */}
            {currentStep === 'details' && selectedImages.length > 0 && (
              <div className="flex w-full">
                <div className="flex-1 relative bg-black aspect-square flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedImages[currentImageIndex].url}
                    alt="Preview"
                    className={cn(
                      "max-w-full max-h-full object-contain",
                      FILTERS.find(f => f.id === selectedImages[currentImageIndex].filter)?.cssClass
                    )}
                  />
                </div>
                
                <div className="w-96 border-l border-border bg-background overflow-y-auto">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {user?.user_metadata?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold text-sm">
                        {user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
                      </span>
                    </div>

                    <Textarea
                      placeholder={isRTL ? "اكتب تعليقاً..." : "Write a caption..."}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="min-h-[120px] resize-none border-0 focus-visible:ring-0 text-sm p-0"
                      dir={direction}
                      maxLength={2200}
                    />

                    <div className="text-xs text-muted-foreground text-right">
                      {caption.length} / 2,200
                    </div>

                    <Separator />

                    <button 
                      className="flex items-center justify-between w-full py-2 text-sm hover:bg-muted rounded-lg px-2 -mx-2"
                      onClick={() => {/* TODO: Tag people */}}
                    >
                      <span>{isRTL ? "الإشارة إلى الأشخاص" : "Tag people"}</span>
                    </button>

                    <button 
                      className="flex items-center justify-between w-full py-2 text-sm hover:bg-muted rounded-lg px-2 -mx-2"
                      onClick={() => {/* Location picker */}}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{isRTL ? "إضافة موقع" : "Add location"}</span>
                      </div>
                    </button>

                    {location && (
                      <div className="flex items-center gap-2 px-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="flex-1 bg-transparent border-0 outline-none text-sm"
                          dir={direction}
                        />
                      </div>
                    )}

                    <Separator />

                    <button 
                      className="flex items-center justify-between w-full py-2 text-sm hover:bg-muted rounded-lg px-2 -mx-2"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <span>{isRTL ? "إعدادات متقدمة" : "Advanced settings"}</span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        showAdvanced && "rotate-180"
                      )} />
                    </button>

                    {showAdvanced && (
                      <div className="space-y-4 px-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="hide-likes" className="text-sm font-normal">
                            {isRTL ? "إخفاء عدد الإعجابات" : "Hide like count"}
                          </Label>
                          <Switch 
                            id="hide-likes"
                            checked={hidelikeCount}
                            onCheckedChange={setHideLikeCount}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Label htmlFor="hide-comments" className="text-sm font-normal">
                            {isRTL ? "إيقاف التعليقات" : "Turn off commenting"}
                          </Label>
                          <Switch 
                            id="hide-comments"
                            checked={hideComments}
                            onCheckedChange={setHideComments}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
