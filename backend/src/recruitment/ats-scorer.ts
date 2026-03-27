/**
 * ATS (Applicant Tracking System) keyword scorer.
 * Extracts text from CV content and matches against job keywords.
 */

export interface AtsResult {
  score: number;
  matched: string[];
  missing: string[];
}

/**
 * Score CV text against a list of job keywords.
 * Case-insensitive matching. Returns percentage score, matched and missing keywords.
 */
export function scoreCV(cvText: string, keywords: string[]): AtsResult {
  if (!keywords.length) return { score: 0, matched: [], missing: [] };

  const text = cvText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  const score = Math.round((matched.length / keywords.length) * 100);
  return { score, matched, missing };
}
