import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type LeadMagnetIdea } from "@shared/schema";

interface IdeaCardProps {
  idea: LeadMagnetIdea;
  onViewDetails: () => void;
}

export function IdeaCard({ idea, onViewDetails }: IdeaCardProps) {
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
    // Prevent triggering when clicking the button
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onViewDetails();
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

        <Button 
          variant="outline" 
          onClick={onViewDetails}
          className="w-full mt-6 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
        >
          More Details
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
