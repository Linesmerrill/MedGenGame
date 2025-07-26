import type { Express } from "express";
import { createServer, type Server } from "http";
import { patientInfoSchema, type GenerateGamesResponse, type ProcessingStep } from "@shared/schema";
import { dailyMedService } from "./services/dailymed";
import { openAIService } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // New modular route for adaptive learning
  app.post("/api/generate-modules", async (req, res) => {
    try {
      const validation = patientInfoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient information provided",
          errors: validation.error.errors
        });
      }

      const { patientInfo, difficultyLevel } = validation.data;

      // Enhanced processing steps for modular system
      const processingSteps: ProcessingStep[] = [
        { step: "parse", status: "processing", message: "Parsing patient information..." },
        { step: "assess", status: "pending", message: "Assessing learning level..." },
        { step: "dailymed", status: "pending", message: "Querying DailyMed database..." },
        { step: "modules", status: "pending", message: "Generating learning modules..." }
      ];

      // Step 1: Parse patient information
      processingSteps[0] = { step: "parse", status: "complete", message: "Patient information parsed successfully" };

      // Step 2: Assess learning level
      processingSteps[1] = { step: "assess", status: "processing", message: "Analyzing patient background..." };
      
      let assessment: any = null;
      let dailyMedResults: any[] = [];
      
      try {
        // Get DailyMed results first for assessment
        dailyMedResults = await dailyMedService.searchMultipleMedications(patientInfo);
        
        // Assess learning level
        assessment = await openAIService.assessPatientLearningLevel(patientInfo, dailyMedResults);
        processingSteps[1] = { 
          step: "assess", 
          status: "complete", 
          message: `Recommended starting level: ${assessment.suggestedStartingLevel}` 
        };
      } catch (error) {
        console.error('Assessment error:', error);
        processingSteps[1] = { 
          step: "assess", 
          status: "error", 
          message: "Assessment failed, using default beginner level" 
        };
      }

      // Step 3: Query DailyMed API (already done above)
      processingSteps[2] = { 
        step: "dailymed", 
        status: "complete", 
        message: `Found ${dailyMedResults.length} medications in database` 
      };

      // Step 4: Generate modules
      processingSteps[3] = { step: "modules", status: "processing", message: "Creating adaptive learning modules..." };

      let modules: any[] = [];
      try {
        const requestedLevel = difficultyLevel === 'auto' ? undefined : difficultyLevel as any;
        modules = await openAIService.generateModularEducationalGames(patientInfo, dailyMedResults, requestedLevel);
        processingSteps[3] = { step: "modules", status: "complete", message: `Generated ${modules.length} learning modules` };
      } catch (error) {
        console.error('Module generation error:', error);
        processingSteps[3] = { step: "modules", status: "error", message: "Failed to generate learning modules" };
        
        return res.status(500).json({
          success: false,
          message: "Failed to generate learning modules. Please try again.",
          processingSteps
        });
      }

      return res.json({
        success: true,
        message: `Successfully generated ${modules.length} learning modules`,
        modules,
        assessment,
        dailyMedResults,
        processingSteps
      });
    } catch (error) {
      console.error('Generate modules error:', error);
      return res.status(500).json({
        success: false,
        message: "Internal server error generating modules"
      });
    }
  });

  app.post("/api/generate-games", async (req, res) => {
    try {
      // Validate request body
      const validation = patientInfoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid patient information provided",
          errors: validation.error.errors
        });
      }

      const { patientInfo } = validation.data;

      // Initialize processing steps
      const processingSteps: ProcessingStep[] = [
        { step: "parse", status: "processing", message: "Parsing patient information..." },
        { step: "dailymed", status: "pending", message: "Querying DailyMed database..." },
        { step: "openai", status: "pending", message: "Processing with OpenAI..." },
        { step: "games", status: "pending", message: "Generating educational games..." }
      ];

      // Step 1: Parse patient information (already done by validation)
      processingSteps[0] = { step: "parse", status: "complete", message: "Patient information parsed successfully" };

      // Step 2: Query DailyMed API
      processingSteps[1] = { step: "dailymed", status: "processing", message: "Searching for medications..." };
      
      let dailyMedResults: any[] = [];
      try {
        dailyMedResults = await dailyMedService.searchMultipleMedications(patientInfo);
        processingSteps[1] = { 
          step: "dailymed", 
          status: "complete", 
          message: `Found ${dailyMedResults.length} medications in database` 
        };
      } catch (error) {
        console.error('DailyMed API error:', error);
        processingSteps[1] = { 
          step: "dailymed", 
          status: "error", 
          message: "Failed to fetch medication data. Using patient information only." 
        };
        dailyMedResults = [];
      }

      // Step 3: Process with OpenAI
      processingSteps[2] = { step: "openai", status: "processing", message: "Generating educational content..." };
      processingSteps[3] = { step: "games", status: "processing", message: "Creating games..." };

      let games: any[] = [];
      try {
        games = await openAIService.generateEducationalGames(patientInfo, dailyMedResults);
        processingSteps[2] = { step: "openai", status: "complete", message: "Content generated successfully" };
        processingSteps[3] = { step: "games", status: "complete", message: `Generated ${games.length} educational games` };
      } catch (error) {
        console.error('OpenAI API error:', error);
        processingSteps[2] = { step: "openai", status: "error", message: "Failed to generate content with AI" };
        processingSteps[3] = { step: "games", status: "error", message: "Could not create educational games" };
        
        return res.status(500).json({
          success: false,
          message: "Failed to generate educational games. Please check your OpenAI API configuration.",
          processingSteps
        });
      }

      const response: GenerateGamesResponse = {
        success: true,
        message: `Successfully generated ${games.length} educational games`,
        games,
        dailyMedResults,
        processingSteps
      };

      res.json(response);

    } catch (error) {
      console.error('Error in generate-games endpoint:', error);
      res.status(500).json({
        success: false,
        message: "An unexpected error occurred while generating games"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
