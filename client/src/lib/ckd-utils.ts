/**
 * Utility functions for CKD (Chronic Kidney Disease) management
 * These functions help with the generation and management of lab results, 
 * classification of patients, and risk assessment
 */

/**
 * Generate an eGFR value based on the CKD stage
 * @param ckdStage The chronic kidney disease stage
 * @returns A random eGFR value within the appropriate range for the given stage
 */
export function generateEgfrValue(ckdStage: string): number {
  // eGFR ranges by CKD stage
  switch (ckdStage) {
    case 'Stage 1':
      // ≥ 90 mL/min/1.73m²
      return Math.floor(Math.random() * 30) + 90;
    case 'Stage 2':
      // 60-89 mL/min/1.73m²
      return Math.floor(Math.random() * 30) + 60;
    case 'Stage 3A':
      // 45-59 mL/min/1.73m²
      return Math.floor(Math.random() * 15) + 45;
    case 'Stage 3B':
      // 30-44 mL/min/1.73m²
      return Math.floor(Math.random() * 15) + 30;
    case 'Stage 4':
      // 15-29 mL/min/1.73m²
      return Math.floor(Math.random() * 15) + 15;
    case 'Stage 5':
      // < 15 mL/min/1.73m²
      return Math.floor(Math.random() * 14) + 1;
    default:
      // Default to normal range if stage is unknown
      return Math.floor(Math.random() * 30) + 90;
  }
}

/**
 * Generate a proteinuria value based on the proteinuria level
 * @param proteinuriaLevel The proteinuria classification level (A1, A2, A3)
 * @returns A random proteinuria value (albumin-to-creatinine ratio) within the appropriate range
 */
export function generateProteinuriaValue(proteinuriaLevel: string): number {
  // Proteinuria values by classification
  switch (proteinuriaLevel) {
    case 'A1':
      // < 30 mg/g - Normal to mildly increased
      return Math.floor(Math.random() * 29) + 1;
    case 'A2':
      // 30-300 mg/g - Moderately increased
      return Math.floor(Math.random() * 270) + 30;
    case 'A3':
      // > 300 mg/g - Severely increased
      return Math.floor(Math.random() * 1700) + 300;
    default:
      // Default to normal range if level is unknown
      return Math.floor(Math.random() * 29) + 1;
  }
}

/**
 * Calculate creatinine level from eGFR using the simplified MDRD formula
 * This is a rough approximation as the real formula requires age, gender, race
 * @param egfr The estimated glomerular filtration rate
 * @param age Patient's age
 * @param isFemale Boolean indicating if patient is female
 * @param isBlack Boolean indicating if patient is of African descent
 * @returns Approximated serum creatinine in mg/dL
 */
export function calculateMDRD(creatinine: number, age: number, isFemale: boolean): number {
  // Formule MDRD pour les patients noirs
  let dfg = 175 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203);
  
  // Facteur de correction pour le genre
  if (isFemale) dfg *= 0.742;
  
  // Facteur de correction pour la race noire
  dfg *= 1.212;
  
  return Math.round(dfg * 100) / 100;
}

export function determineCKDStage(dfg: number): string {
  if (dfg >= 90) return 'Stage 1';
  if (dfg >= 60) return 'Stage 2';
  if (dfg >= 45) return 'Stage 3A';
  if (dfg >= 30) return 'Stage 3B';
  if (dfg >= 15) return 'Stage 4';
  return 'Stage 5';
}

export function calculateCreatinine(egfr: number, age: number = 50, isFemale: boolean = false): number {
  // Reverse calculation from MDRD formula
  let creatinine = 175 * Math.pow(egfr, -1.154) * Math.pow(age, -0.203);
  
  // Apply gender and race corrections
  if (isFemale) creatinine *= 0.742;
  if (isBlack) creatinine *= 1.212;
  
  // Round to 2 decimal places
  return parseFloat(creatinine.toFixed(2));
}

/**
 * Generate systolic blood pressure value based on CKD stage
 * Patients with advanced CKD tend to have higher blood pressure
 * @param ckdStage The chronic kidney disease stage
 * @returns A random systolic blood pressure value appropriate for the CKD stage
 */
export function generateSystolicBP(ckdStage: string): number {
  const baseValue = 120; // Normal systolic BP
  let variance: number;
  
  switch (ckdStage) {
    case 'Stage 1':
      variance = Math.floor(Math.random() * 20) - 10; // -10 to +10
      break;
    case 'Stage 2':
      variance = Math.floor(Math.random() * 20); // 0 to +20
      break;
    case 'Stage 3A':
      variance = Math.floor(Math.random() * 25) + 5; // +5 to +30
      break;
    case 'Stage 3B':
      variance = Math.floor(Math.random() * 30) + 10; // +10 to +40
      break;
    case 'Stage 4':
      variance = Math.floor(Math.random() * 35) + 15; // +15 to +50
      break;
    case 'Stage 5':
      variance = Math.floor(Math.random() * 40) + 20; // +20 to +60
      break;
    default:
      variance = Math.floor(Math.random() * 20) - 10; // -10 to +10
      break;
  }
  
  return baseValue + variance;
}

/**
 * Generate diastolic blood pressure value based on systolic value
 * @param systolicBP The systolic blood pressure value
 * @returns An appropriate diastolic blood pressure value
 */
export function generateDiastolicBP(systolicBP: number): number {
  // Typically diastolic is about 2/3 of systolic with some variance
  const baseDiastolic = Math.floor(systolicBP * 0.65);
  const variance = Math.floor(Math.random() * 10) - 5; // -5 to +5
  
  return baseDiastolic + variance;
}

/**
 * Determine progression risk based on eGFR and proteinuria
 * @param egfr Current eGFR value
 * @param proteinuriaLevel Proteinuria classification (A1, A2, A3)
 * @returns Risk level as string: "Low", "Moderate", "High", "Very High"
 */
export function determineProgressionRisk(egfr: number, proteinuriaLevel: string): string {
  // KDIGO risk classification
  if (egfr >= 90) {
    if (proteinuriaLevel === 'A1') return "Low";
    if (proteinuriaLevel === 'A2') return "Moderate";
    return "High";
  } else if (egfr >= 60) {
    if (proteinuriaLevel === 'A1') return "Low";
    if (proteinuriaLevel === 'A2') return "Moderate";
    return "High";
  } else if (egfr >= 45) {
    if (proteinuriaLevel === 'A1') return "Moderate";
    if (proteinuriaLevel === 'A2') return "High";
    return "Very High";
  } else if (egfr >= 30) {
    if (proteinuriaLevel === 'A1') return "High";
    return "Very High";
  } else if (egfr >= 15) {
    return "Very High";
  } else {
    return "Very High";
  }
}

/**
 * Determine CKD stage from eGFR value
 * @param egfr The estimated glomerular filtration rate
 * @returns The CKD stage as a string
 */
export function determineCkdStage(egfr: number): string {
  if (egfr >= 90) return "Stage 1";
  if (egfr >= 60) return "Stage 2";
  if (egfr >= 45) return "Stage 3A";
  if (egfr >= 30) return "Stage 3B";
  if (egfr >= 15) return "Stage 4";
  return "Stage 5";
}

/**
 * Determine proteinuria level from albumin-to-creatinine ratio
 * @param acrValue The albumin-to-creatinine ratio in mg/g
 * @returns The proteinuria level as a string (A1, A2, A3)
 */
export function determineProteinuriaLevel(acrValue: number): string {
  if (acrValue < 30) return "A1";
  if (acrValue <= 300) return "A2";
  return "A3";
}