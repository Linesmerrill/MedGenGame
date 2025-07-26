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

      // Step 2: Extract medications using OpenAI
      processingSteps[1] = { step: "assess", status: "processing", message: "Extracting medications from patient information..." };

      let assessment: any = null;
      let dailyMedResults: any[] = [];
      let extractedMedications: any[] = [];
      let searchLog: Array<{medication: string, searchTerm: string, found: boolean, resultTitle?: string, error?: string, rejectedReasons?: string[], requestedFormulation?: 'IR' | 'ER', deliveryMethod?: string}> = [];
      let medicationValidation: any = null;

      try {
        // Extract medications using OpenAI first
        extractedMedications = await openAIService.extractMedicationsFromText(patientInfo);
        console.log('OpenAI extracted medications:', extractedMedications);

        // Get DailyMed results using extracted medications
        const searchResult = await dailyMedService.searchMultipleMedications(patientInfo, extractedMedications);
        dailyMedResults = searchResult.results;
        searchLog = searchResult.searchLog;

        // Validate the matches
        medicationValidation = await openAIService.validateMedicationMatches(patientInfo, extractedMedications, dailyMedResults);
        console.log('Validation result:', medicationValidation);

        // If validation failed and we have corrected search terms, retry with those
        if (!medicationValidation.validated && medicationValidation.correctedSearchTerms && medicationValidation.correctedSearchTerms.length > 0) {
          console.log('Validation failed, retrying with corrected search terms...');
          
          // Create new search results array to replace the original
          let improvedResults: any[] = [];
          let improvedSearchLog: any[] = [...searchLog];
          let foundAtLeastOne = false;
          
          // Search with corrected search terms in parallel
          const retrySearchPromises = medicationValidation.correctedSearchTerms.map(async (searchTerm, index) => {
            try {
              console.log(`Retrying search for: "${searchTerm}"`);
              const results = await dailyMedService.searchMedications(searchTerm);
              
              if (results.length > 0 && index < extractedMedications.length) {
                const medication = extractedMedications[index];
                
                // Find the best match from retry results
                for (const result of results.slice(0, 3)) {
                  const matchResult = await dailyMedService.isAppropriateMatchWithReasons(medication, result);
                  if (matchResult.isMatch) {
                    console.log(`Retry successful: Found ${result.title} for ${medication.name}`);
                    
                    // Convert to DailyMedDetails format
                    const improvedDetails = {
                      setId: result.setId,
                      title: result.title,
                      genericName: result.genericName,
                      brandName: result.brandName,
                      labeler: result.labeler,
                      activeIngredients: result.genericName ? [result.genericName] : [],
                      indications: await dailyMedService.getCommonIndications(medication.name, medication.formulation),
                      dosageAndAdministration: await dailyMedService.getCommonDosage(medication.name, medication.formulation),
                      contraindications: await dailyMedService.getCommonContraindications(medication.name, medication.formulation),
                      warningsAndPrecautions: await dailyMedService.getCommonWarnings(medication.name, medication.formulation),
                      adverseReactions: await dailyMedService.getCommonSideEffects(medication.name, medication.formulation),
                    };
                    
                    return {
                      index,
                      medication: medication.name,
                      searchTerm,
                      found: true,
                      details: improvedDetails,
                      resultTitle: result.title
                    };
                  }
                }
              }
              
              return {
                index,
                medication: index < extractedMedications.length ? extractedMedications[index].name : 'Unknown',
                searchTerm,
                found: false,
                details: null,
                resultTitle: undefined
              };
              
            } catch (error) {
              console.error(`Retry search failed for "${searchTerm}":`, error);
              return {
                index,
                medication: index < extractedMedications.length ? extractedMedications[index].name : 'Unknown',
                searchTerm,
                found: false,
                details: null,
                error: error.message
              };
            }
          });

          const retryResults = await Promise.all(retrySearchPromises);
          
          // Process retry results and build new results array
          for (let i = 0; i < extractedMedications.length; i++) {
            const retryResult = retryResults[i];
            const medication = extractedMedications[i];
            
            if (retryResult && retryResult.found && retryResult.details) {
              // Use the improved result
              improvedResults[i] = retryResult.details;
              foundAtLeastOne = true;
              
              // Add success log entry
              improvedSearchLog.push({
                medication: medication.name,
                searchTerm: `${retryResult.searchTerm} (corrected)`,
                found: true,
                resultTitle: retryResult.resultTitle,
                requestedFormulation: medication.formulation,
                deliveryMethod: medication.deliveryMethod || 'unspecified'
              });
            } else {
              // Keep original result if we had one, or add placeholder
              if (i < dailyMedResults.length && dailyMedResults[i]) {
                improvedResults[i] = dailyMedResults[i];
              } else {
                // Add placeholder for failed medication
                improvedResults[i] = null;
              }
              
              // Add failure log entry
              improvedSearchLog.push({
                medication: medication.name,
                searchTerm: `${retryResult?.searchTerm || 'Unknown'} (corrected - failed)`,
                found: false,
                error: retryResult?.error || 'No appropriate match found',
                requestedFormulation: medication.formulation,
                deliveryMethod: medication.deliveryMethod || 'unspecified'
              });
            }
          }
          
          // Only update results if we found at least one improvement
          if (foundAtLeastOne) {
            dailyMedResults = improvedResults.filter(result => result !== null);
            searchLog = improvedSearchLog;
            console.log(`Retry improved results: Found ${dailyMedResults.length} medications after corrections`);
            
            // Re-validate with improved results
            medicationValidation = await openAIService.validateMedicationMatches(patientInfo, extractedMedications, dailyMedResults);
            console.log('Re-validation result after retry:', medicationValidation);
          } else {
            console.log('No improvements found during retry, keeping original results');
          }
        }

        // Assess learning level
        assessment = await openAIService.assessPatientLearningLevel(patientInfo, dailyMedResults);

        const validationStatus = medicationValidation.validated ? "✓" : "⚠️";
        processingSteps[1] = { 
          step: "assess", 
          status: medicationValidation.validated ? "complete" : "warning", 
          message: `${validationStatus} Extracted ${extractedMedications.length} medications, found ${dailyMedResults.length} matches. Level: ${assessment.suggestedStartingLevel}` 
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
      const dailyMedMessage = searchLog.length > 0 
        ? `Searched: ${searchLog.map(log => `"${log.searchTerm}"`).join(', ')}. Found ${dailyMedResults.length} medications`
        : `Found ${dailyMedResults.length} medications in database`;

      processingSteps[2] = { 
        step: "dailymed", 
        status: "complete", 
        message: dailyMedMessage
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
        searchLog,
        validation: medicationValidation,
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

      // Step 2: Extract and query medications
      processingSteps[1] = { step: "dailymed", status: "processing", message: "Extracting and searching for medications..." };

      let dailyMedResults: any[] = [];
      let searchLog: Array<{medication: string, searchTerm: string, found: boolean, resultTitle?: string, error?: string, rejectedReasons?: string[], requestedFormulation?: 'IR' | 'ER', deliveryMethod?: string}> = [];
      try {
        // Extract medications using OpenAI first
        const extractedMedications = await openAIService.extractMedicationsFromText(patientInfo);
        console.log('OpenAI extracted medications:', extractedMedications);

        // Then search DailyMed with extracted medications
        const searchResult = await dailyMedService.searchMultipleMedications(patientInfo, extractedMedications);
        dailyMedResults = searchResult.results;
        searchLog = searchResult.searchLog;

        // Validate the matches and check dosage availability
        const medicationValidation = await openAIService.validateMedicationMatches(patientInfo, extractedMedications, dailyMedResults);
        console.log('Validation result:', medicationValidation);

        // Apply smart IR/ER logic based on dosage availability
        for (let i = 0; i < extractedMedications.length; i++) {
          const med = extractedMedications[i];
          if (med.dosage && dailyMedResults[i]) {
            const dosageValidation = await openAIService.validateDosageAvailability(med, [dailyMedResults[i]]);
            console.log(`Dosage validation for ${med.name}: ${dosageValidation.reasoning}`);

            // Update formulation if needed
            if (dosageValidation.formulation !== med.formulation) {
              extractedMedications[i].formulation = dosageValidation.formulation;
              console.log(`Updated ${med.name} formulation to ${dosageValidation.formulation}`);
            }
          }
        }

        const validationStatus = medicationValidation.validated ? "✓" : "⚠️";
        // Check for failed medications
        const failedMedications = searchLog.filter(log => 
          log.searchTerm === 'SEARCH_FAILED' || log.searchTerm === 'PROCESSING_ERROR'
        );

        const searchDetails = searchLog.length > 0 
          ? ` Searched: ${searchLog.filter(log => !log.searchTerm.includes('FAILED') && !log.searchTerm.includes('ERROR')).map(log => `"${log.searchTerm}"`).join(', ')}`
          : '';

        let statusMessage = `${validationStatus} Found ${dailyMedResults.length} medications.${searchDetails}`;

        if (failedMedications.length > 0) {
          statusMessage += ` ⚠️ ${failedMedications.length} medication(s) not found in database.`;
        }

        processingSteps[1] = { 
          step: "dailymed", 
          status: failedMedications.length > 0 ? "warning" : (medicationValidation.validated ? "complete" : "warning"), 
          message: statusMessage
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
        searchLog,
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