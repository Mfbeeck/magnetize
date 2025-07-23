import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export function SpecModal({ isOpen, onClose, title, content }: SpecModalProps) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold text-slate-900">
              {title}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(displayContent)}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
            <pre className="text-slate-800 leading-relaxed font-mono text-sm whitespace-pre-wrap">
              {displayContent}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 