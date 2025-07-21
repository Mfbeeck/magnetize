import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type LeadMagnetIdea } from "@shared/schema";

interface IdeaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: LeadMagnetIdea | null;
}

export function IdeaDetailModal({ isOpen, onClose, idea }: IdeaDetailModalProps) {
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
              <p className="text-sm font-medium text-slate-600">{idea.coreFunction}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="mt-6 space-y-6">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}