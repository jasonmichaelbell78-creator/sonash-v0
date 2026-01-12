/**
 * Comprehensive Recovery Glossary
 * Aggregated by Gemini for Sober Solutions
 *
 * Categories: acronyms, clinical, culture, slang
 */

export interface GlossaryItem {
  term: string;
  definition: string;
  category: "acronyms" | "clinical" | "culture" | "slang";
}

export const glossaryData: GlossaryItem[] = [
  // =====================
  // ACRONYMS & ABBREVIATIONS
  // =====================
  {
    term: "90/90",
    definition: "90 meetings in 90 days. A benchmark often suggested to newcomers.",
    category: "acronyms",
  },
  {
    term: "AA",
    definition: "Alcoholics Anonymous. The original 12-step fellowship.",
    category: "acronyms",
  },
  {
    term: "ACA/ACOA",
    definition:
      "Adult Children of Alcoholics. Support for those who grew up in dysfunctional homes.",
    category: "acronyms",
  },
  { term: "ACTION", definition: "Any Change Toward Improving One's Nature.", category: "acronyms" },
  {
    term: "Al-Anon",
    definition: "Support group for families and friends of alcoholics.",
    category: "acronyms",
  },
  {
    term: "Alateen",
    definition: "Support group specifically for teenagers of alcoholics.",
    category: "acronyms",
  },
  {
    term: "ASAM",
    definition:
      "American Society of Addiction Medicine. Sets standard criteria for levels of care.",
    category: "acronyms",
  },
  { term: "AUD", definition: "Alcohol Use Disorder.", category: "acronyms" },
  { term: "AUDIT", definition: "Alcohol Use Disorders Identification Test.", category: "acronyms" },
  { term: "CA", definition: "Cocaine Anonymous.", category: "acronyms" },
  {
    term: "CBT",
    definition: "Cognitive Behavioral Therapy. Focuses on challenging distorted cognitions.",
    category: "acronyms",
  },
  { term: "CMA", definition: "Crystal Meth Anonymous.", category: "acronyms" },
  { term: "CODA", definition: "Codependents Anonymous.", category: "acronyms" },
  {
    term: "DBT",
    definition:
      "Dialectical Behavior Therapy. Emphasizes acceptance, mindfulness, and emotional regulation.",
    category: "acronyms",
  },
  { term: "DENIAL", definition: "Don't Even Notice I Am Lying.", category: "acronyms" },
  { term: "DOC", definition: "Drug of Choice.", category: "acronyms" },
  {
    term: "DSM-5",
    definition: "Diagnostic and Statistical Manual of Mental Disorders, 5th Edition.",
    category: "acronyms",
  },
  {
    term: "DTs",
    definition: "Delirium Tremens. Severe alcohol withdrawal symptoms.",
    category: "acronyms",
  },
  {
    term: "DUI/DWI",
    definition: "Driving Under the Influence / Driving While Intoxicated.",
    category: "acronyms",
  },
  { term: "EGO", definition: "Edging God Out.", category: "acronyms" },
  {
    term: "EMDR",
    definition: "Eye Movement Desensitization and Reprocessing. Therapy for trauma.",
    category: "acronyms",
  },
  { term: "ESH", definition: "Experience, Strength, and Hope.", category: "acronyms" },
  {
    term: "FEAR",
    definition: "Face Everything And Recover (or False Evidence Appearing Real).",
    category: "acronyms",
  },
  { term: "FINE", definition: "Frustrated, Insecure, Neurotic, Emotional.", category: "acronyms" },
  { term: "GA", definition: "Gamblers Anonymous.", category: "acronyms" },
  { term: "GOD", definition: "Good Orderly Direction (or Group Of Drunks).", category: "acronyms" },
  { term: "HA", definition: "Heroin Anonymous.", category: "acronyms" },
  { term: "HALT", definition: "Hungry, Angry, Lonely, Tired.", category: "acronyms" },
  {
    term: "HOPE",
    definition: "Happy Our Program Exists (or Hearing Other People's Experience).",
    category: "acronyms",
  },
  { term: "HOW", definition: "Honesty, Open-mindedness, Willingness.", category: "acronyms" },
  { term: "HP", definition: "Higher Power.", category: "acronyms" },
  {
    term: "IOP",
    definition: "Intensive Outpatient Program. Therapy 3-5 times a week while living at home.",
    category: "acronyms",
  },
  { term: "ISM", definition: "I, Self, Me (or Incredibly Short Memory).", category: "acronyms" },
  { term: "KISS", definition: "Keep It Simple, Stupid.", category: "acronyms" },
  { term: "MA", definition: "Marijuana Anonymous.", category: "acronyms" },
  {
    term: "MAT",
    definition: "Medication-Assisted Treatment (e.g., Suboxone, Methadone).",
    category: "acronyms",
  },
  {
    term: "MI",
    definition: "Motivational Interviewing. Counseling style to resolve ambivalence.",
    category: "acronyms",
  },
  { term: "NA", definition: "Narcotics Anonymous.", category: "acronyms" },
  {
    term: "Nar-Anon",
    definition: "Support for families/friends of drug addicts.",
    category: "acronyms",
  },
  {
    term: "NARR",
    definition: "National Alliance for Recovery Residences. Standards body for sober living.",
    category: "acronyms",
  },
  { term: "NIDA", definition: "National Institute on Drug Abuse.", category: "acronyms" },
  { term: "NUTS", definition: "Not Using The Steps.", category: "acronyms" },
  { term: "OA", definition: "Overeaters Anonymous.", category: "acronyms" },
  { term: "ODAT", definition: "One Day At A Time.", category: "acronyms" },
  { term: "OUD", definition: "Opioid Use Disorder.", category: "acronyms" },
  { term: "PAWS", definition: "Post-Acute Withdrawal Syndrome.", category: "acronyms" },
  {
    term: "PHP",
    definition: "Partial Hospitalization Program. Day treatment (approx. 20+ hours/week).",
    category: "acronyms",
  },
  { term: "PTSD", definition: "Post Traumatic Stress Disorder.", category: "acronyms" },
  { term: "QTIP", definition: "Quit Taking It Personally.", category: "acronyms" },
  {
    term: "SAMHSA",
    definition: "Substance Abuse and Mental Health Services Administration.",
    category: "acronyms",
  },
  { term: "SLIP", definition: "Sobriety Lost Its Priority.", category: "acronyms" },
  {
    term: "SMART Recovery",
    definition: "Self-Management and Recovery Training.",
    category: "acronyms",
  },
  { term: "SOBER", definition: "Son Of a B**** Everything's Real.", category: "acronyms" },
  { term: "STEPS", definition: "Solutions To Every Problem in Sobriety.", category: "acronyms" },
  { term: "SUD", definition: "Substance Use Disorder.", category: "acronyms" },
  { term: "TIME", definition: "Things I Must Earn.", category: "acronyms" },
  { term: "WAIT", definition: "Why Am I Talking?", category: "acronyms" },
  { term: "YET", definition: "You're Eligible Too.", category: "acronyms" },

  // =====================
  // CLINICAL & MEDICAL
  // =====================
  {
    term: "Abstinence",
    definition: "Deliberate restraint from substance use.",
    category: "clinical",
  },
  {
    term: "Addiction",
    definition:
      "A chronic, relapsing disorder characterized by compulsive drug seeking and use despite adverse consequences.",
    category: "clinical",
  },
  {
    term: "Aftercare",
    definition: "Ongoing support (sober living, alumni groups) after primary treatment.",
    category: "clinical",
  },
  {
    term: "Agonist",
    definition: "A substance that acts like an opioid in the brain (e.g., Methadone).",
    category: "clinical",
  },
  {
    term: "Antagonist",
    definition: "A substance that blocks opioids (e.g., Narcan, Naltrexone).",
    category: "clinical",
  },
  {
    term: "Biofeedback",
    definition: "Therapy that teaches control over physical processes (heart rate, etc.).",
    category: "clinical",
  },
  {
    term: "Buprenorphine",
    definition: "An opioid partial agonist used to treat opioid dependence (e.g., Subutex).",
    category: "clinical",
  },
  {
    term: "Case Management",
    definition: "Coordination of medical, social, and financial services for a client.",
    category: "clinical",
  },
  {
    term: "Contingency Management",
    definition: "A behavioral therapy that uses incentives/rewards to reinforce clean time.",
    category: "clinical",
  },
  {
    term: "Co-occurring Disorder",
    definition:
      "Having both a mental illness and a substance use disorder. Also called Dual Diagnosis.",
    category: "clinical",
  },
  {
    term: "Detox",
    definition: "The physiological process of removing toxic substances under medical supervision.",
    category: "clinical",
  },
  {
    term: "Disease Model",
    definition: "The medical view that addiction is a chronic brain disease, not a moral failing.",
    category: "clinical",
  },
  {
    term: "Evidence-Based Treatment",
    definition: "Practices proven effective through scientific research.",
    category: "clinical",
  },
  {
    term: "Family Therapy",
    definition: "Treating the family as a system to resolve dysfunction caused by addiction.",
    category: "clinical",
  },
  {
    term: "Harm Reduction",
    definition:
      "Policies/practices (like needle exchanges) that minimize harm without requiring abstinence.",
    category: "clinical",
  },
  {
    term: "Holistic Therapy",
    definition:
      "Treating the whole person (yoga, meditation, nutrition) alongside standard medicine.",
    category: "clinical",
  },
  {
    term: "Individualized Treatment",
    definition: "Care plans tailored to a specific person's history and needs.",
    category: "clinical",
  },
  {
    term: "Kindling",
    definition: "The tendency for withdrawal symptoms to get more severe with each relapse.",
    category: "clinical",
  },
  {
    term: "Naloxone (Narcan)",
    definition: "Emergency medication to reverse opioid overdose.",
    category: "clinical",
  },
  {
    term: "Psychoeducation",
    definition:
      "Education offered to individuals with a mental health condition and their families.",
    category: "clinical",
  },
  {
    term: "Recovery",
    definition:
      "A process of change through which individuals improve their health and wellness, live a self-directed life, and strive to reach their full potential.",
    category: "clinical",
  },
  {
    term: "Relapse",
    definition: "A return to substance use after a period of improvement.",
    category: "clinical",
  },
  {
    term: "Remission",
    definition: "A medical state where symptoms of the disorder are no longer present.",
    category: "clinical",
  },
  {
    term: "Residential Rehab",
    definition: "Live-in treatment with 24-hour support. Also called Inpatient Rehab.",
    category: "clinical",
  },
  {
    term: "Tolerance",
    definition: "The need for increasing amounts of a substance to achieve the same effect.",
    category: "clinical",
  },
  {
    term: "Trauma-Informed Care",
    definition: "Treatment that acknowledges the role of past trauma in current behavior.",
    category: "clinical",
  },

  // =====================
  // 12-STEP & RECOVERY CULTURE
  // =====================
  {
    term: "13th Stepping",
    definition: "Unwanted romantic/sexual advances toward a newcomer.",
    category: "culture",
  },
  {
    term: "Amends",
    definition: "The process of making right the harms done in the past (Steps 8 & 9).",
    category: "culture",
  },
  { term: "Big Book", definition: "The basic text of Alcoholics Anonymous.", category: "culture" },
  { term: "Bill W.", definition: "Co-founder of Alcoholics Anonymous.", category: "culture" },
  { term: "Birthday", definition: "Sobriety anniversary.", category: "culture" },
  {
    term: "Burning Desire",
    definition: "An urgent need to speak in a meeting to prevent a relapse.",
    category: "culture",
  },
  {
    term: "Chip/Medallion",
    definition: "A token marking length of sobriety.",
    category: "culture",
  },
  {
    term: "Closed Meeting",
    definition: "For those with a desire to stop drinking/using only.",
    category: "culture",
  },
  {
    term: "Crosstalk",
    definition: "Interrupting or giving direct advice during a meeting (usually discouraged).",
    category: "culture",
  },
  {
    term: "Denial",
    definition: "Refusal to admit the reality of the addiction.",
    category: "culture",
  },
  {
    term: "Dry Drunk",
    definition: "Someone abstaining from alcohol but retaining the anger/dysfunction of addiction.",
    category: "culture",
  },
  { term: "Fellowship", definition: "The community of people in recovery.", category: "culture" },
  {
    term: "Geographic",
    definition: "Moving to a new city to try to fix one's internal problems.",
    category: "culture",
  },
  {
    term: "Group Conscience",
    definition: "The collective decision-making process of a meeting.",
    category: "culture",
  },
  {
    term: "High-Functioning",
    definition:
      "An addict who maintains a job/family despite active addiction (often a phase before consequences hit).",
    category: "culture",
  },
  {
    term: "Home Group",
    definition: "The meeting a member commits to and attends weekly.",
    category: "culture",
  },
  {
    term: "Identify",
    definition: "Relating to the feelings or experiences shared by another.",
    category: "culture",
  },
  { term: "Inventory", definition: "A moral self-examination (Step 4).", category: "culture" },
  {
    term: "Living Amends",
    definition: "Showing one has changed through behavior rather than just words.",
    category: "culture",
  },
  {
    term: "Newcomer",
    definition: "A person in their first days or months of sobriety.",
    category: "culture",
  },
  { term: "Open Meeting", definition: "A meeting anyone can attend.", category: "culture" },
  { term: "Pink Cloud", definition: "Early recovery euphoria.", category: "culture" },
  {
    term: "Preamble",
    definition: "The opening statement read at AA meetings defining the fellowship.",
    category: "culture",
  },
  { term: "Program", definition: "The system of recovery (The Steps).", category: "culture" },
  {
    term: "Qualifier",
    definition: "The person whose addiction drove a friend/family member to Al-Anon.",
    category: "culture",
  },
  {
    term: "Share",
    definition: "To tell one's story or thoughts in a meeting.",
    category: "culture",
  },
  {
    term: "Sponsor",
    definition: "A mentor who guides a member through the Steps.",
    category: "culture",
  },
  {
    term: "Terminally Unique",
    definition: "The fatal belief that one's problems are too special for the program to fix.",
    category: "culture",
  },
  { term: "Three Legacies", definition: "Recovery, Unity, and Service.", category: "culture" },
  {
    term: "Urge Surfing",
    definition: "A mindfulness technique to ride out a craving without acting on it.",
    category: "culture",
  },

  // =====================
  // STREET & DRUG SLANG
  // =====================
  { term: "Bars", definition: "Xanax/Benzodiazepines.", category: "slang" },
  {
    term: "Blues",
    definition: "Counterfeit Oxycodone pills (usually Fentanyl).",
    category: "slang",
  },
  {
    term: "Chipping",
    definition: "Using occasionally or in small amounts (controlled use attempt).",
    category: "slang",
  },
  {
    term: "Cold Turkey",
    definition: "Quitting abruptly without medical assistance.",
    category: "slang",
  },
  { term: "Copping", definition: "Buying drugs.", category: "slang" },
  { term: "Dope", definition: "Heroin or general drugs.", category: "slang" },
  { term: "Jonesing", definition: "Craving drugs intensely.", category: "slang" },
  { term: "Kicking", definition: "Going through withdrawal.", category: "slang" },
  { term: "Lean", definition: "Codeine cough syrup mixed with soda.", category: "slang" },
  { term: "Pressed", definition: "Counterfeit pills made illegally.", category: "slang" },
  {
    term: "Tranq",
    definition: "Xylazine, a veterinary tranquilizer often mixed with Fentanyl.",
    category: "slang",
  },
];
