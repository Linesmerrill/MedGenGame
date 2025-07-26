import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, RotateCcw, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { GameModule, ProcessingStep, DailyMedDetails, GenerateGamesResponse, DifficultyLevel } from "@shared/schema";

interface PatientFormProps {
  onGenerationStart: () => void;
  onModulesGenerated: (modules: GameModule[], steps: ProcessingStep[], dailyMedResults: DailyMedDetails[], assessment: any) => void;
  onProcessingUpdate: (steps: ProcessingStep[]) => void;
  isProcessing: boolean;
}

export function PatientForm({ 
  onGenerationStart, 
  onModulesGenerated, 
  onProcessingUpdate,
  isProcessing 
}: PatientFormProps) {
  const [patientInfo, setPatientInfo] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel | 'auto'>('auto');
  const [dailyMedStatus, setDailyMedStatus] = useState<"ready" | "processing" | "complete" | "error">("ready");
  const [openAIStatus, setOpenAIStatus] = useState<"ready" | "processing" | "complete" | "error">("ready");
  const { toast } = useToast();

  const generateModulesMutation = useMutation({
    mutationFn: async (data: { patientInfo: string; difficultyLevel: DifficultyLevel | 'auto' }) => {
      const response = await apiRequest("POST", "/api/generate-modules", data);
      return response.json() as Promise<GenerateGamesResponse>;
    },
    onSuccess: (data) => {
      if (data.success && data.modules) {
        onModulesGenerated(
          data.modules, 
          data.processingSteps || [], 
          data.dailyMedResults || [],
          data.assessment || null
        );
        setDailyMedStatus("complete");
        setOpenAIStatus("complete");
        toast({
          title: "Learning Modules Generated Successfully",
          description: `Created ${data.modules.length} adaptive learning modules for patient education.`,
        });
      } else {
        throw new Error(data.message || "Failed to generate modules");
      }
    },
    onError: (error) => {
      setDailyMedStatus("error");
      setOpenAIStatus("error");
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate learning modules. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientInfo.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter patient information before generating games.",
        variant: "destructive",
      });
      return;
    }

    onGenerationStart();
    setDailyMedStatus("processing");
    setOpenAIStatus("processing");

    // Simulate processing steps updates for new modular system
    const steps: ProcessingStep[] = [
      { step: "parse", status: "processing", message: "Parsing patient information..." },
      { step: "assess", status: "pending", message: "Preparing learning level assessment..." },
      { step: "dailymed", status: "pending", message: "Preparing to query DailyMed..." },
      { step: "modules", status: "pending", message: "Preparing module generation..." }
    ];

    onProcessingUpdate(steps);

    generateModulesMutation.mutate({ patientInfo, difficultyLevel });
  };

  const handleClear = () => {
    setPatientInfo("");
    setDifficultyLevel('auto');
    setDailyMedStatus("ready");
    setOpenAIStatus("ready");
  };

  const loadSampleData = () => {
    setPatientInfo(
      "Patient diagnosed with Type 2 diabetes mellitus, currently prescribed Metformin 500mg twice daily and Lisinopril 10mg once daily for mild hypertension. Recovery plan includes carbohydrate counting, regular blood glucose monitoring 3x daily, 30 minutes of moderate exercise 5 days per week, and quarterly HbA1c monitoring. Patient education needed on medication adherence, dietary modifications, and recognition of hypoglycemic episodes."
    );
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "ready":
        return { text: "Ready", className: "bg-slate-200 text-slate-600" };
      case "processing":
        return { text: "Processing...", className: "bg-blue-100 text-blue-700" };
      case "complete":
        return { text: "Complete", className: "bg-green-100 text-green-700" };
      case "error":
        return { text: "Error", className: "bg-red-100 text-red-700" };
      default:
        return { text: "Ready", className: "bg-slate-200 text-slate-600" };
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-medical-blue/10 p-2 rounded-lg">
            <svg className="w-5 h-5 text-medical-blue" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Adaptive Learning Generator</h2>
            <p className="text-sm text-slate-600">Create personalized educational modules for patient care</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="patientInfo" className="block text-sm font-medium text-slate-700 mb-2">
              Patient Details
              <span className="text-slate-500 font-normal ml-2">
                (symptoms, conditions, medications, recovery plan)
              </span>
            </Label>
            <Textarea
              id="patientInfo"
              value={patientInfo}
              onChange={(e) => setPatientInfo(e.target.value)}
              rows={6}
              className="resize-none"
              placeholder="Example: Patient diagnosed with Type 2 diabetes, currently on Metformin 500mg twice daily. Recovery plan includes dietary modifications, blood glucose monitoring, and regular exercise. Patient also has mild hypertension managed with lifestyle changes."
              required
            />
          </div>

          {/* Difficulty Level Selector */}
          <div>
            <Label htmlFor="difficultyLevel" className="block text-sm font-medium text-slate-700 mb-2">
              Learning Level
              <span className="text-slate-500 font-normal ml-2">
                (auto-adapts based on patient assessment)
              </span>
            </Label>
            <Select value={difficultyLevel} onValueChange={(value) => setDifficultyLevel(value as DifficultyLevel | 'auto')}>
              <SelectTrigger>
                <SelectValue placeholder="Select learning level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>Auto-Adaptive (Recommended)</span>
                  </div>
                </SelectItem>
                <SelectItem value="beginner">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Beginner - New to condition</span>
                  </div>
                </SelectItem>
                <SelectItem value="intermediate">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Intermediate - Some experience</span>
                  </div>
                </SelectItem>
                <SelectItem value="advanced">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Advanced - Long-term management</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              type="submit" 
              disabled={isProcessing}
              className="flex-1 bg-medical-blue hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Generate Learning Modules
                </>
              )}
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isProcessing}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* API Status Indicators */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z"/>
              </svg>
              <span className="text-sm text-slate-600">DailyMed API</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusDisplay(dailyMedStatus).className}`}>
              {getStatusDisplay(dailyMedStatus).text}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
              </svg>
              <span className="text-sm text-slate-600">OpenAI API</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusDisplay(openAIStatus).className}`}>
              {getStatusDisplay(openAIStatus).text}
            </span>
          </div>
        </div>

        {/* Sample Data Button */}
        <div className="mt-4">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={loadSampleData}
            disabled={isProcessing}
            className="text-medical-blue border-medical-blue hover:bg-medical-blue/5"
          >
            Load Sample Patient Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
