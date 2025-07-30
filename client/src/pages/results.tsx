import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Magnet, Edit, RefreshCw, ArrowLeft, Link, MapPin, ListFilter } from "lucide-react";
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
import { HelpBuildModal } from "@/components/help-build-modal";

type IdeaIterationData = {
  id: number;
  version: number; 
  name: string; 
  summary: string; 
  detailedDescription: string; 
  whyThis: string; 
  complexityLevel: string; 
};

type IdeaWithIterations = LeadMagnetIdea & { 
  id: number; 
  resultIdeaId: number; 
  iterations: IdeaIterationData[];
};

interface MagnetRequest {
  id: number;
  publicId: string;
  prodDescription: string;
  targetAudience: string;
  location: string | null;
  createdAt: string;
  ideas: IdeaWithIterations[];
  businessUrl: string;
}

export default function Results() {
  const [, params] = useRoute<{ publicId: string }>("/results/:publicId");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpBuildModalOpen, setIsHelpBuildModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaWithIterations | null>(null);
  const [filteredIdeas, setFilteredIdeas] = useState<IdeaWithIterations[]>([]);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['Simple', 'Moderate', 'Advanced']));
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullAudience, setShowFullAudience] = useState(false);
  const { toast } = useToast();
  const ideasSectionRef = useRef<HTMLDivElement>(null);

  const { data: magnetRequest, isLoading, error, refetch } = useQuery({
    queryKey: ["magnetRequest", params?.publicId],
    queryFn: async () => {
      if (!params?.publicId) throw new Error("No public ID provided");
      const response = await apiRequest("GET", `/api/results/${params.publicId}`);
      return response.json() as Promise<MagnetRequest>;
    },
    enabled: !!params?.publicId,
  });

  // Filter ideas based on active filters and sort by ID - use latest iteration data
  useEffect(() => {
    if (magnetRequest?.ideas) {
      const filtered = magnetRequest.ideas
        .filter(idea => {
          // Check if the latest iteration matches the filter
          const latestIteration = idea.iterations?.[0]; // First one is latest due to desc order
          return latestIteration && activeFilters.has(latestIteration.complexityLevel);
        })
        .map(idea => {
          // Use the latest iteration data for display
          const latestIteration = idea.iterations?.[0];
          return {
            ...idea,
            name: latestIteration?.name || idea.name,
            summary: latestIteration?.summary || idea.summary,
            detailedDescription: latestIteration?.detailedDescription || idea.detailedDescription,
            whyThis: latestIteration?.whyThis || idea.whyThis,
            complexityLevel: (latestIteration?.complexityLevel || idea.complexityLevel) as "Simple" | "Moderate" | "Advanced"
          };
        })
        .sort((a, b) => a.resultIdeaId - b.resultIdeaId);
      setFilteredIdeas(filtered);
    }
  }, [magnetRequest?.ideas, activeFilters]);

  // Set dynamic page title based on business URL domain
  useEffect(() => {
    if (magnetRequest?.businessUrl) {
      try {
        const urlWithProtocol = magnetRequest.businessUrl.startsWith('http://') || magnetRequest.businessUrl.startsWith('https://') 
          ? magnetRequest.businessUrl 
          : `https://${magnetRequest.businessUrl}`;
        const url = new URL(urlWithProtocol);
        const domain = url.hostname.replace('www.', '');
        document.title = `Magnetize - ${domain}`;
      } catch (error) {
        // Fallback if URL parsing fails
        document.title = "Magnetize - Lead Magnet Ideas";
      }
    } else {
      // Fallback when no business URL is available
      document.title = "Magnetize - Lead Magnet Ideas";
    }
  }, [magnetRequest?.businessUrl]);

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
        title: "The URL to these results has been copied to your clipboard",
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



  const handleHelpBuild = (idea: IdeaWithIterations) => {
    setSelectedIdea(idea);
    setIsHelpBuildModalOpen(true);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading results...</p>
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
                  Business Profile: {magnetRequest.businessUrl && (
                    <span className="text-blue-600 font-normal"> 
                      <a 
                        href={magnetRequest.businessUrl.startsWith('http://') || magnetRequest.businessUrl.startsWith('https://') 
                          ? magnetRequest.businessUrl 
                          : `https://${magnetRequest.businessUrl}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-medium inline-flex items-center"
                      >
                        {(() => {
                          try {
                            const urlWithProtocol = magnetRequest.businessUrl.startsWith('http://') || magnetRequest.businessUrl.startsWith('https://') 
                              ? magnetRequest.businessUrl 
                              : `https://${magnetRequest.businessUrl}`;
                            return new URL(urlWithProtocol).hostname;
                          } catch {
                            return magnetRequest.businessUrl;
                          }
                        })()}
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
                <Edit className="sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-600 mb-2">Product or Service Description:</span>
                <div className="text-slate-900 mt-1 p-3 bg-slate-50 rounded-md flex-1 min-h-[80px]">
                  {showFullDescription ? (
                    <>
                      {magnetRequest.prodDescription}
                      <button
                        onClick={() => setShowFullDescription(false)}
                        className="text-blue-600 hover:text-blue-800 ml-2 font-medium"
                      >
                        see less
                      </button>
                    </>
                  ) : (
                    <>
                      {magnetRequest.prodDescription.length > 120 
                        ? (() => {
                            const truncated = magnetRequest.prodDescription.substring(0, 120);
                            const lastSpaceIndex = truncated.lastIndexOf(' ');
                            return lastSpaceIndex > 0 
                              ? `${truncated.substring(0, lastSpaceIndex)}...`
                              : `${truncated}...`;
                          })()
                        : magnetRequest.prodDescription
                      }
                      {magnetRequest.prodDescription.length > 120 && (
                        <button
                          onClick={() => setShowFullDescription(true)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          see more
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-600 mb-2">Target Audience:</span>
                <div className="text-slate-900 mt-1 p-3 bg-slate-50 rounded-md flex-1 min-h-[80px]">
                  {showFullAudience ? (
                    <>
                      {magnetRequest.targetAudience}
                      <button
                        onClick={() => setShowFullAudience(false)}
                        className="text-blue-600 hover:text-blue-800 ml-2 font-medium"
                      >
                        see less
                      </button>
                    </>
                  ) : (
                    <>
                      {magnetRequest.targetAudience.length > 120 
                        ? (() => {
                            const truncated = magnetRequest.targetAudience.substring(0, 120);
                            const lastSpaceIndex = truncated.lastIndexOf(' ');
                            return lastSpaceIndex > 0 
                              ? `${truncated.substring(0, lastSpaceIndex)}...`
                              : `${truncated}...`;
                          })()
                        : magnetRequest.targetAudience
                      }
                      {magnetRequest.targetAudience.length > 120 && (
                        <button
                          onClick={() => setShowFullAudience(true)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          see more
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div ref={ideasSectionRef} className="mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <h3 className="text-2xl font-semibold text-slate-900">Lead Magnet Ideas</h3>
            <div className="flex-1 min-w-0"></div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="text-slate-600 hover:text-slate-900"
            >
              <Link className="h-4 w-4 text-blue-600 sm:mr-2" />
              <span className="hidden sm:inline">Share results</span>
            </Button>
          </div>
          
          {/* Complexity Filters */}
          <div className="flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-slate-600 sm:hidden" />
            <span className="hidden sm:inline text-sm text-slate-600">Filter:</span>
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
              onViewDetails={() => {}} 
              onHelpBuild={() => handleHelpBuild(idea)}
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





        {/* Help Build Modal */}
        {selectedIdea && (
          <HelpBuildModal
            isOpen={isHelpBuildModalOpen}
            onClose={() => setIsHelpBuildModalOpen(false)}
            ideaName={selectedIdea.name}
            ideaIterationId={selectedIdea.iterations?.[0]?.id}
          />
        )}
      </main>
    </div>
  );
} 