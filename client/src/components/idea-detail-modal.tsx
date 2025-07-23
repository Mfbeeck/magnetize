import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { type LeadMagnetIdea } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface IdeaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: LeadMagnetIdea | null;
}

export function IdeaDetailModal({ isOpen, onClose, idea }: IdeaDetailModalProps) {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const { toast } = useToast();

  if (!idea) return null;

  const getComplexityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "simple":
        return "bg-green-100 text-green-700 hover:bg-green-200";
      case "moderate":
        return "bg-amber-100 text-amber-700 hover:bg-amber-200";
      case "advanced":
        return "bg-red-100 text-red-700 hover:bg-red-200";
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200";
    }
  };

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

  const getPromptPreview = (prompt: string) => {
    if (prompt.length <= 150) return prompt;
    
    const truncated = prompt.substring(0, 150);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex === -1) return truncated + '...';
    
    return truncated.substring(0, lastSpaceIndex) + '...';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <DialogTitle className="text-xl font-semibold text-slate-900">
                  {idea.name}
                </DialogTitle>
                <Badge variant="secondary" className={getComplexityColor(idea.complexityLevel)}>
                  {idea.complexityLevel}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
          <div>
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Summary
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {idea.summary}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Detailed Description
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {idea.detailedDescription}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Value Proposition
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {idea.valueProposition}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Lead Connection
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {idea.leadConnection}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
              Prompt for Initial Prototype Build
            </h4>
            <div className="flex items-start gap-3">
              <div className="relative flex-1">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 pr-16">
                  <p className="text-slate-800 leading-relaxed font-mono text-sm">
                    {isPromptExpanded ? idea.creationPrompt : getPromptPreview(idea.creationPrompt)}
                  </p>
                </div>
                {idea.creationPrompt.length > 150 && (
                  <div className="absolute top-3 right-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                      className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      {isPromptExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          more
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(idea.creationPrompt)}
                className="h-8 w-8 p-0 hover:bg-slate-100 flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}