import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Magnet, Edit, RefreshCw, ArrowLeft, Link, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateShareUrl, isFromShareLink } from "@/lib/utils";
import { type LeadMagnetIdea } from "@shared/schema";
import { IdeaCard } from "@/components/idea-card";
import { EditModal } from "@/components/edit-modal";
import { IdeaDetailModal } from "@/components/idea-detail-modal";
import { AboutModal } from "@/components/about-modal";

interface MagnetRequest {
  id: number;
  publicId: string;
  prodDescription: string;
  targetAudience: string;
  location: string | null;
  createdAt: string;
  ideas: Array<LeadMagnetIdea & { id: number }>;
  businessUrl?: string;
}

export default function Results() {
  const [, params] = useRoute<{ publicId: string }>("/results/:publicId");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<LeadMagnetIdea | null>(null);
  const [filteredIdeas, setFilteredIdeas] = useState<LeadMagnetIdea[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['Simple', 'Moderate', 'Advanced']));
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const { data: magnetRequest, isLoading, error, refetch } = useQuery({
    queryKey: ["magnetRequest", params?.publicId],
    queryFn: async () => {
      if (!params?.publicId) throw new Error("No public ID provided");
      const response = await apiRequest("GET", `/api/results/${params.publicId}`);
      return response.json() as Promise<MagnetRequest>;
    },
    enabled: !!params?.publicId,
  });

  // Filter ideas based on active filters
  useEffect(() => {
    if (magnetRequest?.ideas) {
      const filtered = magnetRequest.ideas.filter(idea => activeFilters.has(idea.complexityLevel));
      setFilteredIdeas(filtered);
    }
  }, [magnetRequest?.ideas, activeFilters]);

  // Progress simulation effect for regeneration
  useEffect(() => {
    if (isRegenerating) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 4 + 1;
        });
      }, 1200);

      return () => clearInterval(interval);
    }
  }, [isRegenerating]);

  const handleEdit = async (data: any) => {
    try {
      setIsModalOpen(false);
      setIsRegenerating(true);
      setProgress(0);

      // Call the regeneration API
      const response = await apiRequest("POST", "/api/regenerate-ideas", data);
      const result = await response.json();

      if (result.publicId) {
        // Redirect to the new results page
        window.location.href = `/results/${result.publicId}`;
      } else {
        throw new Error("No public ID received from server");
      }
    } catch (error) {
      console.error("Error regenerating ideas:", error);
      setIsRegenerating(false);
      setProgress(0);
      toast({
        title: "Error generating new ideas",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async () => {
    if (!magnetRequest) {
      toast({
        title: "Error",
        description: "No magnet request data available.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRegenerating(true);
      setProgress(0);

      // Call the regeneration API with current data
      const data = {
        prodDescription: magnetRequest.prodDescription,
        targetAudience: magnetRequest.targetAudience,
        location: magnetRequest.location || ""
      };

      const response = await apiRequest("POST", "/api/regenerate-ideas", data);
      const result = await response.json();

      if (result.publicId) {
        // Redirect to the new results page
        window.location.href = `/results/${result.publicId}`;
      } else {
        throw new Error("No public ID received from server");
      }
    } catch (error) {
      console.error("Error regenerating ideas:", error);
      setIsRegenerating(false);
      setProgress(0);
      toast({
        title: "Error generating new ideas",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = generateShareUrl(window.location.pathname, 'result');
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Results URL copied to clipboard",
        description: "Send it to anyone who might be interested!",
      });
    } catch (err) {
      console.error('Failed to copy URL: ', err);
      toast({
        title: "Failed to copy URL",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const toggleFilter = (complexity: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(complexity)) {
      newFilters.delete(complexity);
    } else {
      newFilters.add(complexity);
    }
    setActiveFilters(newFilters);
  };

  const handleViewDetails = (idea: LeadMagnetIdea) => {
    setSelectedIdea(idea);
    setIsDetailModalOpen(true);
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !magnetRequest) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Results Not Found</h2>
            <p className="text-slate-600 mb-6">The requested results could not be found.</p>
            <Button onClick={() => window.location.href = "/"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => window.location.href = "/"}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Magnet className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Magnetize</h1>
            </button>
            <nav className="flex items-center space-x-6">
              <button
                onClick={() => setIsAboutModalOpen(true)}
                className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
              >
                About
              </button>
              {isFromShareLink() && (
                <Button
                  onClick={() => window.location.href = "/"}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Get Free Lead Magnet Ideas
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Regeneration Loading State */}
      {isRegenerating && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Generating Fresh Lead Magnet Ideas</h3>
                  <p className="text-slate-600 mb-6">
                    Analyzing your updated business information to create new, personalized ideas...
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>Generating new ideas...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="text-xs text-slate-500 text-center">
                    {progress < 30 && "Analyzing your updated business context..."}
                    {progress >= 30 && progress < 60 && "Researching target audience needs..."}
                    {progress >= 60 && progress < 90 && "Creating fresh lead magnet ideas..."}
                    {progress >= 90 && "Finalizing your new ideas..."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      )}

      <main className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isRegenerating ? 'hidden' : ''}`}>
        {/* User Input Summary */}
        <Card className="bg-white shadow-sm border border-slate-200 mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  Business Profile{magnetRequest.businessUrl && (
                    <span className="text-blue-600 font-normal">: 
                      <a 
                        href={magnetRequest.businessUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-medium inline-flex items-center ml-1"
                      >
                        {new URL(magnetRequest.businessUrl).hostname}
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-slate-600">{magnetRequest.location || "No location specified"}</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                className="text-slate-600 hover:text-slate-900"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-600 mb-2">Product or Service Description:</span>
                <p className="text-slate-900 mt-1 p-3 bg-slate-50 rounded-md flex-1 min-h-[80px]">{magnetRequest.prodDescription}</p>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-600 mb-2">Target Audience:</span>
                <p className="text-slate-900 mt-1 p-3 bg-slate-50 rounded-md flex-1 min-h-[80px]">{magnetRequest.targetAudience}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h3 className="text-2xl font-semibold text-slate-900">Lead Magnet Ideas</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-slate-600 hover:text-slate-900"
            >
              <Link className="mr-2 h-4 w-4 text-blue-600" />
              Share
            </Button>
          </div>
          
          {/* Complexity Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 mr-2">Filter:</span>
            {['Simple', 'Moderate', 'Advanced'].map((complexity) => (
              <Badge
                key={complexity}
                variant={activeFilters.has(complexity) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  activeFilters.has(complexity) 
                    ? getComplexityColor(complexity) + ' opacity-100' 
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
                onClick={() => toggleFilter(complexity)}
              >
                {complexity}
              </Badge>
            ))}
          </div>
        </div>

        {/* Ideas Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {filteredIdeas.map((idea) => (
            <IdeaCard 
              key={idea.id} 
              idea={idea} 
              onViewDetails={() => handleViewDetails(idea)} 
              publicId={magnetRequest.publicId}
            />
          ))}
        </div>

        {filteredIdeas.length === 0 && magnetRequest.ideas.length > 0 && (
          <div className="text-center py-8">
            <p className="text-slate-600">No ideas match the selected complexity filters.</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filter selection above.</p>
          </div>
        )}

        {/* Edit Modal */}
        <EditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleEdit}
          initialData={{
            prodDescription: magnetRequest.prodDescription,
            targetAudience: magnetRequest.targetAudience,
            location: magnetRequest.location || "",
            businessUrl: magnetRequest.businessUrl || ""
          }}
        />

        {/* Idea Detail Modal */}
        <IdeaDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          idea={selectedIdea}
          businessData={{
            prodDescription: magnetRequest.prodDescription,
            targetAudience: magnetRequest.targetAudience,
            location: magnetRequest.location || ""
          }}
        />

        {/* About Modal */}
        <AboutModal
          isOpen={isAboutModalOpen}
          onClose={() => setIsAboutModalOpen(false)}
        />
      </main>
    </div>
  );
} 