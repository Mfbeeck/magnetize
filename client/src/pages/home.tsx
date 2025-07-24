import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Magnet, Edit, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateIdeasSchema, type LeadMagnetIdea } from "@shared/schema";
import { IdeaCard } from "@/components/idea-card";
import { EditModal } from "@/components/edit-modal";
import { IdeaDetailModal } from "@/components/idea-detail-modal";
import { AboutModal } from "@/components/about-modal";

type FormData = {
  prodDescription: string;
  targetAudience: string;
  location?: string;
  businessUrl?: string;
};

export default function Home() {
  const [ideas, setIdeas] = useState<LeadMagnetIdea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<LeadMagnetIdea[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<LeadMagnetIdea | null>(null);
  const [currentData, setCurrentData] = useState<FormData | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['Simple', 'Moderate', 'Advanced']));
  const [progress, setProgress] = useState(0);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(generateIdeasSchema),
    defaultValues: {
      prodDescription: "",
      targetAudience: "",
      location: "",
      businessUrl: "",
    },
  });

  const generateIdeasMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/generate-ideas", data);
      return response.json();
    },
    onSuccess: (data) => {
      setIdeas(data.ideas);
      setFilteredIdeas(data.ideas);
      setCurrentData(form.getValues());
      setProgress(0);
      toast({
        title: "Your lead magnet ideas are ready!",
        description: `Magnetize generated ${data.ideas.length} ideas for your business. Click any of them to see more details.`,
      });
      // Redirect to the results page
      window.location.href = `/results/${data.publicId}`;
    },
    onError: (error) => {
      setProgress(0);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate ideas. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Progress simulation effect
  useEffect(() => {
    if (generateIdeasMutation.isPending) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev; // Keep the current progress instead of capping at 90%
          }
          return prev + Math.random() * 4 + 1; // Random increment between 1-5
        });
      }, 1200); // Increased to 1200ms for slower progression

      return () => clearInterval(interval);
    }
  }, [generateIdeasMutation.isPending]);

  const onSubmit = (data: FormData) => {
    generateIdeasMutation.mutate(data);
  };

  const handleEdit = (data: FormData) => {
    form.reset(data);
    setCurrentData(data);
    generateIdeasMutation.mutate(data);
    setIsModalOpen(false);
  };

  const handleRegenerate = () => {
    if (currentData) {
      generateIdeasMutation.mutate(currentData);
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
    
    // Filter ideas based on active filters
    const filtered = ideas.filter(idea => newFilters.has(idea.complexityLevel));
    setFilteredIdeas(filtered);
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

  // Helper to check if a string is a valid URL (require protocol)
  function isValidUrl(url: string | undefined): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return /^https?:\/\//i.test(parsed.href);
    } catch {
      return false;
    }
  }

  // Autofill with AI handler
  const handleAutofillWithAI = async () => {
    const businessUrl = form.getValues("businessUrl");
    if (!businessUrl) {
      toast({
        title: "Please enter a business website URL first.",
        variant: "destructive",
      });
      return;
    }
    setIsAutofilling(true);
    try {
      // Call backend endpoint to run OpenAI prompt and web_search_preview
      const response = await apiRequest("POST", "/api/autofill-business-profile", { businessUrl });
      const result = await response.json();
      if (result.prodDescription && result.targetAudience) {
        form.setValue("prodDescription", result.prodDescription);
        form.setValue("targetAudience", result.targetAudience);
        toast({
          title: "AI autofill complete!",
          description: "The product/service description and target audience fields have been filled. Feel free to edit them if needed.",
        });
      } else {
        throw new Error("AI did not return expected fields");
      }
    } catch (err) {
      toast({
        title: "Autofill failed",
        description: err instanceof Error ? err.message : "Could not analyze website.",
        variant: "destructive",
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  const showForm = ideas.length === 0 && !generateIdeasMutation.isPending;
  const showResults = ideas.length > 0 && !generateIdeasMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => {
                setIdeas([]);
                setFilteredIdeas([]);
                setCurrentData(null);
                setActiveFilters(new Set(['Simple', 'Moderate', 'Advanced']));
                form.reset();
              }}
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
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        {showForm && (
          <div className="text-center mb-12">
            <h2 className="max-w-xl mx-auto text-4xl font-bold text-slate-900 mb-4">Discover the Right Lead Magnet for Your Business</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            People don’t want to be sold, they want to be helped. Magnetize gives you lead magnet ideas you can build today to earn attention by delivering real value upfront.
            </p>
          </div>
        )}

        {/* Input Form */}
        {showForm && (
          <div className="mb-8">
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Tell us about your business</h3>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Business Website field */}
                    <FormField
                      control={form.control}
                      name="businessUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">
                            Website URL <span className="text-slate-400">(Optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://yourbusiness.com"
                              type="url"
                              {...field}
                            />
                          </FormControl>
                          {Boolean(field.value?.trim()) && !isValidUrl(field.value) && (
                            <p className="text-xs text-red-500 mt-1">Please enter a valid URL starting with http:// or https://</p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Autofill with AI button */}
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`inline-block ${
                                (!form.watch("businessUrl") || !isValidUrl(form.watch("businessUrl"))) 
                                  ? "cursor-not-allowed" 
                                  : ""
                              }`}
                            >
                              <Button
                                type="button"
                                variant="outline"
                                className={`max-w-xs w-auto ml-0 mb-2 flex items-center justify-center border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-600 ${
                                  (!form.watch("businessUrl") || !isValidUrl(form.watch("businessUrl"))) 
                                    ? "opacity-50 hover:bg-white hover:border-blue-600 pointer-events-auto" 
                                    : ""
                                }`}
                                onClick={handleAutofillWithAI}
                                disabled={
                                  isAutofilling ||
                                  !form.watch("businessUrl") ||
                                  !isValidUrl(form.watch("businessUrl"))
                                }
                              >
                                {isAutofilling ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4 mr-2" />
                                )}
                                {isAutofilling ? "Analyzing website..." : "Autofill with AI"}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {(!form.watch("businessUrl") || !isValidUrl(form.watch("businessUrl"))) && (
                            <TooltipContent side="top" align="start" className="bg-slate-900 text-white border-slate-900">
                              <p>Fill in the website URL to use autofill</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                      <p className="text-xs text-slate-500 mt-1">
                        AI will analyze your website and automatically fill in the required product/service description and target audience fields below.
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="prodDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">
                            Product or Service Description <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Textarea
                                    placeholder="Describe your product or service (e.g., Web design agency specializing in e-commerce websites)"
                                    className="resize-none"
                                    rows={3}
                                    {...field}
                                    disabled={isAutofilling}
                                  />
                                </TooltipTrigger>
                                {isAutofilling && (
                                  <TooltipContent side="top" align="start" sideOffset={10} className="bg-slate-900 text-white border-slate-900">
                                    <p>Can't edit until autofill finishes running</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetAudience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">
                            Target Audience <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Textarea
                                    placeholder="Describe your ideal customers (e.g., Small business owners with 10-50 employees looking to increase online sales)"
                                    className="resize-none"
                                    rows={3}
                                    {...field}
                                    disabled={isAutofilling}
                                  />
                                </TooltipTrigger>
                                {isAutofilling && (
                                  <TooltipContent side="top" align="start" sideOffset={10} className="bg-slate-900 text-white border-slate-900">
                                    <p>Can't edit until autofill finishes running</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">
                            Where Are Your Customers Located? <span className="text-slate-400">(Optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., City, State, Country, Region or Global"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={`w-full ${
                              (Boolean(generateIdeasMutation.isPending) ||
                                !form.watch("prodDescription") ||
                                !form.watch("targetAudience") ||
                                (Boolean(form.watch("businessUrl")?.trim()) && !isValidUrl(form.watch("businessUrl"))))
                                ? "cursor-not-allowed" 
                                : ""
                            }`}
                          >
                            <Button
                              type="submit"
                              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 ${
                                (Boolean(generateIdeasMutation.isPending) ||
                                  !form.watch("prodDescription") ||
                                  !form.watch("targetAudience") ||
                                  (Boolean(form.watch("businessUrl")?.trim()) && !isValidUrl(form.watch("businessUrl"))))
                                  ? "opacity-50 pointer-events-auto" 
                                  : ""
                              }`}
                              disabled={
                                Boolean(generateIdeasMutation.isPending) ||
                                !form.watch("prodDescription") ||
                                !form.watch("targetAudience") ||
                                (Boolean(form.watch("businessUrl")?.trim()) && !isValidUrl(form.watch("businessUrl")))
                              }
                            >
                              Get Lead Magnet Ideas
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {(Boolean(generateIdeasMutation.isPending) ||
                          !form.watch("prodDescription") ||
                          !form.watch("targetAudience") ||
                          (Boolean(form.watch("businessUrl")?.trim()) && !isValidUrl(form.watch("businessUrl")))) && (
                          <TooltipContent side="top" align="start" sideOffset={26} className="bg-slate-900 text-white border-slate-900">
                            <p>Please fill in all of the required fields to get lead magnet ideas</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {generateIdeasMutation.isPending && (
          <div className="mb-8">
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Finding the Right Lead Magnet for Your Business</h3>
                  <p className="text-slate-600 mb-6">
                    Analyzing your answers to generate smart, personalized ideas your audience will actually want...
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>Generating ideas...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="text-xs text-slate-500 text-center">
                    {progress < 30 && "Analyzing your business context..."}
                    {progress >= 30 && progress < 60 && "Researching target audience needs..."}
                    {progress >= 60 && progress < 90 && "Creating personalized lead magnet ideas..."}
                    {progress >= 90 && "Finalizing your ideas..."}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Section */}
        {showResults && currentData && (
          <div>
            {/* User Input Summary */}
            <Card className="bg-white shadow-sm border border-slate-200 mb-8">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Business Profile</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {currentData.businessUrl && (
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-slate-500">Business Website:</span>
                          <p className="text-slate-900 mt-1">
                            <a href={currentData.businessUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                              {currentData.businessUrl}
                            </a>
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-slate-500">Product or Service Description:</span>
                        <p className="text-slate-900 mt-1">{currentData.prodDescription}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-500">Target Audience:</span>
                        <p className="text-slate-900 mt-1">{currentData.targetAudience}</p>
                      </div>
                      {currentData.location && (
                        <div className="md:col-span-2">
                          <span className="text-sm font-medium text-slate-500">Location:</span>
                          <p className="text-slate-900 mt-1">{currentData.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-semibold text-slate-900">Your Lead Magnet Ideas</h3>
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
              {filteredIdeas.map((idea, index) => (
                <IdeaCard key={index} idea={idea} onViewDetails={() => handleViewDetails(idea)} />
              ))}
            </div>

            {filteredIdeas.length === 0 && ideas.length > 0 && (
              <div className="text-center py-8">
                <p className="text-slate-600">No ideas match the selected complexity filters.</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your filter selection above.</p>
              </div>
            )}

            {/* Generate New Ideas Button */}
            <div className="text-center">
              <Button
                onClick={handleRegenerate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6"
                disabled={generateIdeasMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate New Ideas
              </Button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <EditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleEdit}
          initialData={currentData}
        />

        {/* Idea Detail Modal */}
        <IdeaDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          idea={selectedIdea}
          businessData={currentData || undefined}
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
