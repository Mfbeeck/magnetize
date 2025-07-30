import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  leadMagnetTitle?: string;
}

export function SpecModal({ isOpen, onClose, title, content, leadMagnetTitle }: SpecModalProps) {
  const { toast } = useToast();

  // Handle undefined or null content
  const displayContent = content || "No content available";

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Successfully copied to clipboard",
        duration: 2000,
      });
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
              <a href="https://claude.ai?utm_source=magnetize-app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline font-medium">Claude</a>, etc.
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
          
          <div className="relative">
            <Button
              variant="default"
              size="sm"
              onClick={() => copyToClipboard(displayContent)}
              className="flex items-center gap-2 absolute top-2 right-2 z-10 bg-blue-600/90 hover:bg-blue-700/90 text-white"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-h-[60vh] overflow-y-auto">
              <pre className="text-slate-800 leading-relaxed font-mono text-sm whitespace-pre-wrap">
                {displayContent}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 