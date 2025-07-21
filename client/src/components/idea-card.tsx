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

  return (
    <Card className="bg-white shadow-sm border border-slate-200 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h4 className="text-lg font-semibold text-slate-900 flex-1 pr-2">{idea.name}</h4>
          <Badge variant="secondary" className={getComplexityColor(idea.complexityLevel)}>
            {idea.complexityLevel}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Core Function</span>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{idea.coreFunction}</p>
          </div>
          
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Lead Connection</span>
            <p className="text-sm text-slate-700 mt-1 leading-relaxed">{idea.leadConnection}</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={onViewDetails}
          className="w-full mt-4 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
        >
          More Details
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
