import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import type { ProcessingStep, DailyMedDetails } from "@shared/schema";

interface ProcessingPipelineProps {
  steps: ProcessingStep[];
  isProcessing: boolean;
  dailyMedResults: DailyMedDetails[];
}

export function ProcessingPipeline({ steps, isProcessing, dailyMedResults }: ProcessingPipelineProps) {
  const getStepIcon = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-white" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-white animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-white" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStepColor = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "complete":
        return "bg-green-500";
      case "processing":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-slate-100";
    }
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case "parse":
        return "Parse Patient Information";
      case "assess":
        return "Assess Learning Level";
      case "dailymed":
        return "Query DailyMed Database";
      case "openai":
        return "Process with OpenAI";
      case "games":
        return "Generate Educational Games";
      case "modules":
        return "Generate Learning Modules";
      default:
        return step;
    }
  };

  const getStepDescription = (step: string) => {
    switch (step) {
      case "parse":
        return "Extract conditions and medications";
      case "assess":
        return "Determine appropriate difficulty level";
      case "dailymed":
        return "Fetch medication labels and side effects";
      case "openai":
        return "Simplify medical data for patient education";
      case "games":
        return "Create crosswords, word games, and quizzes";
      case "modules":
        return "Create beginner, intermediate, and advanced modules";
      default:
        return "";
    }
  };

  const defaultSteps = [
    { step: "parse", status: "pending" as const },
    { step: "assess", status: "pending" as const },
    { step: "dailymed", status: "pending" as const },
    { step: "modules", status: "pending" as const }
  ];

  const displaySteps = steps.length > 0 ? steps : defaultSteps;

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200 h-full">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-medical-green/10 p-2 rounded-lg">
            <svg className="w-5 h-5 text-medical-green" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Processing Pipeline</h2>
            <p className="text-sm text-slate-600">Real-time API integration status</p>
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-4">
          {displaySteps.map((step, index) => (
            <div key={step.step} className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg">
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-slate-600">{index + 1}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-slate-900">{getStepTitle(step.step)}</h3>
                <p className="text-xs text-slate-600">{getStepDescription(step.step)}</p>
                {(step as ProcessingStep).message && (
                  <p className="text-xs text-blue-600 mt-1">{(step as ProcessingStep).message}</p>
                )}
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getStepColor(step.status)}`}>
                {getStepIcon(step.status)}
              </div>
            </div>
          ))}
        </div>

        {/* Current Processing Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"/>
            </svg>
            <h4 className="text-sm font-medium text-blue-900">Processing Information</h4>
          </div>
          <p className="text-xs text-blue-700">
            {isProcessing 
              ? "Processing patient information through DailyMed and OpenAI APIs to generate educational content..."
              : dailyMedResults.length > 0 
                ? `Processing complete. Found ${dailyMedResults.length} medications and generated educational games.`
                : "Ready to process patient information. Enter details above and click generate to begin API integration testing."
            }
          </p>
          {dailyMedResults.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-blue-700 font-medium">Medications found:</p>
              <ul className="text-xs text-blue-600 mt-1 ml-2">
                {dailyMedResults.map((med, index) => (
                  <li key={index}>• {med.genericName || med.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
