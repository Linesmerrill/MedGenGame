import { useState } from "react";
import { PatientForm } from "@/components/patient-form";
import { ProcessingPipeline } from "@/components/processing-pipeline";
import { GeneratedGames } from "@/components/generated-games";
import type { GameModule, ProcessingStep, DailyMedDetails, LearningAssessment } from "@shared/schema";

export default function Home() {
  const [modules, setModules] = useState<GameModule[]>([]);
  const [assessment, setAssessment] = useState<LearningAssessment | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [dailyMedResults, setDailyMedResults] = useState<DailyMedDetails[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const handleModulesGenerated = (
    generatedModules: GameModule[], 
    steps: ProcessingStep[], 
    medResults: DailyMedDetails[],
    learningAssessment: LearningAssessment | null
  ) => {
    setModules(generatedModules);
    setAssessment(learningAssessment);
    setProcessingSteps(steps);
    setDailyMedResults(medResults);
    setHasResults(true);
    setIsProcessing(false);
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
    setHasResults(false);
    setModules([]);
    setAssessment(null);
    setProcessingSteps([]);
    setDailyMedResults([]);
  };

  const handleProcessingUpdate = (steps: ProcessingStep[]) => {
    setProcessingSteps(steps);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-medical-blue p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">MedGame Generator</h1>
                <p className="text-sm text-slate-600">Educational Content for Patient Care</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Hospital Staff Portal</span>
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Patient Form */}
          <PatientForm 
            onGenerationStart={handleProcessingStart}
            onModulesGenerated={handleModulesGenerated}
            onProcessingUpdate={handleProcessingUpdate}
            isProcessing={isProcessing}
          />

          {/* Processing Pipeline */}
          <div className="lg:row-span-2">
            <ProcessingPipeline 
              steps={processingSteps}
              isProcessing={isProcessing}
              dailyMedResults={dailyMedResults}
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="text-medical-blue mb-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-900">Sample Patient</div>
                  <div className="text-xs text-slate-600">Load example data</div>
                </button>
                <button className="p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="text-medical-green mb-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13.5,8H12V13L16.28,15.54L17,14.33L13.5,12.25V8M13,3A9,9 0 0,0 4,12H1L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3"/>
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-900">Recent Games</div>
                  <div className="text-xs text-slate-600">View generated content</div>
                </button>
                <button className="p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="text-medical-purple mb-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-900">API Settings</div>
                  <div className="text-xs text-slate-600">Configure endpoints</div>
                </button>
                <button className="p-3 text-left border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="text-slate-600 mb-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z"/>
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-slate-900">Help Guide</div>
                  <div className="text-xs text-slate-600">Usage instructions</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Learning Modules Section */}
        {hasResults && (
          <GeneratedGames 
            games={modules.flatMap(module => module.games)}
            modules={modules}
            assessment={assessment}
            dailyMedResults={dailyMedResults}
            processingSteps={processingSteps}
          />
        )}
      </main>
    </div>
  );
}
