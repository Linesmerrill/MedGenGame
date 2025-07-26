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

      // Filter out veterinary/animal health products
      const humanMedications = data.data.filter((item: any) => {
        const title = (item.title || '').toLowerCase();
        const labeler = (item.labeler || '').toLowerCase();
        
        // Filter out veterinary keywords
        const veterinaryKeywords = [
          'zyvet', 'animal health', 'veterinary', 'pet', 'canine', 'feline', 
          'bovine', 'equine', 'porcine', 'avian', 'animal', 'vet'
        ];
        
        return !veterinaryKeywords.some(keyword => 
          title.includes(keyword) || labeler.includes(keyword)
        );
      });

      // Prioritize human pharmaceutical companies
      const humanPharmaKeywords = [
        'pfizer', 'merck', 'novartis', 'roche', 'johnson', 'abbvie', 
        'bristol', 'amgen', 'gilead', 'biogen', 'celgene', 'mylan',
        'teva', 'sandoz', 'apotex', 'par', 'watson', 'actavis',
        'remedyrepack', 'cardinal', 'mckesson'
      ];
      
      const sortedResults = humanMedications.sort((a: any, b: any) => {
        const aLabeler = (a.labeler || '').toLowerCase();
        const bLabeler = (b.labeler || '').toLowerCase();
        
        const aIsHumanPharma = humanPharmaKeywords.some(keyword => aLabeler.includes(keyword));
        const bIsHumanPharma = humanPharmaKeywords.some(keyword => bLabeler.includes(keyword));
        
        if (aIsHumanPharma && !bIsHumanPharma) return -1;
        if (!aIsHumanPharma && bIsHumanPharma) return 1;
        return 0;
      });

      return sortedResults.slice(0, 5).map((item: any) => ({
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

  async searchMultipleMedications(
    patientInfo: string, 
    openAIExtractedMeds?: Array<{name: string, dosage?: string, formulation: 'IR' | 'ER', deliveryMethod?: string, fullContext: string}>
  ): Promise<{results: DailyMedDetails[], searchLog: Array<{medication: string, searchTerm: string, found: boolean, resultTitle?: string, error?: string, rejectedReasons?: string[]}>}> {
    // Use OpenAI extracted medications if provided, otherwise fall back to pattern matching
    const medications = openAIExtractedMeds || this.extractMedicationNames(patientInfo).map(med => ({
      ...med,
      dosage: '',
      deliveryMethod: '',
      fullContext: ''
    }));
    const results: DailyMedDetails[] = [];
    const searchLog: Array<{medication: string, searchTerm: string, found: boolean, resultTitle?: string, error?: string, rejectedReasons?: string[]}> = [];

    console.log(`Processing ${medications.length} medications:`, medications.map(m => `${m.name} (${m.deliveryMethod || 'unspecified delivery method'})`));

    for (const medication of medications) {
      try {
        // Create more specific search terms based on delivery method and formulation
        const searchTerms = this.generateSearchTerms(medication);
        let bestResult: any = null;
        let bestSearchTerm = '';
        let allRejectedReasons: string[] = [];
        let searchErrors: string[] = [];

        console.log(`Generated ${searchTerms.length} search terms for ${medication.name} (${medication.formulation}):`, searchTerms.slice(0, 5));

        // Try each search term until we find a good match
        for (const searchTerm of searchTerms) {
          console.log(`Searching DailyMed for: "${searchTerm}" (${medication.formulation} formulation)`);
          
          try {
            const searchResults = await this.searchMedications(searchTerm);
            
            const logEntry = {
              medication: medication.name,
              searchTerm: searchTerm,
              found: searchResults.length > 0,
              resultTitle: searchResults.length > 0 ? searchResults[0].title : undefined,
              rejectedReasons: [] as string[],
              requestedFormulation: medication.formulation,
              deliveryMethod: medication.deliveryMethod || 'unspecified'
            };

            if (searchResults.length > 0) {
              // Check each result for appropriateness
              let foundAppropriate = false;
              for (const result of searchResults.slice(0, 3)) { // Check top 3 results
                const matchResult = this.isAppropriateMatchWithReasons(medication, result);
                if (matchResult.isMatch) {
                  bestResult = result;
                  bestSearchTerm = searchTerm;
                  console.log(`Found appropriate match: ${result.title} for search term: "${searchTerm}"`);
                  foundAppropriate = true;
                  break;
                } else {
                  logEntry.rejectedReasons.push(`${result.title}: ${matchResult.reason}`);
                  allRejectedReasons.push(`${result.title}: ${matchResult.reason}`);
                }
              }
              
              if (!foundAppropriate && searchResults.length > 0) {
                console.log(`Found ${searchResults.length} results for "${searchTerm}" but none were appropriate matches`);
              }
            } else {
              console.log(`No results found for search term: "${searchTerm}"`);
              logEntry.error = 'No results found in DailyMed database';
            }

            searchLog.push(logEntry);

            if (bestResult) break;
            
          } catch (searchError) {
            console.error(`Search error for "${searchTerm}":`, searchError);
            searchErrors.push(`Error searching "${searchTerm}": ${searchError}`);
            searchLog.push({
              medication: medication.name,
              searchTerm: searchTerm,
              found: false,
              error: `Search failed: ${searchError}`,
              requestedFormulation: medication.formulation,
              deliveryMethod: medication.deliveryMethod || 'unspecified'
            });
          }
          
          // Add delay between searches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        // If we still haven't found anything, try relaxed search criteria
        if (!bestResult) {
          console.log(`No matches found with standard criteria. Trying relaxed search for ${medication.name}...`);
          const relaxedResult = await this.tryRelaxedSearch(medication, searchLog, allRejectedReasons);
          if (relaxedResult.result) {
            bestResult = relaxedResult.result;
            bestSearchTerm = relaxedResult.searchTerm;
            console.log(`Found match with relaxed criteria: ${bestResult.title}`);
          }
        }
        
        if (bestResult) {
          // Convert search result to DailyMedDetails format
          const details: DailyMedDetails = {
            setId: bestResult.setId,
            title: bestResult.title,
            genericName: bestResult.genericName,
            brandName: bestResult.brandName,
            labeler: bestResult.labeler,
            // Add basic information that we can infer or provide
            activeIngredients: bestResult.genericName ? [bestResult.genericName] : [],
            indications: this.getCommonIndications(medication.name, medication.formulation),
            dosageAndAdministration: this.getCommonDosage(medication.name, medication.formulation),
            contraindications: this.getCommonContraindications(medication.name, medication.formulation),
            warningsAndPrecautions: this.getCommonWarnings(medication.name, medication.formulation),
            adverseReactions: this.getCommonSideEffects(medication.name, medication.formulation),
          };
          results.push(details);
          console.log(`Successfully processed medication: ${medication.name} with search term: "${bestSearchTerm}"`);
        } else {
          // Log comprehensive failure information
          const failureReason = searchErrors.length > 0 
            ? `Search errors: ${searchErrors.join('; ')}`
            : allRejectedReasons.length > 0 
              ? `Found results but all were rejected: ${allRejectedReasons.slice(0, 3).join('; ')}`
              : 'No results found in DailyMed database';
              
          console.log(`FAILED to find ${medication.name}: ${failureReason}`);
          
          // Add a failure log entry
          searchLog.push({
            medication: medication.name,
            searchTerm: 'SEARCH_FAILED',
            found: false,
            error: failureReason,
            rejectedReasons: allRejectedReasons.slice(0, 5), // Limit to first 5 reasons
            requestedFormulation: medication.formulation,
            deliveryMethod: medication.deliveryMethod || 'unspecified'
          });
        }
      } catch (error) {
        console.error(`Error processing medication ${medication.name}:`, error);
        searchLog.push({
          medication: medication.name,
          searchTerm: 'PROCESSING_ERROR',
          found: false,
          error: `Processing failed: ${error}`,
          requestedFormulation: medication.formulation,
          deliveryMethod: medication.deliveryMethod || 'unspecified'
        });
        continue;
      }
    }

    return { results, searchLog };
  }

  private generateSearchTerms(medication: {name: string, dosage?: string, formulation: 'IR' | 'ER', deliveryMethod?: string, fullContext: string}): string[] {
    const terms: string[] = [];
    const medName = medication.name.toLowerCase();
    const delivery = medication.deliveryMethod?.toLowerCase() || '';
    const formulation = medication.formulation;

    // Handle combination drugs with multiple permutations
    const combinationPermutations = this.generateCombinationPermutations(medName);

    // For each permutation, generate search terms with formulation specificity
    for (const drugName of combinationPermutations) {
      // Most specific first - include delivery method and formulation
      if (delivery) {
        if (formulation === 'ER') {
          terms.push(`${drugName} ${delivery} extended release`);
          terms.push(`${drugName} ${delivery} er`);
          terms.push(`${drugName} ${delivery} xl`);
          terms.push(`${drugName} ${delivery} xr`);
        } else {
          terms.push(`${drugName} ${delivery} immediate release`);
          terms.push(`${drugName} ${delivery} ir`);
        }
        terms.push(`${drugName} ${delivery}`);
        
        // Special cases for delivery methods
        if (delivery === 'inhaler') {
          terms.push(`${drugName} inhalation`);
          terms.push(`${drugName} metered dose inhaler`);
          terms.push(`${drugName} MDI`);
        }
        
        if (delivery === 'handihaler') {
          terms.push(`${drugName} dry powder inhaler`);
          terms.push(`${drugName} DPI`);
        }
      }

      // Add formulation-specific terms without delivery method
      if (formulation === 'ER') {
        terms.push(`${drugName} extended release`);
        terms.push(`${drugName} er`);
        terms.push(`${drugName} xl`);
        terms.push(`${drugName} xr`);
        terms.push(`${drugName} sustained release`);
        terms.push(`${drugName} sr`);
      } else {
        terms.push(`${drugName} immediate release`);
        terms.push(`${drugName} ir`);
      }

      // Brand name variations if mentioned in context
      if (medication.fullContext.toLowerCase().includes('respimat')) {
        terms.push(`${drugName} respimat`);
      }

      // Generic name as fallback
      terms.push(drugName);
    }

    // Remove duplicates while preserving order
    return [...new Set(terms)];
  }

  private generateCombinationPermutations(drugName: string): string[] {
    const permutations: string[] = [];
    
    // Add original name
    permutations.push(drugName);
    
    // Handle combination drugs with slashes or other separators
    if (drugName.includes('/')) {
      const parts = drugName.split('/').map(part => part.trim());
      
      if (parts.length === 2) {
        // Generate permutations: original, reversed, with different separators
        permutations.push(`${parts[0]}/${parts[1]}`);
        permutations.push(`${parts[1]}/${parts[0]}`);
        permutations.push(`${parts[0]} ${parts[1]}`);
        permutations.push(`${parts[1]} ${parts[0]}`);
        permutations.push(`${parts[0]}-${parts[1]}`);
        permutations.push(`${parts[1]}-${parts[0]}`);
        
        // Also try individual components
        permutations.push(parts[0]);
        permutations.push(parts[1]);
      }
    }
    
    // Handle drugs with "and" or "&"
    if (drugName.includes(' and ') || drugName.includes(' & ')) {
      const separator = drugName.includes(' and ') ? ' and ' : ' & ';
      const parts = drugName.split(separator).map(part => part.trim());
      
      if (parts.length === 2) {
        permutations.push(`${parts[0]}/${parts[1]}`);
        permutations.push(`${parts[1]}/${parts[0]}`);
        permutations.push(`${parts[0]} ${parts[1]}`);
        permutations.push(`${parts[1]} ${parts[0]}`);
        permutations.push(parts[0]);
        permutations.push(parts[1]);
      }
    }
    
    // Remove duplicates while preserving order
    return [...new Set(permutations)];
  }

  private async tryRelaxedSearch(
    medication: {name: string, dosage?: string, formulation: 'IR' | 'ER', deliveryMethod?: string, fullContext: string},
    searchLog: Array<{medication: string, searchTerm: string, found: boolean, resultTitle?: string, error?: string, rejectedReasons?: string[]}>,
    allRejectedReasons: string[]
  ): Promise<{result: any | null, searchTerm: string}> {
    // Try very basic searches but still respect formulation requirements
    const relaxedSearchTerms = [
      medication.name.toLowerCase(), // Just the drug name
      medication.name.toLowerCase().split('/')[0], // First component if combination drug
      medication.name.toLowerCase().split('-')[0], // First part if hyphenated
    ];

    // Remove duplicates
    const uniqueTerms = [...new Set(relaxedSearchTerms)];

    for (const searchTerm of uniqueTerms) {
      try {
        console.log(`Trying relaxed search: "${searchTerm}" (must be ${medication.formulation})`);
        const searchResults = await this.searchMedications(searchTerm);
        
        if (searchResults.length > 0) {
          // Be more lenient but still respect formulation requirements
          for (const result of searchResults.slice(0, 10)) { // Check more results in relaxed search
            const title = result.title?.toLowerCase() || '';
            const labeler = result.labeler?.toLowerCase() || '';
            
            // Still avoid veterinary products
            const veterinaryKeywords = [
              'zyvet', 'animal health', 'veterinary', 'pet', 'canine', 'feline', 
              'bovine', 'equine', 'porcine', 'avian', 'animal', 'vet'
            ];
            
            if (veterinaryKeywords.some(keyword => title.includes(keyword) || labeler.includes(keyword))) {
              continue;
            }
            
            // Check if the basic drug name is in the title
            const hasBasicMatch = title.includes(medication.name.toLowerCase()) || 
                                title.includes(medication.name.toLowerCase().split('/')[0]);
            
            if (!hasBasicMatch) {
              continue;
            }
            
            // NOW apply formulation requirements even in relaxed search
            const erIndicators = /\b(extended.release|extended-release|er|xl|xr|sustained.release|sustained-release|sr|la)\b/i;
            const irIndicators = /\b(immediate.release|immediate-release|ir)\b/i;
            
            if (medication.formulation === 'IR') {
              // For IR medications, avoid extended release formulations even in relaxed search
              if (erIndicators.test(title)) {
                console.log(`Relaxed search rejecting ${result.title} - ER formulation but patient needs IR`);
                continue;
              }
            } else if (medication.formulation === 'ER') {
              // For ER medications, avoid immediate release formulations
              if (irIndicators.test(title)) {
                console.log(`Relaxed search rejecting ${result.title} - IR formulation but patient needs ER`);
                continue;
              }
            }
            
            console.log(`Relaxed search found appropriate match: ${result.title} (${medication.formulation} compatible)`);
            searchLog.push({
              medication: medication.name,
              searchTerm: `${searchTerm} (relaxed)`,
              found: true,
              resultTitle: result.title,
              error: `Found with relaxed criteria - ${medication.formulation} formulation preserved`,
              requestedFormulation: medication.formulation,
              deliveryMethod: medication.deliveryMethod || 'unspecified'
            });
            
            return { result, searchTerm: `${searchTerm} (relaxed)` };
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Relaxed search error for "${searchTerm}":`, error);
      }
    }

    console.log(`Relaxed search failed for ${medication.name} - no ${medication.formulation} formulations found`);
    return { result: null, searchTerm: '' };
  }

  private isAppropriateMatchWithReasons(
    medication: {name: string, dosage?: string, formulation: 'IR' | 'ER', deliveryMethod?: string, fullContext: string}, 
    result: any
  ): {isMatch: boolean, reason: string} {
    const title = result.title?.toLowerCase() || '';
    const labeler = result.labeler?.toLowerCase() || '';
    const medName = medication.name.toLowerCase();
    const delivery = medication.deliveryMethod?.toLowerCase() || '';
    const formulation = medication.formulation;

    // Check if any component of combination drug is in the title
    const drugComponents = this.generateCombinationPermutations(medName);
    const hasMatchingComponent = drugComponents.some(component => 
      title.includes(component.toLowerCase())
    );
    
    if (!hasMatchingComponent) {
      return { isMatch: false, reason: `doesn't contain any component of ${medName}` };
    }

    // Filter out veterinary/animal health products (double-check)
    const veterinaryKeywords = [
      'zyvet', 'animal health', 'veterinary', 'pet', 'canine', 'feline', 
      'bovine', 'equine', 'porcine', 'avian', 'animal', 'vet'
    ];
    
    if (veterinaryKeywords.some(keyword => title.includes(keyword) || labeler.includes(keyword))) {
      return { isMatch: false, reason: 'veterinary/animal health product' };
    }

    // If delivery method specified, prefer results that match
    if (delivery) {
      if (delivery === 'inhaler' || delivery === 'handihaler') {
        // For inhalers, avoid solutions, tablets, etc.
        if (title.includes('solution') && !title.includes('inhalation')) {
          return { isMatch: false, reason: 'solution not appropriate for inhaler delivery' };
        }
        if (title.includes('tablet') || title.includes('capsule')) {
          return { isMatch: false, reason: 'tablet/capsule not appropriate for inhaler delivery' };
        }
      }
    }

    // Check for unwanted combinations (e.g., Tiotropium alone vs Tiotropium + Olodaterol)
    if (medName === 'tiotropium' && !medication.fullContext.toLowerCase().includes('olodaterol')) {
      if (title.includes('olodaterol')) {
        return { isMatch: false, reason: 'contains olodaterol but patient info doesn\'t mention it' };
      }
    }

    // Check formulation compatibility
    const erIndicators = /\b(extended.release|extended-release|er|xl|xr|sustained.release|sustained-release|sr|la)\b/i;
    const irIndicators = /\b(immediate.release|immediate-release|ir)\b/i;
    
    if (formulation === 'ER') {
      // For ER medications, prefer results that explicitly mention extended release
      // But don't reject if it's not mentioned (many ER meds don't explicitly state it)
      if (irIndicators.test(title)) {
        return { isMatch: false, reason: 'explicitly states immediate release but patient needs ER' };
      }
    } else if (formulation === 'IR') {
      // For IR medications, avoid extended release formulations
      if (erIndicators.test(title)) {
        return { isMatch: false, reason: 'extended release but patient needs IR' };
      }
    }

    return { isMatch: true, reason: 'appropriate match' };
  }

  private isAppropriateMatch(
    medication: {name: string, dosage?: string, formulation: 'IR' | 'ER', deliveryMethod?: string, fullContext: string}, 
    result: any
  ): boolean {
    const matchResult = this.isAppropriateMatchWithReasons(medication, result);
    if (!matchResult.isMatch) {
      console.log(`Rejecting ${result.title} - ${matchResult.reason}`);
    }
    return matchResult.isMatch;
  }

  // Helper methods to provide common medical information
  private getCommonIndications(medication: string, formulation: 'IR' | 'ER'): string {
    const baseIndications: { [key: string]: string } = {
      'metformin': 'Type 2 diabetes mellitus management to improve glycemic control',
      'lisinopril': 'Hypertension and heart failure management',
      'atorvastatin': 'Dyslipidemia and cardiovascular disease prevention',
      'amlodipine': 'Hypertension and angina management',
      'insulin': 'Diabetes mellitus for glycemic control',
      'albuterol': 'Bronchospasm relief in patients with reversible obstructive airway disease including asthma and COPD',
      'tiotropium': 'Long-term maintenance treatment of bronchospasm associated with COPD',
      'ipratropium': 'Bronchospasm associated with COPD including chronic bronchitis and emphysema',
      'budesonide': 'Maintenance treatment of asthma and COPD inflammation',
      'fluticasone': 'Maintenance treatment of asthma and COPD as prophylactic therapy'
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
      },
      'albuterol': {
        IR: 'Inhaler: 1-2 puffs every 4-6 hours as needed. Maximum: 12 puffs daily (rescue inhaler)',
        ER: 'Extended-release tablets: 4-8mg every 12 hours (ER formulation)'
      },
      'tiotropium': {
        IR: '18mcg once daily via HandiHaler or 2.5mcg once daily via Respimat (maintenance therapy)',
        ER: '18mcg once daily via HandiHaler or 2.5mcg once daily via Respimat (maintenance therapy)'
      },
      'ipratropium': {
        IR: 'Inhaler: 2 puffs 4 times daily. Maximum: 12 puffs daily (maintenance bronchodilator)',
        ER: 'Inhaler: 2 puffs 4 times daily. Maximum: 12 puffs daily (maintenance bronchodilator)'
      },
      'budesonide': {
        IR: 'Inhaler: 1-2 puffs twice daily (maintenance anti-inflammatory)',
        ER: 'Inhaler: 1-2 puffs twice daily (maintenance anti-inflammatory)'
      },
      'fluticasone': {
        IR: 'Inhaler: 1-2 puffs twice daily (maintenance anti-inflammatory)',
        ER: 'Inhaler: 1-2 puffs twice daily (maintenance anti-inflammatory)'
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
      'insulin': 'Hypoglycemia, injection site reactions, weight gain',
      'albuterol': 'Tremor, nervousness, headache, throat irritation, palpitations',
      'tiotropium': 'Dry mouth, constipation, upper respiratory tract infection, urinary retention',
      'ipratropium': 'Dry mouth, cough, headache, dizziness, nausea',
      'budesonide': 'Oral thrush, hoarse voice, cough, headache, upper respiratory infection',
      'fluticasone': 'Oral thrush, hoarse voice, headache, cough, upper respiratory infection'
    };
    const baseSideEffects = sideEffects[medication.toLowerCase()] || 'Common side effects vary by medication';
    
    const formulationNote = formulation === 'ER' 
      ? 'ER formulation may have reduced GI side effects due to slower release.'
      : 'IR formulation may cause more immediate onset of side effects.';
      
    return `${baseSideEffects} ${formulationNote}`;
  }
}

export const dailyMedService = new DailyMedService();
