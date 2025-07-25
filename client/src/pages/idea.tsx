import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Magnet, ArrowLeft, ExternalLink, Sparkles, Loader2, Link, HelpCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { generateShareUrl, isFromShareLink } from "@/lib/utils";
import { type LeadMagnetIdea } from "@shared/schema";
import { SpecModal } from "@/components/spec-modal";
import { TechSpecModal } from "@/components/tech-spec-modal";
import { HelpBuildModal } from "@/components/help-build-modal";
import { AboutModal } from "@/components/about-modal";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface IdeaWithMagnetRequest {
  id: number;
  name: string;
  summary: string;
  detailedDescription: string;
  whyThis: string;
  creationPrompt: string | null;
  magnetSpec: string | null;
  complexityLevel: string;
  createdAt: string;
  magnetRequest: {
    id: number;
    publicId: string;
    prodDescription: string;
    targetAudience: string;
    location: string | null;
  };
}

export default function Idea() {
  const [, params] = useRoute<{ id: string }>("/results/:publicId/ideas/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTechSpecModalOpen, setIsTechSpecModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isHelpBuildModalOpen, setIsHelpBuildModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: "" });

  const { data: idea, isLoading, error } = useQuery({
    queryKey: ["idea", params?.id],
    queryFn: async () => {
      if (!params?.id) throw new Error("No idea ID provided");
      const response = await apiRequest("GET", `/api/ideas/${params.id}`);
      return response.json() as Promise<IdeaWithMagnetRequest>;
    },
    enabled: !!params?.id,
  });

  // Set dynamic page title based on idea name
  useEffect(() => {
    if (idea?.name) {
      document.title = `Magnetize - ${idea.name}`;
    } else {
      // Fallback when idea data is not available
      document.title = "Magnetize - Lead Magnet Ideas";
    }
  }, [idea?.name]);

  const generateSpecMutation = useMutation({
    mutationFn: async ({ idea, businessData }: { idea: IdeaWithMagnetRequest; businessData: any }) => {
      const response = await apiRequest("POST", "/api/generate-spec", { 
        idea, 
        businessData,
        ideaId: idea.id 
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Spec generation response:", data);
      
      // Invalidate and refetch the idea data
      queryClient.invalidateQueries({ queryKey: ["idea", params?.id] });
      
      // Show toast
      toast({
        title: "AI-ready blueprint generated!",
        description: "Your detailed technical specification and build prompt are ready.",
        duration: 5000,
      });
      
      // Scroll to bottom after a short delay to ensure new content is rendered
      setTimeout(() => {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate specification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShare = async () => {
    try {
      const shareUrl = generateShareUrl(window.location.pathname, 'idea');
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Idea URL copied to clipboard",
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

  const getComplexityColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "simple":
        return "bg-green-100 text-green-700";
      case "moderate":
        return "bg-amber-100 text-amber-700";
      case "advanced":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading idea...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Idea Not Found</h2>
            <p className="text-slate-600 mb-6">The requested idea could not be found.</p>
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
              onClick={() => window.location.href = `/results/${idea.magnetRequest.publicId}`}
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Idea Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = `/results/${idea.magnetRequest.publicId}`}
              className="text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHelpBuildModalOpen(true)}
                className="text-slate-600 hover:text-slate-900"
              >
                <HelpCircle className="mr-2 h-4 w-4 text-green-600" />
                Help me build this
              </Button>
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
          </div>
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{idea.name}</h1>
            <p className="text-xl text-slate-600 mb-4">{idea.summary}</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 font-medium">Complexity Level:</span>
                <Badge className={getComplexityColor(idea.complexityLevel)}>
                  {idea.complexityLevel}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <Card className="bg-white shadow-sm border border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Detailed Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{idea.detailedDescription}</p>
          </CardContent>
        </Card>

        {/* Why This Lead Magnet */}
        <Card className="bg-white shadow-sm border border-slate-200 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Why This Lead Magnet?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700 leading-relaxed">{idea.whyThis}</p>
          </CardContent>
        </Card>

        {/* Generate AI-Ready Blueprint */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 mb-8">
          <CardHeader>
            <CardTitle className="text-lg">
              Get Your AI-Ready Blueprint to Start Building This
            </CardTitle>
            <p className="text-sm text-blue-700 leading-relaxed">
              Generate a ready-to-use technical plan that any AI coding assistant can understand. You'll get a detailed specification and build instructions that you can paste directly into tools like{" "}
              <a href="https://lovable.dev/?utm_source=magnetize-app" target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-900 underline font-medium">Lovable</a>,{" "}
              <a href="https://replit.com/~?utm_source=magnetize-app" target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-900 underline font-medium">Replit</a>,{" "}
              <a href="https://claude.ai?utm_source=magnetize-app" target="_blank" rel="noopener noreferrer" className="text-blue-800 hover:text-blue-900 underline font-medium">Claude</a>, etc. to start building your lead magnet today. If you need our help building it, click the "Help me build this" button below.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-3 items-start">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {!idea.magnetSpec && !idea.creationPrompt ? (
                  <Button
                    onClick={() => {
                      const businessData = {
                        prodDescription: idea.magnetRequest.prodDescription,
                        targetAudience: idea.magnetRequest.targetAudience,
                        location: idea.magnetRequest.location || ""
                      };
                      generateSpecMutation.mutate({ idea, businessData });
                    }}
                    disabled={generateSpecMutation.isPending}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {generateSpecMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>
                ) : (
                  <>                  
                    {idea.creationPrompt && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setModalContent({
                            title: "Build Prompt",
                            content: idea.creationPrompt!
                          });
                          setIsPromptModalOpen(true);
                        }}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 bg-white"
                      >
                        View AI-ready prompt
                      </Button>
                    )}
                    {idea.magnetSpec && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsTechSpecModalOpen(true);
                        }}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 bg-white"
                      >
                        View technical spec
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setIsHelpBuildModalOpen(true)}
                className="text-slate-600 hover:text-slate-900 lg:self-end"
              >
                <HelpCircle className="mr-2 h-4 w-4 text-green-600" />
                Help me build this
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center">
          <Button
            onClick={() => window.location.href = `/results/${idea.magnetRequest.publicId}`}
            variant="outline"
            className="flex-1 sm:flex-none max-w-xs"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all ideas
          </Button>
        </div>
      </main>

      {/* Tech Spec Modal */}
      <TechSpecModal
        isOpen={isTechSpecModalOpen}
        onClose={() => setIsTechSpecModalOpen(false)}
        content={idea.magnetSpec || ""}
        leadMagnetTitle={idea.name}
      />

      {/* Prompt Modal */}
      <SpecModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title={modalContent.title}
        content={modalContent.content}
        leadMagnetTitle={idea.name}
      />

      {/* Help Build Modal */}
      <HelpBuildModal
        isOpen={isHelpBuildModalOpen}
        onClose={() => setIsHelpBuildModalOpen(false)}
        ideaName={idea.name}
        ideaId={idea.id}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />
    </div>
  );
} 