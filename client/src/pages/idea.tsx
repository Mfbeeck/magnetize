import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Loader2, Link, Hammer, ThumbsUp, Meh, ThumbsDown, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import { generateShareUrl, isFromShareLink } from "@/lib/utils";
import { type LeadMagnetIdea } from "@shared/schema";
import { SpecModal } from "@/components/spec-modal";
import { TechSpecModal } from "@/components/tech-spec-modal";
import { HelpBuildModal } from "@/components/help-build-modal";

import { BusinessProfileModal } from "@/components/business-profile-modal";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface IdeaIterationWithMagnetRequest {
  id: number;
  ideaId: number;
  version: number;
  name: string;
  summary: string;
  detailedDescription: string;
  whyThis: string;
  creationPrompt: string | null;
  magnetSpec: string | null;
  complexityLevel: string;
  feedbackProvided: string | null;
  createdAt: string;
  idea: {
    id: number;
    magnetRequest: {
      id: number;
      publicId: string;
      prodDescription: string;
      targetAudience: string;
      location: string | null;
      businessUrl: string;
    };
  };
}

export default function Idea() {
  // Handle both routes: with and without version
  const [, paramsWithVersion] = useRoute<{ publicId: string; resultIdeaId: string; version: string }>("/results/:publicId/ideas/:resultIdeaId/v/:version");
  const [, paramsWithoutVersion] = useRoute<{ publicId: string; resultIdeaId: string }>("/results/:publicId/ideas/:resultIdeaId");
  
  // Use whichever params are available
  const params = paramsWithVersion || paramsWithoutVersion;
  const versionNum = paramsWithVersion ? parseInt(paramsWithVersion.version) : 0;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTechSpecModalOpen, setIsTechSpecModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isHelpBuildModalOpen, setIsHelpBuildModalOpen] = useState(false);

  const [isBusinessProfileModalOpen, setIsBusinessProfileModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", content: "" });
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Helper function to handle when prompt is generated
  const handlePromptGenerated = async (promptContent: string) => {
    try {
      // Copy the prompt to clipboard
      await navigator.clipboard.writeText(promptContent);
      
      // Update modal content with the generated prompt
      setModalContent({
        title: "Build Prompt",
        content: promptContent
      });
      
      // Stop loading state
      setIsGeneratingPrompt(false);
      
      // Show success toast
      toast({
        title: "AI-ready prompt generated and copied!",
        description: "The prompt has been copied to your clipboard. You can now paste it into your AI coding assistant.",
        duration: 5000,
      });
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // If clipboard fails, still show the prompt but show different toast
      setModalContent({
        title: "Build Prompt",
        content: promptContent
      });
      setIsGeneratingPrompt(false);
      
      toast({
        title: "Your AI-ready prompt is good to go!",
        description: "Copy the prompt and paste it into any AI coding assistant to start building your lead magnet!",
        duration: 5000,
      });
    }
  };

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Iteration state
  const [iterationFeedback, setIterationFeedback] = useState("");
  const [isIterating, setIsIterating] = useState(false);
  const [iterations, setIterations] = useState<IdeaIterationWithMagnetRequest[]>([]);

  const { data: idea, isLoading, error } = useQuery({
    queryKey: ["idea", params?.publicId, params?.resultIdeaId, versionNum],
    queryFn: async () => {
      if (!params?.publicId || !params?.resultIdeaId) throw new Error("No idea parameters provided");
      
      // First get the idea by result ID
      const ideaResponse = await apiRequest("GET", `/api/results/${params.publicId}/ideas/${params.resultIdeaId}`);
      const ideaData = await ideaResponse.json();
      
      // Then get iterations using the database ID
      const response = await apiRequest("GET", `/api/ideas/${ideaData.id}/iterations`);
      const data = await response.json();
      
      const iterations = data.iterations as IdeaIterationWithMagnetRequest[];
      
      setIterations(iterations);
      const currentIdea = iterations.find(i => i.version === versionNum);
      
      if (!currentIdea) throw new Error("Idea version not found");
      return currentIdea;
    },
    enabled: !!(params?.publicId && params?.resultIdeaId),
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

  // Check for iteration success parameter and show toast
  useEffect(() => {
    // Only run this effect when the component is fully loaded and idea data is available
    if (!idea) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const fromIteration = urlParams.get('from_iteration');
    
    console.log('Checking for from_iteration parameter:', fromIteration);
    console.log('Current URL:', window.location.href);
    
    if (fromIteration === 'success') {
      console.log('Showing success toast for iteration');
      toast({
        title: "Idea enhanced successfully!",
        description: " We've updated the idea based on your feedback. You're now viewing the new version.",
        duration: 5000,
      });
      
      // Clean up the URL parameter
      urlParams.delete('from_iteration');
      const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
      console.log('Cleaned up URL to:', newUrl);
    }
  }, [idea, toast]); // Run when idea data is available and toast function is ready



  const generateSpecMutation = useMutation({
    mutationFn: async ({ idea, businessData }: { idea: IdeaIterationWithMagnetRequest; businessData: any }) => {
      const response = await apiRequest("POST", "/api/generate-spec", { 
        idea, 
        businessData,
        iterationId: idea.id 
      });
      return response.json();
    },
    onSuccess: async (data) => {
      // Invalidate queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["idea", params?.publicId, params?.resultIdeaId, versionNum] });
      queryClient.invalidateQueries({ queryKey: ["idea", params?.publicId, params?.resultIdeaId] });
      
      // Try to get the prompt from the response data first
      let promptContent = data?.creationPrompt || data?.prompt;
      
      // If not in response, try to fetch it from the updated query
      if (!promptContent) {
        // Wait a moment for the query to update
        setTimeout(async () => {
          const updatedIdea = queryClient.getQueryData(["idea", params?.publicId, params?.resultIdeaId, versionNum]) as IdeaIterationWithMagnetRequest;
          promptContent = updatedIdea?.creationPrompt;
          
          if (promptContent) {
            await handlePromptGenerated(promptContent);
          } else {
            // Final fallback - refetch the idea data
            try {
              const response = await apiRequest("GET", `/api/results/${params?.publicId}/ideas/${params?.resultIdeaId}`);
              const ideaData = await response.json();
              const iterationsResponse = await apiRequest("GET", `/api/ideas/${ideaData.id}/iterations`);
              const iterationsData = await iterationsResponse.json();
              const currentIdea = iterationsData.iterations.find((i: any) => i.version === versionNum);
              
              if (currentIdea?.creationPrompt) {
                await handlePromptGenerated(currentIdea.creationPrompt);
              } else {
                setIsGeneratingPrompt(false);
                toast({
                  title: "Error",
                  description: "Generated prompt not found. Please try again.",
                  variant: "destructive",
                });
              }
            } catch (err) {
              setIsGeneratingPrompt(false);
              toast({
                title: "Error",
                description: "Failed to retrieve generated prompt. Please try again.",
                variant: "destructive",
              });
            }
          }
        }, 500);
      } else {
        await handlePromptGenerated(promptContent);
      }
    },
    onError: (error) => {
      setIsGeneratingPrompt(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate specification. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ rating, feedback }: { rating: number; feedback: string }) => {
      const response = await apiRequest("POST", "/api/feedback", { 
        ideaIterationId: parseInt(idea?.id?.toString() || "0"),
        feedbackRating: rating,
        feedbackComments: feedback
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve our suggestions.",
        duration: 3000,
      });
      // Reset feedback state
      setFeedbackRating(null);
      setFeedbackText("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const iterateIdeaMutation = useMutation({
    mutationFn: async ({ ideaId, userFeedback, currentIdeaContent }: { ideaId: number; userFeedback: string; currentIdeaContent: any }) => {
      const response = await apiRequest("POST", "/api/iterate-idea", { 
        ideaId,
        userFeedback,
        currentIdeaContent
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Idea updated successfully!",
        description: "The idea has been updated based on your feedback. You're now viewing the new version.",
        duration: 5000,
      });
      // Reset iteration state
      setIterationFeedback("");
      
      // Navigate to the new version if successful
      if (data.success && data.idea && params) {
        const newVersion = data.idea.version;
        const newPath = `/results/${data.idea.idea.magnetRequest.publicId}/ideas/${params.resultIdeaId}/v/${newVersion}?from_iteration=success`;
        
        console.log('Iteration successful, navigating to:', newPath);
        
        // Invalidate the query cache for this idea to ensure fresh data
        queryClient.invalidateQueries({ 
          queryKey: ["idea", params.publicId, params.resultIdeaId],
          exact: false 
        });
        
        // Navigate to the new version
        window.location.href = newPath;
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to iterate idea. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFeedbackSubmit = () => {
    if (!feedbackRating || !feedbackText.trim()) return;
    
    setIsSubmittingFeedback(true);
    submitFeedbackMutation.mutate(
      { rating: feedbackRating, feedback: feedbackText.trim() },
      {
        onSettled: () => {
          setIsSubmittingFeedback(false);
        }
      }
    );
  };

  const handleFeedbackCancel = () => {
    setFeedbackRating(null);
    setFeedbackText("");
  };

  const handleIterationSubmit = () => {
    if (!iterationFeedback.trim()) return;
    
    setIsIterating(true);
    iterateIdeaMutation.mutate(
      { 
        ideaId: idea!.ideaId, 
        userFeedback: iterationFeedback.trim(),
        currentIdeaContent: {
          name: idea!.name,
          summary: idea!.summary,
          detailedDescription: idea!.detailedDescription,
          whyThis: idea!.whyThis,
          complexityLevel: idea!.complexityLevel
        }
      },
      {
        onSettled: () => {
          setIsIterating(false);
        }
      }
    );
  };

  const handleShare = async () => {
    try {
      if (!params || !idea) return;
      const currentPath = versionNum > 0 
        ? `/results/${idea.idea.magnetRequest.publicId}/ideas/${params.resultIdeaId}/v/${versionNum}`
        : `/results/${idea.idea.magnetRequest.publicId}/ideas/${params.resultIdeaId}`;
      const shareUrl = generateShareUrl(currentPath, 'idea');
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "This idea's URL has been copied to your clipboard",
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading idea...</p>
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
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Idea Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = `/results/${idea.idea.magnetRequest.publicId}`}
              className="text-slate-700 hover:text-slate-500 p-0 h-auto hover:bg-transparent"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHelpBuildModalOpen(true)}
                className="text-slate-600 hover:text-slate-900"
              >
                <Hammer className="mr-1 h-4 w-4 text-green-600" />
                <span className="sm:hidden">Help me build this</span>
                <span className="hidden sm:inline">Help me build this</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="text-slate-600 hover:text-slate-900"
              >
                <Link className="h-4 w-4 text-blue-600 sm:mr-1" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              {iterations.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-300 hover:border-slate-400 rounded-full"
                    >
                      <span className="hidden sm:inline">v{versionNum}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {iterations.map((iteration) => (
                      <DropdownMenuItem
                        key={iteration.version}
                        onClick={() => {
                          const newPath = iteration.version === 0
                            ? `/results/${iteration.idea.magnetRequest.publicId}/ideas/${params?.resultIdeaId}`
                            : `/results/${iteration.idea.magnetRequest.publicId}/ideas/${params?.resultIdeaId}/v/${iteration.version}`;
                          window.location.href = newPath;
                        }}
                        className={versionNum === iteration.version ? "bg-slate-100" : ""}
                      >
                        <span>v{iteration.version}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
                      <div className="mb-4">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{idea.name}</h1>
              <p className="text-xl text-slate-600 mb-4">{idea.summary}</p>
              <div className="flex flex-col min-[400px]:flex-row min-[400px]:items-center gap-2 min-[400px]:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 font-medium">Complexity Level:</span>
                  <Badge className={getComplexityColor(idea.complexityLevel)}>
                    {idea.complexityLevel}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 font-medium">Business:</span>
                  <button
                    onClick={() => setIsBusinessProfileModalOpen(true)}
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    {idea.idea.magnetRequest.businessUrl ? (() => {
                      try {
                        const urlWithProtocol = idea.idea.magnetRequest.businessUrl.startsWith('http://') || idea.idea.magnetRequest.businessUrl.startsWith('https://') 
                          ? idea.idea.magnetRequest.businessUrl 
                          : `https://${idea.idea.magnetRequest.businessUrl}`;
                        return new URL(urlWithProtocol).hostname;
                      } catch {
                        return idea.idea.magnetRequest.businessUrl;
                      }
                    })() : 'View Profile'}
                  </button>
                </div>
              </div>
            </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Detailed Description */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Lead Magnet Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{idea.detailedDescription}</p>
              </CardContent>
            </Card>

            {/* Why This Lead Magnet */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Why This Lead Magnet?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{idea.whyThis}</p>
              </CardContent>
            </Card>

            {/* Iterate on This Idea */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-purple-600" />
                  Enhance This Idea
                </CardTitle>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Want to improve or further customize this idea to your business? Tell us how you'd like to modify it and we'll generate an updated version.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    <Textarea
                      placeholder="e.g., 'Our clients are mostly enterprise-level companies, focus more on leads for businesses of this size' or 'Our business focuses more on preventative care than treatment, can you adapt the idea more to this?' or 'Most of our customers are actually also first-time homebuyers'"
                      value={iterationFeedback}
                      onChange={(e) => setIterationFeedback(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-slate-500">
                      {iterationFeedback.length}
                    </div>
                  </div>
                  {iterationFeedback.trim().length > 0 && iterationFeedback.trim().length < 30 && (
                    <p className="text-sm text-amber-600">
                      Please provide at least 30 characters of feedback to use the enhance feature.
                    </p>
                  )}
                  <Button
                    onClick={handleIterationSubmit}
                    disabled={iterationFeedback.trim().length < 30 || isIterating}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isIterating ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        Updating idea...
                      </>
                    ) : (
                      <>
                        Enhance with feedback
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Generate AI-Ready Blueprint */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">
                  Start Building This Idea
                </CardTitle>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Generate an AI-ready prompt with detailed instructions that you can paste directly into an AI builder to bring your idea to life. If you prefer we help you build it, click 'Help me build' below
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!idea.magnetSpec && !idea.creationPrompt ? (
                    <Button
                      onClick={() => {
                        // Open modal immediately with loading state
                        setModalContent({
                          title: "Generating AI-Ready Prompt",
                          content: ""
                        });
                        setIsPromptModalOpen(true);
                        setIsGeneratingPrompt(true);
                        
                        const businessData = {
                          prodDescription: idea.idea.magnetRequest.prodDescription,
                          targetAudience: idea.idea.magnetRequest.targetAudience,
                          location: idea.idea.magnetRequest.location || ""
                        };
                        generateSpecMutation.mutate({ idea, businessData });
                      }}
                      disabled={generateSpecMutation.isPending || isIterating}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {generateSpecMutation.isPending ? (
                        <>
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-1 h-4 w-4" />
                          Get AI-ready prompt
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-2">
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
                          className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 bg-white"
                        >
                          View AI-ready prompt
                        </Button>
                      )}
                      {/* {idea.magnetSpec && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsTechSpecModalOpen(true);
                          }}
                          className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 bg-white"
                        >
                          View technical spec
                        </Button>
                      )} */}
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => setIsHelpBuildModalOpen(true)}
                    className="w-full text-slate-600 hover:text-slate-900"
                  >
                    <Hammer className="mr-1 h-4 w-4 text-green-600" />
                    Help me build this
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Feedback Widget */}
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">How useful was this idea?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setFeedbackRating(3)}
                      className={`flex-1 min-w-fit flex items-center justify-center gap-2 ${
                        feedbackRating === 3 
                          ? "bg-green-50 border-green-400 text-green-700 hover:bg-green-100 hover:border-green-500" 
                          : feedbackRating 
                            ? "text-green-400 border-green-200 opacity-50 hover:opacity-100 hover:text-green-600 hover:border-green-300 hover:bg-green-50" 
                            : "text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400"
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Great
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setFeedbackRating(2)}
                      className={`flex-1 min-w-fit flex items-center justify-center gap-2 ${
                        feedbackRating === 2 
                          ? "bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100 hover:border-amber-500" 
                          : feedbackRating 
                            ? "text-amber-400 border-amber-200 opacity-50 hover:opacity-100 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50" 
                            : "text-amber-600 border-amber-300 hover:bg-amber-50 hover:border-amber-400"
                      }`}
                    >
                      <Meh className="h-4 w-4" />
                      Ok
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setFeedbackRating(1)}
                      className={`flex-1 min-w-fit flex items-center justify-center gap-2 ${
                        feedbackRating === 1 
                          ? "bg-red-50 border-red-400 text-red-700 hover:bg-red-100 hover:border-red-500" 
                          : feedbackRating 
                            ? "text-red-400 border-red-200 opacity-50 hover:opacity-100 hover:text-red-600 hover:border-red-300 hover:bg-red-50" 
                            : "text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Not Useful
                    </Button>
                  </div>
                  
                  {feedbackRating && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="What made you rate the idea this way?"
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleFeedbackSubmit}
                          disabled={!feedbackText.trim() || isSubmittingFeedback}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingFeedback ? (
                            <>
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleFeedbackCancel}
                          disabled={isSubmittingFeedback}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
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
        isLoading={isGeneratingPrompt}
      />

      {/* Help Build Modal */}
      <HelpBuildModal
        isOpen={isHelpBuildModalOpen}
        onClose={() => setIsHelpBuildModalOpen(false)}
        ideaName={idea.name}
        ideaIterationId={idea.id}
      />

      {/* Business Profile Modal */}
      <BusinessProfileModal
        isOpen={isBusinessProfileModalOpen}
        onClose={() => setIsBusinessProfileModalOpen(false)}
        businessData={{
          prodDescription: idea.idea.magnetRequest.prodDescription,
          targetAudience: idea.idea.magnetRequest.targetAudience,
          location: idea.idea.magnetRequest.location,
          businessUrl: idea.idea.magnetRequest.businessUrl
        }}
      />
    </div>
  );
} 