import React, { useState, useCallback } from 'react';
import { Upload, Image, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ImageToDotService } from '../services/image-to-dot-service';
import { toast } from 'sonner';

interface FlowchartImageUploadProps {
  onDotGenerated: (dotCode: string) => void;
}

export const FlowchartImageUpload: React.FC<FlowchartImageUploadProps> = ({
  onDotGenerated,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error('File size must be less than 10MB');
        return;
      }

      setIsProcessing(true);
      setFileName(file.name);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const result = await ImageToDotService.convertImageToDot(file);

        if (result.success && result.data) {
          toast.success('Flowchart successfully converted!');
          onDotGenerated(result.data);
        } else {
          toast.error(result.error || 'Failed to convert image');
        }
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Failed to process image. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [onDotGenerated]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const clearUpload = useCallback(() => {
    setUploadedImage(null);
    setFileName('');
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5" />
          Upload Flowchart Image
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Processing image with AI...
                </p>
                <p className="text-xs text-muted-foreground">
                  This may take a few moments
                </p>
              </div>
            ) : uploadedImage ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Image uploaded successfully
                  </span>
                </div>
                <div className="max-w-xs mx-auto">
                  <img
                    src={uploadedImage}
                    alt="Uploaded flowchart"
                    className="w-full h-auto rounded border"
                  />
                  <p className="text-xs text-muted-foreground mt-2 truncate">
                    {fileName}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearUpload}
                  className="mx-auto"
                >
                  Upload Another Image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Drag and drop your flowchart image here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse files
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    document.getElementById('image-upload')?.click()
                  }
                >
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <div>
                <p>Supported formats: PNG, JPG, JPEG, GIF, WebP</p>
                <p>Maximum file size: 10MB</p>
                <p>
                  This feature uses AI to analyze your flowchart image and
                  convert it to DOT format.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
