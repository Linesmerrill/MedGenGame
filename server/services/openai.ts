import OpenAI from "openai";
import type { Game, DailyMedDetails, GameModule, DifficultyLevel, LearningAssessment } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export class OpenAIService {
  async assessPatientLearningLevel(
    patientInfo: string, 
    dailyMedResults: DailyMedDetails[]
  ): Promise<LearningAssessment> {
    try {
      const medicalContext = this.buildMedicalContext(patientInfo, dailyMedResults);

      const prompt = `
You are a healthcare education specialist. Analyze this patient information and recommend an appropriate learning level.

${medicalContext}

Based on the patient information, assess:
1. What medical conditions they have
2. Their likely familiarity with their medications (new/some/experienced)
3. Their time constraints (hospital stay, recent discharge, chronic condition)
4. Suggested starting difficulty level

Consider:
- New diagnoses = beginner level
- Long-term conditions = intermediate/advanced
- Complex multi-medication regimens = potentially experienced
- Hospital/post-discharge = limited time
- Chronic management = moderate/extended time

Return JSON with this structure:
{
  "patientConditions": ["condition1", "condition2"],
  "medicationFamiliarity": "new|some|experienced",
  "timeConstraints": "limited|moderate|extended", 
  "preferredLearningStyle": "visual|text|interactive",
  "suggestedStartingLevel": "beginner|intermediate|advanced"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a healthcare education specialist. Respond only with valid JSON."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result as LearningAssessment;
    } catch (error) {
      console.error('Error assessing patient learning level:', error);
      // Return default assessment
      return {
        patientConditions: [],
        medicationFamiliarity: 'new',
        timeConstraints: 'limited',
        preferredLearningStyle: 'interactive',
        suggestedStartingLevel: 'beginner'
      };
    }
  }

  async generateModularEducationalGames(
    patientInfo: string, 
    dailyMedResults: DailyMedDetails[],
    requestedLevel?: DifficultyLevel
  ): Promise<GameModule[]> {
    try {
      const assessment = await this.assessPatientLearningLevel(patientInfo, dailyMedResults);
      const levels: DifficultyLevel[] = requestedLevel ? [requestedLevel] : ['beginner', 'intermediate', 'advanced'];

      const modules: GameModule[] = [];

      for (const level of levels) {
        const games = await this.generateGamesForLevel(patientInfo, dailyMedResults, level);
        modules.push({
          level,
          title: this.getModuleTitle(level),
          description: this.getModuleDescription(level),
          estimatedTime: this.getEstimatedTime(level),
          games
        });
      }

      return modules;
    } catch (error) {
      console.error('Error generating modular games:', error);
      throw new Error('Failed to generate modular educational content');
    }
  }

  private getModuleTitle(level: DifficultyLevel): string {
    switch (level) {
      case 'beginner': return 'Module 1: Healthcare Basics';
      case 'intermediate': return 'Module 2: Understanding Your Treatment';
      case 'advanced': return 'Module 3: Advanced Management';
    }
  }

  private getModuleDescription(level: DifficultyLevel): string {
    switch (level) {
      case 'beginner': return 'Learn basic terms and simple concepts about your health condition and medications.';
      case 'intermediate': return 'Understand your treatment plan, medication interactions, and monitoring requirements.';
      case 'advanced': return 'Master complex medication management, potential complications, and lifestyle optimization.';
    }
  }

  private getEstimatedTime(level: DifficultyLevel): string {
    switch (level) {
      case 'beginner': return '5-10 minutes';
      case 'intermediate': return '10-15 minutes';
      case 'advanced': return '15-20 minutes';
    }
  }

  async generateGamesForLevel(
    patientInfo: string, 
    dailyMedResults: DailyMedDetails[],
    level: DifficultyLevel
  ): Promise<Game[]> {
    try {
      const medicalContext = this.buildMedicalContext(patientInfo, dailyMedResults);
      const difficultyGuidelines = this.getDifficultyGuidelines(level);

      const prompt = `
You are a healthcare education specialist creating ${level}-level educational games for patients.

${medicalContext}

${difficultyGuidelines}

Create exactly 6 games with these types:
1. Crossword puzzle (difficulty-appropriate grid size)
2. Word search 
3. Fill-in-the-blank exercise
4. Multiple choice quiz (3 questions)
5. Matching game (5 pairs)
6. True/false quiz (5 questions)

Requirements:
- Use simple, patient-friendly language
- Focus on key medical concepts, medication names, side effects, and care instructions
- Make content educational but not overwhelming
- Ensure medical accuracy
- CRITICAL: If medication formulation is not explicitly specified as ER/XR/Extended-Release, default to IR (Immediate Release)
- Include formulation type (IR vs ER) in medication references when relevant

Return your response as a JSON object with this exact structure:
{
  "games": [
    {
      "type": "crossword",
      "title": "Medical Terms Crossword",
      "difficulty": "${level}",
      "grid": [["D","I","A","B","E"],["","N","","L","T"],["","S","","O","E"],["","U","","O","S"],["","L","","D",""]],
      "clues": [
        {
          "number": 1,
          "direction": "across", 
          "clue": "Condition affecting blood sugar",
          "answer": "DIABE",
          "startRow": 0,
          "startCol": 0
        }
      ]
    },
    {
      "type": "wordsearch",
      "title": "Find the Medical Terms",
      "difficulty": "${level}",
      "grid": [["M","E","T","F","O","R"],["A","B","C","D","E","F"],["G","H","I","J","K","L"],["M","N","O","P","Q","R"],["S","T","U","V","W","X"],["Y","Z","A","B","C","D"]],
      "words": ["METFOR", "INSULIN"]
    },
    {
      "type": "fillblank",
      "title": "Complete the Sentences",
      "difficulty": "${level}",
      "text": "Metformin helps control blood _____ levels in people with _____.",
      "blanks": [
        {"position": 34, "answer": "sugar"},
        {"position": 58, "answer": "diabetes"}
      ],
      "wordBank": ["sugar", "diabetes", "pressure", "insulin"]
    },
    {
      "type": "multiplechoice", 
      "title": "Medication Knowledge Quiz",
      "difficulty": "${level}",
      "questions": [
        {
          "question": "What is a common side effect of Metformin?",
          "options": ["Weight gain", "Nausea", "High blood pressure", "Headaches"],
          "correctAnswer": 1
        }
      ]
    },
    {
      "type": "matching",
      "title": "Match Terms and Definitions",
      "difficulty": "${level}",
      "pairs": [
        {"left": "Metformin", "right": "Blood sugar medication"},
        {"left": "Diabetes", "right": "High blood sugar condition"}
      ]
    },
    {
      "type": "truefalse",
      "title": "True or False Quiz",
      "difficulty": "${level}",
      "questions": [
        {
          "statement": "Metformin should be taken with food",
          "isTrue": true
        }
      ]
    }
  ]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a healthcare education specialist who creates educational games for patients. Respond only with valid JSON."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      if (!result.games || !Array.isArray(result.games)) {
        throw new Error("Invalid response format from OpenAI");
      }

      return result.games;
    } catch (error) {
      console.error(`Error generating ${level} games:`, error);
      throw new Error(`Failed to generate ${level}-level educational games`);
    }
  }

  private getDifficultyGuidelines(level: DifficultyLevel): string {
    switch (level) {
      case 'beginner':
        return `
BEGINNER LEVEL Guidelines:
- Use simple, everyday words (avoid medical jargon)
- Focus on basic concepts: what condition is, what medication does
- Short sentences and simple questions
- Basic medication names (generic names preferred)
- Simple side effects (nausea, dizziness, etc.)
- Basic "take with food" type instructions
- Grid sizes: 5x5 for crossword, 6x6 for word search
- Multiple choice: obvious wrong answers
- True/false: straightforward facts`;

      case 'intermediate':
        return `
INTERMEDIATE LEVEL Guidelines:
- Mix simple terms with some medical terminology (but explain it)
- Focus on understanding treatment plans and monitoring
- Include medication interactions and precautions
- Discuss when to call doctor, what to watch for
- Include IR vs ER formulation differences
- More complex dosing schedules
- Grid sizes: 7x7 for crossword, 8x8 for word search
- Multiple choice: plausible distractors
- True/false: requires understanding concepts`;

      case 'advanced':
        return `
ADVANCED LEVEL Guidelines:
- Use appropriate medical terminology
- Focus on complex medication management
- Include drug interactions, contraindications
- Discuss lifestyle modifications and optimization
- Include monitoring parameters (lab values, vital signs)
- Complex dosing adjustments and titration
- IR vs ER pharmacokinetics understanding
- Grid sizes: 9x9 for crossword, 10x10 for word search  
- Multiple choice: subtle differences between options
- True/false: requires deep understanding and critical thinking`;
    }
  }

  // Keep the legacy method for backward compatibility
  async generateEducationalGames(
    patientInfo: string, 
    dailyMedResults: DailyMedDetails[]
  ): Promise<Game[]> {
    // Default to beginner level for legacy compatibility
    return this.generateGamesForLevel(patientInfo, dailyMedResults, 'beginner');
  }

  private buildMedicalContext(patientInfo: string, dailyMedResults: DailyMedDetails[]): string {
    let context = `Patient Information:\n${patientInfo}\n\n`;

    if (dailyMedResults.length > 0) {
      context += "Medication Information from DailyMed:\n";

      dailyMedResults.forEach((med, index) => {
        context += `\n${index + 1}. ${med.title}\n`;
        if (med.genericName) context += `Generic Name: ${med.genericName}\n`;
        if (med.brandName) context += `Brand Name: ${med.brandName}\n`;
        if (med.activeIngredients) context += `Active Ingredients: ${med.activeIngredients.join(', ')}\n`;
        if (med.indications) context += `Indications: ${med.indications.substring(0, 200)}...\n`;
        if (med.adverseReactions) context += `Side Effects: ${med.adverseReactions.substring(0, 200)}...\n`;
        if (med.dosageAndAdministration) context += `Dosage: ${med.dosageAndAdministration.substring(0, 200)}...\n`;
      });
    }

    return context;
  }

  async extractMedicationsFromText(patientInfo: string): Promise<Array<{name: string, dosage: string, formulation: 'IR' | 'ER', deliveryMethod?: string, fullContext: string}>> {
    try {
      const prompt = `
You are a medical information extraction specialist. Extract medication information from the following patient text.

Patient Information:
${patientInfo}

For each medication found, extract:
1. Medication name (generic name preferred)
2. Dosage with units (e.g., "40mg", "5mg", "10mg twice daily")
3. Delivery method (tablet, capsule, inhaler, injection, etc.)
4. Formulation type: 
   - CRITICAL: Default to "IR" (Immediate Release) unless explicitly stated as ER/XR/Extended-Release
   - Only mark as "ER" if explicitly mentioned as extended-release, XR, ER, sustained-release, etc.
5. Full context where the medication appears

Return JSON array with this structure:
[
  {
    "name": "medication_name",
    "dosage": "amount with units",
    "formulation": "IR" | "ER", 
    "deliveryMethod": "tablet/capsule/inhaler/etc",
    "fullContext": "complete sentence or phrase where this medication appears"
  }
]

Requirements:
- CRITICAL: Default ALL medications to IR unless explicitly stated as ER/XR/Extended-Release
- Extract exact dosage amounts (e.g., 40mg, 6.25mg, 49/51mg for combinations)
- Include formulation type (IR vs ER) in medication references when relevant`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a medical information extraction specialist. Respond only with valid JSON. Default ALL medications to IR unless explicitly stated as ER/XR/Extended-Release."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const medications = result.medications || [];

      // Process medications with smart IR/ER logic
      return medications.map((med: any) => {
        let finalFormulation = 'IR'; // Always default to IR

        // Only set to ER if explicitly mentioned
        if (med.formulation === 'ER' && this.isExplicitlyER(med.fullContext)) {
          finalFormulation = 'ER';
        }

        return {
          name: med.name || '',
          dosage: med.dosage || '',
          formulation: finalFormulation as 'IR' | 'ER',
          deliveryMethod: med.deliveryMethod || '',
          fullContext: med.fullContext || ''
        };
      });

    } catch (error) {
      console.error('Error extracting medications with OpenAI:', error);
      return [];
    }
  }

  private isExplicitlyER(context: string): boolean {
    const erKeywords = /\b(extended.?release|extended.?release|er|xl|xr|sustained.?release|sr|la|long.?acting)\b/i;
    return erKeywords.test(context);
  }

  async validateDosageAvailability(
    medication: {name: string, dosage: string, formulation: 'IR' | 'ER'},
    searchResults: any[]
  ): Promise<{formulation: 'IR' | 'ER', reasoning: string}> {
    // Check if the specific dosage exists in the requested formulation
    const dosagePattern = this.extractDosageNumbers(medication.dosage);

    // Look through search results to see what formulations are available with this dosage
    const availableFormulations = {
      IR: false,
      ER: false
    };

    for (const result of searchResults) {
      const title = result.title?.toLowerCase() || '';
      const hasMatchingDosage = dosagePattern.some(dose => title.includes(dose));

      if (hasMatchingDosage) {
        const erIndicators = /\b(extended.release|extended-release|er|xl|xr|sustained.release|sustained-release|sr|la)\b/i;
        const irIndicators = /\b(immediate.release|immediate-release|ir)\b/i;

        if (erIndicators.test(title)) {
          availableFormulations.ER = true;
        } else if (irIndicators.test(title) || !erIndicators.test(title)) {
          // If no specific formulation mentioned, assume IR (most common)
          availableFormulations.IR = true;
        }
      }
    }

    // Apply logic: prefer IR, only use ER if explicitly requested AND available
    if (medication.formulation === 'ER' && availableFormulations.ER) {
      return { formulation: 'ER', reasoning: 'ER explicitly requested and available' };
    } else if (medication.formulation === 'ER' && !availableFormulations.ER && availableFormulations.IR) {
      return { formulation: 'IR', reasoning: 'ER requested but not available, defaulting to IR' };
    } else if (availableFormulations.IR) {
      return { formulation: 'IR', reasoning: 'IR is default and available' };
    } else if (availableFormulations.ER) {
      return { formulation: 'ER', reasoning: 'only ER formulation available' };
    } else {
      return { formulation: 'IR', reasoning: 'no specific dosage found, defaulting to IR' };
    }
  }

  private extractDosageNumbers(dosage: string): string[] {
    // Extract numbers and common patterns from dosage string
    const patterns: string[] = [];

    // Match common dosage patterns
    const matches = dosage.match(/\d+(?:\.\d+)?/g);
    if (matches) {
      matches.forEach(match => {
        patterns.push(match + 'mg');
        patterns.push(match + ' mg');
        patterns.push(match);
      });
    }

    // Handle combination drugs (e.g., "49/51mg")
    const combinationMatch = dosage.match(/(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/);
    if (combinationMatch) {
      patterns.push(`${combinationMatch[1]}/${combinationMatch[2]}`);
      patterns.push(`${combinationMatch[1]} / ${combinationMatch[2]}`);
      patterns.push(`${combinationMatch[1]}-${combinationMatch[2]}`);
    }

    return [...new Set(patterns)];
  }

  async validateMedicationMatches(
    originalPatientInfo: string,
    extractedMeds: Array<{name: string, dosage: string, formulation: 'IR' | 'ER', deliveryMethod?: string, fullContext: string}>,
    dailyMedResults: DailyMedDetails[]
  ): Promise<{validated: boolean, issues: string[], correctedSearchTerms?: string[]}> {
    try {
      const prompt = `
You are a medical validation specialist. Compare the original patient information with the medications found in the DailyMed database to ensure accuracy.

Original Patient Information:
${originalPatientInfo}

Extracted Medications:
${extractedMeds.map((med, i) => `${i+1}. ${med.name} (${med.deliveryMethod || 'unspecified'}) - Context: "${med.fullContext}"`).join('\n')}

DailyMed Results Found:
${dailyMedResults.map((med, i) => `${i+1}. ${med.title} - Generic: ${med.genericName || 'N/A'}`).join('\n')}

Please validate:
1. Do the DailyMed results match the specific medications mentioned in the patient info?
2. Are the delivery methods correct (e.g., inhaler vs solution)?
3. Are we missing any medications or finding incorrect ones?
4. What search terms would be more accurate?

Return JSON with this structure:
{
  "validated": true/false,
  "issues": ["list of any problems found"],
  "correctedSearchTerms": ["better search terms if needed"]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a medical validation specialist. Respond only with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        validated: result.validated || false,
        issues: result.issues || [],
        correctedSearchTerms: result.correctedSearchTerms || []
      };

    } catch (error) {
      console.error('Error validating medication matches:', error);
      return {
        validated: false,
        issues: ['Validation failed due to technical error'],
        correctedSearchTerms: []
      };
    }
  }

  async simplifyMedicalText(text: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a healthcare communication specialist. Simplify medical text for patient education while maintaining accuracy. Use simple language that a middle school student could understand."
          },
          {
            role: "user",
            content: `Please simplify this medical text for patient education:\n\n${text}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content || text;
    } catch (error) {
      console.error('Error simplifying medical text:', error);
      return text; // Return original text if simplification fails
    }
  }
}

export const openAIService = new OpenAIService();