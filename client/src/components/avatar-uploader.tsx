import { useState, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploaderProps {
  currentAvatar?: string;
  username?: string;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  selectedFile?: File | null;
  previewUrl?: string;
  isUploading?: boolean;
  uploadProgress?: number;
}

export function AvatarUploader({
  currentAvatar,
  username = "User",
  onFileSelect,
  onRemove,
  selectedFile,
  previewUrl,
  isUploading = false,
  uploadProgress = 0,
}: AvatarUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileSelect(files[0]);
    }
  };

  const displayAvatar = previewUrl || currentAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

  return (
    <div className="space-y-4">
      {/* Avatar Preview Section */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={displayAvatar} className="object-cover" />
            <AvatarFallback className="text-2xl">{username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {selectedFile && !isUploading && (
            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{username}</h3>
          <p className="text-sm text-muted-foreground">
            Recommended: Square image, at least 200x200px
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <Card
        className={cn(
          "relative border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-accent/50",
          isUploading && "pointer-events-none opacity-60"
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <div className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200",
              isDragging 
                ? "bg-primary/20 scale-110" 
                : "bg-muted"
            )}>
              {isUploading ? (
                <div className="animate-spin">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
              ) : (
                <ImageIcon className={cn(
                  "w-8 h-8 transition-colors",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            {isUploading ? (
              <>
                <p className="text-sm font-medium">Uploading...</p>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isDragging ? (
                      <span className="text-primary">Drop your image here</span>
                    ) : (
                      <>
                        <span className="text-primary hover:underline">Click to upload</span>
                        {" or drag and drop"}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </Card>

      {/* File Info & Actions */}
      {selectedFile && (
        <Card className="p-4 bg-muted/50 border border-border animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-background rounded-lg flex items-center justify-center border">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="uppercase">{selectedFile.type.split('/')[1]}</span>
                <span>•</span>
                <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              disabled={isUploading}
              className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
