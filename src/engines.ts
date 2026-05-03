import type { UserProfile, Candidate, MatchResult, MatchMode, Vacancy } from './models';

export const MatchingEngine = {
  rank(profile: UserProfile, candidates: Candidate[], mode: MatchMode): MatchResult[] {
    return candidates.map(candidate => {
      const gpa = candidate.gpa || 0;
      const karma = candidate.karma || 0;
      const commits = candidate.githubCommits || 0;
      
      const gpaScore = Math.min(100, Math.round((gpa / 4.0) * 100));
      const skillsScore = this.calculateSkillMatch(profile.skills, candidate.skills);
      const performance = Math.round(gpaScore * 0.4 + skillsScore * 0.6);

      const scheduleMatch = profile.schedule === candidate.schedule ? 100 : 50;
      const social = Math.round(karma * 0.5 + Math.min(100, commits * 2) * 0.3 + scheduleMatch * 0.2);

      let total = 0;
      let risk = '';
      let explanation = '';

      if (mode === 'Performance') {
        total = Math.round(performance * 0.8 + social * 0.2);
        risk = gpa < (profile.eliteMinGpa || 3.0) ? 'High Risk: Low GPA' : 'Low Risk';
        explanation = `Performance focus: GPA ${gpa} and ${skillsScore}% skill match drive the score.`;
      } else if (mode === 'Social') {
        total = Math.round(performance * 0.2 + social * 0.8);
        risk = karma < 70 ? 'High Risk: Low Karma' : 'Low Risk';
        explanation = `Social focus: Karma ${karma} and schedule match (${candidate.schedule || 'N/A'}) drive the score.`;
      } else { // Hybrid
        total = Math.round(performance * 0.5 + social * 0.5);
        risk = (gpa < 2.5 || karma < 60) ? 'High Risk' : 'Medium Risk';
        explanation = `Hybrid focus: Balanced evaluation of performance (${performance}) and social traits (${social}).`;
      }

      if (candidate.reliabilityLabel === 0) {
        total -= 20;
        risk = 'Critical Risk: Freeloader Label';
        explanation += ' Penalty applied due to poor peer reviews.';
      }

      return {
        candidate,
        total: Math.max(0, total),
        performance,
        social,
        risk,
        explanation
      };
    }).sort((a, b) => b.total - a.total);
  },

  calculateSkillMatch(needed: string, offered: string): number {
    if (!needed || !offered) return 0;
    const needList = needed.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    const offList = offered.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    if (needList.length === 0) return 100;
    
    let matches = 0;
    for (const n of needList) {
      if (offList.includes(n)) matches++;
    }
    return Math.round((matches / needList.length) * 100);
  }
};

export const AssistantEngine = {
  answer(prompt: string, profile: UserProfile, candidates: Candidate[], vacancies: Vacancy[], mode: MatchMode): string {
    const ranked = MatchingEngine.rank(profile, candidates, mode);
    const best = ranked.length > 0 ? ranked[0] : null;
    const lower = prompt.toLowerCase();

    if (!best) return "I need candidate data before I can recommend a teammate.";

    if (lower.includes("compare") || lower.includes("сравни")) {
      return this.compareCandidates(lower, ranked);
    }
    
    if (lower.includes("recommend") || lower.includes("who") || lower.includes("кого")) {
      return `Best choice: ${best.candidate.name} for ${best.candidate.role}. Match score: ${best.total}%. ${best.explanation} Main risk: ${best.risk}.`;
    }

    if (lower.includes("risk") || lower.includes("ghost") || lower.includes("freeload") || lower.includes("риск")) {
      return this.riskSummary(candidates);
    }

    if (lower.includes("vacancy") || lower.includes("role") || lower.includes("роль")) {
      return this.vacancySummary(vacancies);
    }

    if (lower.includes("defense") || lower.includes("presentation") || lower.includes("защит")) {
      return "Defense argument: the app solves low-trust team formation with verified GPA, GitHub proof, role-based vacancies, karma reviews, and explainable matching. LocalStorage proves persistent data, while the assistant explains decisions instead of acting like a black box.";
    }

    if (lower.includes("precision") || lower.includes("recall") || lower.includes("f1")) {
      return "For this product, precision is more important than recall. A false positive admits an unreliable student and can damage the whole team. A false negative is unfair to one student, but can be handled through appeal and profile improvement.";
    }

    return `I can help with candidate recommendations, vacancy design, risk analysis, and defense wording. Current mode is ${mode}; top candidate is ${best.candidate.name} with ${best.total}% match.`;
  },

  compareCandidates(prompt: string, ranked: MatchResult[]): string {
    const matchedCandidates = ranked.filter(r => r.candidate.name && prompt.includes(r.candidate.name.toLowerCase().split(' ')[0]));
    if (matchedCandidates.length < 2) {
      return "Please specify at least two candidate first names from the list to compare them (e.g. 'Compare Dana and Timur').";
    }
    const first = matchedCandidates[0];
    const second = matchedCandidates[1];
    
    return `Comparing ${first.candidate.name} and ${second.candidate.name}:\n- ${first.candidate.name}: Score ${first.total}% (${first.risk}). ${first.explanation}\n- ${second.candidate.name}: Score ${second.total}% (${second.risk}). ${second.explanation}\nRecommendation: ${first.total >= second.total ? first.candidate.name : second.candidate.name} is a better fit.`;
  },

  riskSummary(candidates: Candidate[]): string {
    const risky = candidates.filter(c => c.karma < 70 || c.githubCommits < 10 || c.reliabilityLabel === 0);
    if (risky.length === 0) return "No high-risk candidates detected. Everyone passes the karma and proof-of-work baseline.";
    return "High-risk candidates: " + risky.map(c => `${c.name} (karma ${c.karma}, GitHub ${c.githubCommits}, label ${c.reliabilityLabel})`).join(", ");
  },

  vacancySummary(vacancies: Vacancy[]): string {
    const open = vacancies.filter(v => v.status === 'Open');
    if (open.length === 0) return "No open vacancies. Create a role slot before matching candidates.";
    return "Open role slots: " + open.map(v => `${v.neededRole} for ${v.projectName}, min GPA ${v.minGpa}, ${v.weeklyHours}h/week`).join(", ");
  }
};
