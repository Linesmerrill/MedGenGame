const DAILYMED_BASE_URL = 'https://dailymed.nlm.nih.gov/dailymed/services/v2';

export interface DailyMedSearchResult {
  setId: string;
  title: string;
  genericName?: string;
  brandName?: string;
  labeler?: string;
}

export interface DailyMedDetails {
  setId: string;
  title: string;
  genericName?: string;
  brandName?: string;
  labeler?: string;
  activeIngredients?: string[];
  indications?: string;
  dosageAndAdministration?: string;
  contraindications?: string;
  warningsAndPrecautions?: string;
  adverseReactions?: string;
}

export class DailyMedService {
  async searchMedications(query: string): Promise<DailyMedSearchResult[]> {
    try {
      const searchUrl = `${DAILYMED_BASE_URL}/spls.json?drug_name=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Medical-Education-App/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`DailyMed API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        return [];
      }

      return data.data.slice(0, 5).map((item: any) => ({
        setId: item.setid,
        title: item.title,
        genericName: item.generic_name,
        brandName: item.brand_name,
        labeler: item.labeler,
      }));
    } catch (error) {
      console.error('Error searching DailyMed:', error);
      throw new Error('Failed to search medications in DailyMed database');
    }
  }

  async getMedicationDetails(setId: string): Promise<DailyMedDetails | null> {
    try {
      // For now, create a simplified version from search data
      // The detailed API endpoint has authentication/header requirements that are complex
      return null;
    } catch (error) {
      console.error('Error fetching medication details:', error);
      return null;
    }
  }

  extractMedicationNames(patientInfo: string): Array<{name: string, formulation: 'IR' | 'ER'}> {
    // Common medication keywords and patterns
    const medicationPatterns = [
      /metformin/gi,
      /insulin/gi,
      /lisinopril/gi,
      /atorvastatin/gi,
      /amlodipine/gi,
      /hydrochlorothiazide/gi,
      /aspirin/gi,
      /warfarin/gi,
      /gabapentin/gi,
      /simvastatin/gi,
      /losartan/gi,
      /omeprazole/gi,
      /levothyroxine/gi,
      /acetaminophen/gi,
      /ibuprofen/gi,
    ];

    const foundMedications = new Map<string, 'IR' | 'ER'>();
    
    medicationPatterns.forEach(pattern => {
      const matches = patientInfo.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const medName = match.toLowerCase();
          // Check if ER/XR/Extended Release is explicitly mentioned near this medication
          const medPosition = patientInfo.toLowerCase().indexOf(medName);
          const contextBefore = patientInfo.toLowerCase().substring(Math.max(0, medPosition - 50), medPosition);
          const contextAfter = patientInfo.toLowerCase().substring(medPosition, Math.min(patientInfo.length, medPosition + medName.length + 50));
          const fullContext = contextBefore + medName + contextAfter;
          
          // Look for ER/XR/Extended Release indicators
          const erIndicators = /\b(er|xr|extended.release|extended-release|xl|la|sr|sustained.release|sustained-release)\b/i;
          
          if (erIndicators.test(fullContext)) {
            foundMedications.set(medName, 'ER');
          } else {
            // Default to IR (Immediate Release) if not explicitly specified as ER
            foundMedications.set(medName, 'IR');
          }
        });
      }
    });

    // Also look for words ending in common medication suffixes
    const suffixPatterns = [
      /\w+pril\b/gi,  // ACE inhibitors
      /\w+statin\b/gi, // Statins
      /\w+zide\b/gi,   // Diuretics
      /\w+pine\b/gi,   // Calcium channel blockers
    ];

    suffixPatterns.forEach(pattern => {
      const matches = patientInfo.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const medName = match.toLowerCase();
          const medPosition = patientInfo.toLowerCase().indexOf(medName);
          const contextBefore = patientInfo.toLowerCase().substring(Math.max(0, medPosition - 50), medPosition);
          const contextAfter = patientInfo.toLowerCase().substring(medPosition, Math.min(patientInfo.length, medPosition + medName.length + 50));
          const fullContext = contextBefore + medName + contextAfter;
          
          const erIndicators = /\b(er|xr|extended.release|extended-release|xl|la|sr|sustained.release|sustained-release)\b/i;
          
          if (erIndicators.test(fullContext)) {
            foundMedications.set(medName, 'ER');
          } else {
            // Default to IR if not explicitly specified as ER
            foundMedications.set(medName, 'IR');
          }
        });
      }
    });

    return Array.from(foundMedications.entries()).map(([name, formulation]) => ({
      name,
      formulation
    }));
  }

  async searchMultipleMedications(patientInfo: string): Promise<DailyMedDetails[]> {
    const medications = this.extractMedicationNames(patientInfo);
    const results: DailyMedDetails[] = [];

    for (const medication of medications) {
      try {
        const searchResults = await this.searchMedications(medication.name);
        
        if (searchResults.length > 0) {
          // Convert search result to DailyMedDetails format
          const result = searchResults[0];
          const details: DailyMedDetails = {
            setId: result.setId,
            title: result.title,
            genericName: result.genericName,
            brandName: result.brandName,
            labeler: result.labeler,
            // Add basic information that we can infer or provide
            activeIngredients: result.genericName ? [result.genericName] : [],
            indications: this.getCommonIndications(medication.name, medication.formulation),
            dosageAndAdministration: this.getCommonDosage(medication.name, medication.formulation),
            contraindications: this.getCommonContraindications(medication.name, medication.formulation),
            warningsAndPrecautions: this.getCommonWarnings(medication.name, medication.formulation),
            adverseReactions: this.getCommonSideEffects(medication.name, medication.formulation),
          };
          results.push(details);
        }
      } catch (error) {
        console.error(`Error processing medication ${medication.name}:`, error);
        continue;
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  // Helper methods to provide common medical information
  private getCommonIndications(medication: string, formulation: 'IR' | 'ER'): string {
    const baseIndications: { [key: string]: string } = {
      'metformin': 'Type 2 diabetes mellitus management to improve glycemic control',
      'lisinopril': 'Hypertension and heart failure management',
      'atorvastatin': 'Dyslipidemia and cardiovascular disease prevention',
      'amlodipine': 'Hypertension and angina management',
      'insulin': 'Diabetes mellitus for glycemic control'
    };
    const baseIndication = baseIndications[medication.toLowerCase()] || 'Consult prescribing information for specific indications';
    return `${baseIndication} (${formulation} formulation)`;
  }

  private getCommonDosage(medication: string, formulation: 'IR' | 'ER'): string {
    const baseDosages: { [key: string]: { IR: string; ER: string } } = {
      'metformin': {
        IR: 'Initial: 500mg twice daily with meals. Maximum: 2000mg daily (IR formulation)',
        ER: 'Initial: 500mg once daily with evening meal. Maximum: 2000mg daily (ER formulation)'
      },
      'lisinopril': {
        IR: 'Initial: 10mg once daily. Range: 5-40mg daily (IR formulation)',
        ER: 'Initial: 10mg once daily. Range: 5-40mg daily (ER formulation)'
      },
      'atorvastatin': {
        IR: 'Initial: 10-20mg once daily. Range: 10-80mg daily (IR formulation)',
        ER: 'Initial: 10-20mg once daily. Range: 10-80mg daily (ER formulation)'
      },
      'amlodipine': {
        IR: 'Initial: 5mg once daily. Maximum: 10mg daily (IR formulation)',
        ER: 'Initial: 5mg once daily. Maximum: 10mg daily (ER formulation)'
      },
      'insulin': {
        IR: 'Individualized based on blood glucose monitoring (rapid-acting)',
        ER: 'Individualized based on blood glucose monitoring (long-acting)'
      }
    };
    
    const medDosage = baseDosages[medication.toLowerCase()];
    if (medDosage) {
      return medDosage[formulation];
    }
    return `Dosage should be individualized by healthcare provider (${formulation} formulation)`;
  }

  private getCommonContraindications(medication: string, formulation: 'IR' | 'ER'): string {
    const contraindications: { [key: string]: string } = {
      'metformin': 'Severe renal impairment, metabolic acidosis, diabetic ketoacidosis',
      'lisinopril': 'History of angioedema, pregnancy, bilateral renal artery stenosis',
      'atorvastatin': 'Active liver disease, pregnancy, breastfeeding',
      'amlodipine': 'Known hypersensitivity to amlodipine or other dihydropyridines',
      'insulin': 'Hypoglycemia, known hypersensitivity to insulin'
    };
    const baseContraindication = contraindications[medication.toLowerCase()] || 'See prescribing information for contraindications';
    return `${baseContraindication} (applies to both IR and ER formulations)`;
  }

  private getCommonWarnings(medication: string, formulation: 'IR' | 'ER'): string {
    const warnings: { [key: string]: string } = {
      'metformin': 'Risk of lactic acidosis, especially in renal impairment. Monitor kidney function',
      'lisinopril': 'Monitor for hyperkalemia, renal function changes, and angioedema',
      'atorvastatin': 'Monitor liver enzymes and for signs of myopathy or rhabdomyolysis',
      'amlodipine': 'May cause peripheral edema and hypotension',
      'insulin': 'Risk of hypoglycemia. Monitor blood glucose levels closely'
    };
    const baseWarning = warnings[medication.toLowerCase()] || 'Monitor patient response and adjust as needed';
    
    const formulationNote = formulation === 'ER' 
      ? 'Extended-release formulation provides prolonged effect - do not crush or chew tablets.'
      : 'Immediate-release formulation provides rapid onset of action.';
      
    return `${baseWarning} ${formulationNote}`;
  }

  private getCommonSideEffects(medication: string, formulation: 'IR' | 'ER'): string {
    const sideEffects: { [key: string]: string } = {
      'metformin': 'Nausea, vomiting, diarrhea, abdominal pain, loss of appetite',
      'lisinopril': 'Dry cough, hyperkalemia, angioedema, hypotension, dizziness',
      'atorvastatin': 'Muscle pain, elevated liver enzymes, headache, nausea',
      'amlodipine': 'Peripheral edema, dizziness, flushing, palpitations',
      'insulin': 'Hypoglycemia, injection site reactions, weight gain'
    };
    const baseSideEffects = sideEffects[medication.toLowerCase()] || 'Common side effects vary by medication';
    
    const formulationNote = formulation === 'ER' 
      ? 'ER formulation may have reduced GI side effects due to slower release.'
      : 'IR formulation may cause more immediate onset of side effects.';
      
    return `${baseSideEffects} ${formulationNote}`;
  }
}

export const dailyMedService = new DailyMedService();
