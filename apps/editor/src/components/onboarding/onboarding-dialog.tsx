import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertTriangle, Share2, Download, Info } from 'lucide-react';

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ONBOARDING_STORAGE_KEY = 'zflo-editor-onboarding-seen';

export function OnboardingDialog({
  open,
  onOpenChange,
}: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    onOpenChange(false);
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    onOpenChange(false);
  };

  const steps = [
    {
      title: 'Welcome to ZFlo Editor',
      content: (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              controls
              className="w-full h-full"
              poster="/assets/video-poster.jpg"
            >
              <source src="/assets/getting-started.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-sm text-muted-foreground">
            Watch this quick introduction to learn how to create interactive
            flows with the ZFlo Editor.
          </p>
        </div>
      ),
    },
    {
      title: 'Important: Data Storage',
      content: (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Local Storage Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Your work is saved locally in your browser.</strong> This
              means:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Data persists between sessions on this device</li>
              <li>Clearing browser data will delete your flows</li>
              <li>Data is not synced across different devices or browsers</li>
            </ul>
            <div className="flex items-center gap-2 p-3 bg-orange-100 rounded-md">
              <Download className="w-4 h-4 text-orange-600" />
              <span className="text-orange-800 font-medium">
                Always export important flows to avoid data loss!
              </span>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      title: 'Share Your Flows',
      content: (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Share2 className="w-5 h-5" />
              Link Sharing Feature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Share your flows instantly with others:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                Generate shareable links for your flows for others to play
              </li>
              <li>Recipients can view and interact with your flows</li>
              <li>Links work without requiring accounts or installations</li>
              <li>Perfect for collaboration and feedback</li>
            </ul>
            <div className="p-3 bg-blue-100 rounded-md">
              <p className="text-blue-800 text-xs">
                💡 <strong>Tip:</strong> Use the share button in the toolbar to
                generate links
              </p>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      title: 'Key Features',
      content: (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-500" />
                    Editor Features
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Drag & drop node creation</li>
                    <li>Live preview mode</li>
                    <li>Create and manage shareable flows</li>
                    <li>Export to JSON</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-green-500" />
                    You Can Create
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
                    <li>Decision trees</li>
                    <li>Interactive stories</li>
                    <li>Process workflows</li>
                    <li>Educational content</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Ready to start creating? Click "Get Started" to begin!
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{steps[currentStep]?.title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">{steps[currentStep]?.content}</div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tour
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete}>Get Started</Button>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 justify-center pt-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-primary'
                  : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const openOnboarding = () => setShowOnboarding(true);
  const closeOnboarding = () => setShowOnboarding(false);

  return {
    showOnboarding,
    openOnboarding,
    closeOnboarding,
  };
}
