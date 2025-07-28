import { ChevronRight, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type LeadMagnetIdea } from "@shared/schema";

interface IdeaCardProps {
  idea: LeadMagnetIdea & { id?: number };
  onViewDetails: () => void;
  onHelpBuild?: () => void;
  publicId?: string;
}

export function IdeaCard({ idea, onViewDetails, onHelpBuild, publicId }: IdeaCardProps) {
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent triggering when clicking the buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // If we have a publicId and idea id, navigate to the idea page
    if (publicId && idea.id) {
      window.location.href = `/results/${publicId}/ideas/${idea.id}`;
    } else {
      onViewDetails();
    }
  };

  return (
    <Card 
      className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200 h-full flex flex-col cursor-pointer" 
      onClick={handleCardClick}
    >
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-slate-900 mb-2">{idea.name}</h4>
          <Badge variant="secondary" className={`${getComplexityColor(idea.complexityLevel)} mb-4`}>
            {idea.complexityLevel}
          </Badge>
          
          <p className="text-sm text-slate-700 leading-relaxed">{idea.summary}</p>
        </div>

        <div className="flex gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              if (publicId && idea.id) {
                window.location.href = `/results/${publicId}/ideas/${idea.id}`;
              } else {
                onViewDetails();
              }
            }}
            className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
          >
            More Details
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          
          {onHelpBuild && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onHelpBuild();
                    }}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <HelpCircle className="h-4 w-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-slate-900 text-white border-slate-900">
                  <p className="">Build this with us</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
