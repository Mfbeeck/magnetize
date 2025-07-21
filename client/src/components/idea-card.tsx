import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type LeadMagnetIdea } from "@shared/schema";

interface IdeaCardProps {
  idea: LeadMagnetIdea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
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
        
        <p className="text-sm font-medium text-slate-600 mb-2">{idea.coreFunction}</p>
        
        <p className="text-slate-700 mb-4 text-sm leading-relaxed">
          {idea.detailedDescription}
        </p>
        
        <div className="space-y-3">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Value Proposition</span>
            <p className="text-sm text-slate-700 mt-1">{idea.valueProposition}</p>
          </div>
          
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Lead Connection</span>
            <p className="text-sm text-slate-700 mt-1">{idea.leadConnection}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
