import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Magnet, Edit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { generateIdeasSchema, type LeadMagnetIdea } from "@shared/schema";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { IdeaCard } from "@/components/idea-card";
import { EditModal } from "@/components/edit-modal";
import { IdeaDetailModal } from "@/components/idea-detail-modal";

type FormData = {
  businessType: string;
  targetAudience: string;
  location?: string;
};

export default function Home() {
  const [ideas, setIdeas] = useState<LeadMagnetIdea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<LeadMagnetIdea[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<LeadMagnetIdea | null>(null);
  const [currentData, setCurrentData] = useState<FormData | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['Simple', 'Moderate', 'Advanced']));
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(generateIdeasSchema),
    defaultValues: {
      businessType: "",
      targetAudience: "",
      location: "",
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
      toast({
        title: "Success!",
        description: `Generated ${data.ideas.length} lead magnet ideas for your business.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate ideas. Please try again.",
        variant: "destructive",
      });
    },
  });

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

  const showForm = ideas.length === 0 && !generateIdeasMutation.isPending;
  const showResults = ideas.length > 0 && !generateIdeasMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Magnet className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Magnetize</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">How it works</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Examples</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Generate Powerful Lead Magnets</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Get AI-powered web app ideas that attract your ideal customers and naturally lead to your paid services.
          </p>
        </div>

        {/* Input Form */}
        {showForm && (
          <div className="mb-8">
            <Card className="bg-white shadow-sm border border-slate-200">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Tell us about your business</h3>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">
                            Business Type <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your product or service (e.g., Web design agency specializing in e-commerce websites)"
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
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
                            <Textarea
                              placeholder="Describe your ideal customers (e.g., Small business owners with 10-50 employees looking to increase online sales)"
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
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
                            Location <span className="text-slate-400">(Optional)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., San Francisco, CA or Global"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6"
                      disabled={generateIdeasMutation.isPending}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Lead Magnet Ideas
                    </Button>
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
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  <LoadingSpinner className="mx-auto text-blue-500" size="lg" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Generating Your Lead Magnet Ideas</h3>
                <p className="text-slate-600">Our AI is analyzing your business and creating personalized recommendations...</p>
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
                      <div>
                        <span className="text-sm font-medium text-slate-500">Business Type:</span>
                        <p className="text-slate-900 mt-1">{currentData.businessType}</p>
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
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>{filteredIdeas.length} of {ideas.length} ideas shown</span>
                </div>
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
        />
      </main>
    </div>
  );
}
