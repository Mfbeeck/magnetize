import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

interface SpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  leadMagnetTitle?: string;
  isLoading?: boolean;
}

export function SpecModal({ isOpen, onClose, title, content, leadMagnetTitle, isLoading = false }: SpecModalProps) {
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [showBuilderOverlay, setShowBuilderOverlay] = useState(false);

  // Handle undefined or null content
  const displayContent = content || "No content available";

  // Animate progress bar when loading
  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 5;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setProgress(100);
    }
  }, [isLoading]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      onClose(); // Close the spec modal
      setShowBuilderOverlay(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Failed to copy to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex-1">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              AI-Ready Build Prompt
            </DialogTitle>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              To start building a prototype for this lead magnet, copy and paste the prompt into an AI builder like{" "}
              <a href="https://lovable.dev/?utm_source=magnetize-app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">Lovable</a>,{" "}
              <a href="https://replit.com/~?utm_source=magnetize-app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">Replit</a>,{" "}
              <a href="https://bolt.new?utm_source=magnetize-app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">bolt.new</a>, etc.
            </p>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          {leadMagnetTitle && (
            <div className="mb-4">
              <h3 className="text-base font-medium text-slate-700 mb-2">
                <span className="text-slate-900 font-semibold">Lead Magnet:</span>{" "}
                <span className="text-slate-700">{leadMagnetTitle}</span>
              </h3>
            </div>
          )}
          
          {isLoading ? (
            <div className="space-y-4 py-12 px-2">
              <div className="flex items-center justify-center">
                <span className="text-slate-700 font-medium">Generating your AI-ready prompt...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-slate-600 text-center">
                This usually takes 10-30 seconds. Please wait while we create a detailed prompt for your lead magnet.
              </p>
            </div>
          ) : (
            <div className="relative">
              <Button
                variant="default"
                size="sm"
                onClick={() => copyToClipboard(displayContent)}
                className="flex items-center gap-2 absolute top-3 right-4 z-10 bg-blue-600/90 hover:bg-blue-700/90 text-white"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-h-[60vh] overflow-y-auto overflow-y-scroll [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">
              <pre className="text-slate-800 leading-relaxed font-mono text-sm whitespace-pre-wrap">
                {displayContent}
              </pre>
            </div>
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Builder Overlay */}
      {showBuilderOverlay && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          onClick={() => setShowBuilderOverlay(false)}
        >
          <div 
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBuilderOverlay(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Your prompt has been copied!
              </h3>
              <p className="text-slate-600">
                Select an AI builder below to start building
              </p>
            </div>
            
            <div className="space-y-3">
              <a
                href="https://lovable.dev/?utm_source=magnetize-app"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-center">
                  <img 
                    src="/images/lovable-logo-dark.png" 
                    alt="Lovable" 
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                  <span className="ml-3 font-medium text-slate-900">Lovable</span>
                </div>
              </a>
              
              <a
                href="https://replit.com/~?utm_source=magnetize-app"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-center">
                  <img 
                    src="/images/replit-logo.png" 
                    alt="Replit" 
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                  <span className="ml-3 font-medium text-slate-900">Replit</span>
                </div>
              </a>
              
              <a
                href="https://bolt.new?utm_source=magnetize-app"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-center">
                  <img 
                    src="/images/bolt-logo.png" 
                    alt="Bolt.new" 
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                  <span className="ml-3 font-medium text-slate-900">bolt.new</span>
                </div>
              </a>
              
              <a
                href="https://cursor.com/agents?utm_source=magnetize-app"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200"
              >
                 <div className="flex items-center justify-center">
                  <img 
                    src="/images/cursor-logo.png" 
                    alt="v0.dev" 
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                  <span className="ml-3 font-medium text-slate-900">v0.dev</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
} 