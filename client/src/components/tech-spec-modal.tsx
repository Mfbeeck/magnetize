import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TechSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  leadMagnetTitle: string;
}

export function TechSpecModal({ isOpen, onClose, content, leadMagnetTitle }: TechSpecModalProps) {
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
              Technical Spec: {leadMagnetTitle}
            </DialogTitle>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              To start building a prototype with an engineer for this lead magnet, copy and send them this technical spec.
            </p>
          </div>
        </DialogHeader>
        
        <div className="mt-6 relative">
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
      </DialogContent>
    </Dialog>
  );
} 