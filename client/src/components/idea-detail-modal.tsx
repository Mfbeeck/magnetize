import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { type LeadMagnetIdea } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SpecModal } from "./spec-modal";

interface IdeaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: LeadMagnetIdea | null;
  businessData?: {
    prodDescription: string;
    targetAudience: string;
    location?: string;
  };
}

export function IdeaDetailModal({ isOpen, onClose, idea, businessData }: IdeaDetailModalProps) {
  const [currentIdea, setCurrentIdea] = useState<LeadMagnetIdea | null>(null);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: "" });
  const { toast } = useToast();

  const generateSpecMutation = useMutation({
    mutationFn: async ({ idea, businessData }: { idea: LeadMagnetIdea; businessData: any }) => {
      const response = await apiRequest("POST", "/api/generate-spec", { 
        idea, 
        businessData,
        ideaId: idea.id 
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Spec generation response:", data);
      if (currentIdea) {
        setCurrentIdea({
          ...currentIdea,
          magnetSpec: data.magnetSpec,
          creationPrompt: data.creationPrompt
        });
      }
      toast({
        title: "Specification generated successfully!",
        description: "Your detailed technical specification and build prompt are ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate specification. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update currentIdea when idea prop changes
  useEffect(() => {
    setCurrentIdea(idea);
  }, [idea]);

  if (!idea || !currentIdea) return null;

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

  const getPromptPreview = (prompt: string | undefined) => {
    if (!prompt) return "No content available";
    if (prompt.length <= 150) return prompt;
    
    const truncated = prompt.substring(0, 150);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex === -1) return truncated + '...';
    
    return truncated.substring(0, lastSpaceIndex) + '...';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <DialogTitle className="text-xl font-semibold text-slate-900">
                    {currentIdea.name}
                  </DialogTitle>
                  <Badge variant="secondary" className={getComplexityColor(currentIdea.complexityLevel)}>
                    {currentIdea.complexityLevel}
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
                {currentIdea.summary}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                Detailed Description
              </h4>
              <p className="text-slate-700 leading-relaxed">
                {currentIdea.detailedDescription}
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">
                Why This Lead Magnet?
              </h4>
              <p className="text-slate-700 leading-relaxed">
                {currentIdea.whyThis}
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h4 className="text-lg font-semibold text-blue-900">
                  Get Your AI-Ready Blueprint to Start Building This
                </h4>
              </div>
              <p className="text-sm text-blue-700 mb-4 leading-relaxed">
                Generate a ready-to-use technical plan that any AI coding assistant can understand. You'll get a detailed specification and build instructions that you can paste directly into tools like Claude, Lovable, or Replit to start building your lead magnet.
              </p>
              
              {!currentIdea.creationPrompt ? (
                <Button
                  onClick={() => {
                    if (businessData && currentIdea) {
                      generateSpecMutation.mutate({ idea: currentIdea, businessData });
                    }
                  }}
                  disabled={generateSpecMutation.isPending || !businessData}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {generateSpecMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              ) : (
                <div className="flex gap-3">
                  {currentIdea.magnetSpec && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log("Opening spec modal with content:", currentIdea.magnetSpec);
                        setModalContent({
                          title: "Technical Specification",
                          content: currentIdea.magnetSpec!
                        });
                        setIsSpecModalOpen(true);
                      }}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 bg-white"
                    >
                      View Technical Spec
                    </Button>
                  )}
                  
                  {currentIdea.creationPrompt && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setModalContent({
                          title: "Build Prompt",
                          content: currentIdea.creationPrompt!
                        });
                        setIsPromptModalOpen(true);
                      }}
                      className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 bg-white"
                    >
                      View Build Prompt
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spec Modal */}
      <SpecModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
      />

      {/* Prompt Modal */}
      <SpecModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
      />
    </>
  );
}