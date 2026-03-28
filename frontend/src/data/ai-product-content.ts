/** @file ai-product-content.ts — Lesson content for the AI Product and Project Leadership track (Beginner level). */

import type { TrackLesson, McqQuestion, DragDropPair } from "./ai-engineering-content";

const TRACK = "AI Product and Project Leadership";
const LEVEL = "Beginner";

// ─── Module 1: Product Discovery (3 lessons) ───────────────────

const m1: TrackLesson[] = [
  {
    id: "LSN-ap-001",
    moduleId: "MOD-ap-b01",
    moduleName: "Product Discovery",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Opportunity Identification and Problem Framing",
    lessonType: "video_text",
    duration: "25 min",
    objectives: ["Distinguish problems from solutions", "Apply opportunity-solution trees", "Frame product hypotheses using Jobs-to-be-Done"],
    content: [
      { type: "heading", text: "Why Product Discovery?" },
      { type: "paragraph", text: "Product discovery is the discipline of deciding what to build before you build it. Most failed products don't fail because of bad engineering — they fail because the team solved the wrong problem. Discovery reduces that risk by validating assumptions early and cheaply." },
      { type: "heading", text: "Problem vs Solution" },
      { type: "list", text: ["Problem space — the customer pain, unmet need, or opportunity", "Solution space — the feature, product, or service that addresses the problem", "Discovery lives in the problem space; delivery lives in the solution space", "Premature convergence on a solution is the #1 product risk"] },
      { type: "heading", text: "Opportunity-Solution Trees" },
      { type: "paragraph", text: "An opportunity-solution tree maps a desired outcome to the opportunities (customer needs) that could drive it, and then maps each opportunity to potential solutions. This visual framework prevents teams from jumping to solutions before understanding the problem landscape." },
      { type: "callout", text: "AI product tip: When building AI features, the discovery question is not 'Can we use AI here?' but 'Does the user have a problem that AI uniquely solves better than simpler alternatives?'" },
      { type: "keyTakeaway", text: "Great products start with great problems. Discovery ensures you invest engineering effort in the right direction." },
    ],
    reviewQuestions: [
      { question: "What is the primary goal of product discovery?", options: ["Ship features faster", "Validate that you're solving the right problem", "Write better user stories", "Reduce engineering costs"], correctIndex: 1, explanation: "Discovery validates that the team is solving a real, valuable problem before committing to building a solution." },
      { question: "What does an opportunity-solution tree map?", options: ["Code dependencies", "Outcomes to opportunities to solutions", "Sprint velocity", "Bug severity"], correctIndex: 1, explanation: "Opportunity-solution trees connect desired outcomes to customer opportunities and then to potential solutions." },
    ],
    practicePrompt: "Choose a product you use daily. Identify one unmet need and sketch an opportunity-solution tree with at least 2 opportunities and 3 potential solutions.",
    deliverable: "A written opportunity-solution tree for a real product with annotated reasoning.",
    prevLessonId: null,
    nextLessonId: "LSN-ap-002",
  },
  {
    id: "LSN-ap-002",
    moduleId: "MOD-ap-b01",
    moduleName: "Product Discovery",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Assumption Mapping and Experiment Design",
    lessonType: "coding_lab",
    duration: "35 min",
    objectives: ["Identify riskiest assumptions in a product idea", "Design lightweight experiments to test assumptions", "Write a structured experiment brief in Python"],
    content: [
      { type: "heading", text: "Assumptions Are Risks" },
      { type: "paragraph", text: "Every product idea rests on assumptions — about the user, the problem, the solution, and the market. The riskiest assumptions are the ones that, if wrong, would make the entire product fail. Discovery prioritises testing these first." },
      { type: "heading", text: "Experiment Types" },
      { type: "list", text: ["Fake door test — measure demand before building", "Concierge MVP — deliver the service manually to validate value", "Wizard of Oz — simulate automation with human effort behind the scenes", "A/B test — compare two variants with real users"] },
      { type: "keyTakeaway", text: "Test your riskiest assumption first with the cheapest experiment possible." },
    ],
    starterCode: `# Assumption Mapping Tool\n# Build a simple tool that scores and ranks product assumptions\n\nfrom dataclasses import dataclass\n\n@dataclass\nclass Assumption:\n    description: str\n    impact: int      # 1-5: how critical if wrong\n    uncertainty: int  # 1-5: how unsure we are\n\n    @property\n    def risk_score(self) -> int:\n        \"\"\"Higher score = test this assumption first.\"\"\"\n        # TODO: Calculate risk score as impact * uncertainty\n        pass\n\ndef rank_assumptions(assumptions: list[Assumption]) -> list[Assumption]:\n    \"\"\"Return assumptions sorted by risk score (highest first).\"\"\"\n    # TODO: Sort assumptions by risk_score descending\n    pass\n\n# Test it\nassumptions = [\n    Assumption("Users want AI-generated reports", 5, 4),\n    Assumption("Users will pay monthly", 4, 3),\n    Assumption("Users can navigate the dashboard", 2, 2),\n]\n\nranked = rank_assumptions(assumptions)\nfor a in ranked:\n    print(f"[Risk: {a.risk_score}] {a.description}")\n`,
    language: "python",
    reviewQuestions: [
      { question: "Which assumption should you test first?", options: ["The easiest to test", "The one with highest impact × uncertainty", "The one the CEO likes", "The cheapest to build"], correctIndex: 1, explanation: "Prioritise assumptions with the highest risk score (impact × uncertainty) — these are the ones that could sink the product." },
    ],
    deliverable: "A working Python tool that scores and ranks product assumptions by risk.",
    prevLessonId: "LSN-ap-001",
    nextLessonId: "LSN-ap-003",
  },
  {
    id: "LSN-ap-003",
    moduleId: "MOD-ap-b01",
    moduleName: "Product Discovery",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Product Discovery — Module Assessment",
    lessonType: "mcq",
    duration: "15 min",
    objectives: ["Demonstrate understanding of product discovery fundamentals"],
    content: [
      { type: "heading", text: "Module 1 Assessment" },
      { type: "paragraph", text: "This assessment covers opportunity identification, assumption mapping, and experiment design. You need 70% to pass the performance gate." },
    ],
    mcqQuestions: [
      { question: "What is the biggest risk in skipping product discovery?", options: ["Slower development", "Building a product nobody wants", "Higher infrastructure costs", "Longer sprint cycles"], correctIndex: 1, explanation: "Without discovery, teams risk investing months building a solution to a problem that doesn't exist or isn't valuable enough." },
      { question: "What does a 'fake door test' measure?", options: ["Code quality", "User demand before building the feature", "Server performance", "Team velocity"], correctIndex: 1, explanation: "A fake door test presents a feature as if it exists (e.g., a button) and measures how many users try to use it — validating demand before building." },
      { question: "In an opportunity-solution tree, what sits between the outcome and the solutions?", options: ["Features", "Opportunities (customer needs)", "Sprint goals", "Technical requirements"], correctIndex: 1, explanation: "Opportunities represent customer needs or pain points that, if addressed, would drive the desired outcome." },
    ],
    reviewQuestions: [],
    deliverable: "Complete the assessment with 70% or higher to pass the performance gate.",
    prevLessonId: "LSN-ap-002",
    nextLessonId: "LSN-ap-004",
  },
];


// ─── Module 2: Stakeholder Management (2 lessons) ──────────────

const m2: TrackLesson[] = [
  {
    id: "LSN-ap-004",
    moduleId: "MOD-ap-b02",
    moduleName: "Stakeholder Management",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Stakeholder Mapping and Influence Strategies",
    lessonType: "drag_drop",
    duration: "15 min",
    objectives: ["Classify stakeholders by power and interest", "Match engagement strategies to stakeholder types", "Understand the power-interest grid"],
    content: [
      { type: "heading", text: "Know Your Stakeholders" },
      { type: "paragraph", text: "Every product exists within an ecosystem of stakeholders — executives, engineers, customers, regulators, partners. Effective product managers map these stakeholders and tailor their communication and engagement strategy to each group." },
      { type: "heading", text: "The Power-Interest Grid" },
      { type: "paragraph", text: "The power-interest grid classifies stakeholders into four quadrants based on their power to influence the product and their interest in it. Each quadrant requires a different engagement approach." },
      { type: "keyTakeaway", text: "Stakeholder management is not politics — it's ensuring the right people have the right information at the right time to make good decisions." },
    ],
    dragDropPairs: [
      { term: "High power, high interest", definition: "Manage closely — regular updates, involve in key decisions" },
      { term: "High power, low interest", definition: "Keep satisfied — periodic briefings, escalate only critical issues" },
      { term: "Low power, high interest", definition: "Keep informed — share progress updates, gather feedback" },
      { term: "Low power, low interest", definition: "Monitor — minimal effort, include in broad communications only" },
      { term: "Executive sponsor", definition: "Champion who secures budget and removes organisational blockers" },
    ],
    reviewQuestions: [],
    deliverable: "Complete the matching exercise with all stakeholder-strategy pairs correctly matched.",
    prevLessonId: "LSN-ap-003",
    nextLessonId: "LSN-ap-005",
  },
  {
    id: "LSN-ap-005",
    moduleId: "MOD-ap-b02",
    moduleName: "Stakeholder Management",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Communication Plans and Status Reporting",
    lessonType: "video_text",
    duration: "25 min",
    objectives: ["Build a stakeholder communication plan", "Write effective status reports", "Handle difficult stakeholder conversations"],
    content: [
      { type: "heading", text: "Communication Is the Product Manager's Superpower" },
      { type: "paragraph", text: "Product managers spend more time communicating than coding, designing, or analysing. A structured communication plan ensures stakeholders get the right level of detail at the right frequency — preventing both information overload and dangerous silence." },
      { type: "heading", text: "Status Report Structure" },
      { type: "list", text: ["Summary — one-sentence health indicator (on track / at risk / blocked)", "Progress — what was accomplished since last update", "Risks — what could go wrong and mitigation plans", "Asks — specific decisions or actions needed from stakeholders", "Next steps — what's coming in the next cycle"] },
      { type: "callout", text: "AI product tip: When reporting on AI features, always include model performance metrics alongside delivery progress. Stakeholders need to understand both 'Is it built?' and 'Does it work?'" },
      { type: "keyTakeaway", text: "A good status report answers three questions: Where are we? What's at risk? What do we need from you?" },
    ],
    reviewQuestions: [
      { question: "What should a status report always include?", options: ["Detailed code changes", "Summary, progress, risks, asks, and next steps", "Only positive updates", "Technical architecture diagrams"], correctIndex: 1, explanation: "Effective status reports cover health summary, progress, risks, asks, and next steps — giving stakeholders a complete picture." },
      { question: "Why is a communication plan important?", options: ["To reduce meeting count", "To ensure stakeholders get the right information at the right frequency", "To document everything for legal", "To replace direct conversations"], correctIndex: 1, explanation: "A communication plan prevents both information overload and dangerous silence by matching detail level to stakeholder needs." },
    ],
    practicePrompt: "Write a one-page status report for an AI product that is 60% complete but facing a model accuracy issue. Include all five sections: summary, progress, risks, asks, and next steps.",
    deliverable: "A structured status report for an AI product with realistic risks and asks.",
    prevLessonId: "LSN-ap-004",
    nextLessonId: "LSN-ap-006",
  },
];


// ─── Module 3: Agile Delivery (3 lessons) ──────────────────────

const m3: TrackLesson[] = [
  {
    id: "LSN-ap-006",
    moduleId: "MOD-ap-b03",
    moduleName: "Agile Delivery",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Agile Principles and Scrum Fundamentals",
    lessonType: "video_text",
    duration: "25 min",
    objectives: ["Explain the Agile Manifesto's four values", "Describe Scrum roles, events, and artefacts", "Distinguish Scrum from Kanban"],
    content: [
      { type: "heading", text: "Agile Is a Mindset, Not a Process" },
      { type: "paragraph", text: "Agile is not about standups and sprints — it's about responding to change, delivering value incrementally, and learning from feedback. Scrum and Kanban are frameworks that implement agile principles, but the principles matter more than the ceremonies." },
      { type: "heading", text: "The Agile Manifesto" },
      { type: "list", text: ["Individuals and interactions over processes and tools", "Working software over comprehensive documentation", "Customer collaboration over contract negotiation", "Responding to change over following a plan"] },
      { type: "heading", text: "Scrum in 60 Seconds" },
      { type: "list", text: ["Roles: Product Owner, Scrum Master, Development Team", "Events: Sprint Planning, Daily Standup, Sprint Review, Retrospective", "Artefacts: Product Backlog, Sprint Backlog, Increment", "Cadence: Fixed-length sprints (usually 2 weeks)"] },
      { type: "callout", text: "AI product tip: AI features often have uncertain timelines because model performance is hard to predict. Use spikes (time-boxed research tasks) to reduce uncertainty before committing to sprint goals." },
      { type: "keyTakeaway", text: "Agile is about learning fast and delivering value incrementally. Choose the framework that fits your team's context." },
    ],
    reviewQuestions: [
      { question: "Which Agile value prioritises working software?", options: ["Processes and tools", "Comprehensive documentation", "Working software over comprehensive documentation", "Contract negotiation"], correctIndex: 2, explanation: "The Agile Manifesto values working software over comprehensive documentation — delivering value is more important than perfect docs." },
      { question: "What is a spike in Agile?", options: ["A bug fix", "A time-boxed research task to reduce uncertainty", "A high-priority feature", "A deployment event"], correctIndex: 1, explanation: "A spike is a time-boxed investigation to answer a question or reduce technical uncertainty before committing to a solution." },
    ],
    practicePrompt: "Compare Scrum and Kanban for an AI product team that ships model updates weekly. Which framework would you recommend and why?",
    deliverable: "A written comparison of Scrum vs Kanban with a recommendation for an AI product team.",
    prevLessonId: "LSN-ap-005",
    nextLessonId: "LSN-ap-007",
  },
  {
    id: "LSN-ap-007",
    moduleId: "MOD-ap-b03",
    moduleName: "Agile Delivery",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Writing User Stories and Acceptance Criteria",
    lessonType: "coding_lab",
    duration: "35 min",
    objectives: ["Write user stories in standard format", "Define measurable acceptance criteria", "Use INVEST criteria to evaluate story quality"],
    content: [
      { type: "heading", text: "User Stories Are Conversations, Not Contracts" },
      { type: "paragraph", text: "A user story captures who needs what and why. It's a placeholder for a conversation between the product manager, designer, and engineer — not a detailed specification. The acceptance criteria define when the story is done." },
      { type: "heading", text: "INVEST Criteria" },
      { type: "list", text: ["Independent — can be developed without depending on other stories", "Negotiable — details are discussed, not dictated", "Valuable — delivers value to the user or business", "Estimable — the team can estimate the effort", "Small — fits within a single sprint", "Testable — has clear acceptance criteria"] },
      { type: "keyTakeaway", text: "Good user stories are small, valuable, and testable. The acceptance criteria are what make them actionable." },
    ],
    starterCode: `# User Story Generator\n# Build a tool that structures and validates user stories\n\nfrom dataclasses import dataclass, field\n\n@dataclass\nclass AcceptanceCriterion:\n    given: str\n    when: str\n    then: str\n\n    def __str__(self) -> str:\n        return f"GIVEN {self.given}, WHEN {self.when}, THEN {self.then}"\n\n@dataclass\nclass UserStory:\n    role: str\n    action: str\n    benefit: str\n    criteria: list[AcceptanceCriterion] = field(default_factory=list)\n\n    def format_story(self) -> str:\n        \"\"\"Return the story in standard format.\"\"\"\n        # TODO: Return 'As a {role}, I want to {action}, so that {benefit}'\n        pass\n\n    def is_testable(self) -> bool:\n        \"\"\"A story is testable if it has at least one acceptance criterion.\"\"\"\n        # TODO: Return True if criteria list is not empty\n        pass\n\n# Test it\nstory = UserStory(\n    role="learner",\n    action="see my progress across all modules",\n    benefit="I know what to study next",\n    criteria=[\n        AcceptanceCriterion(\n            given="a learner has completed 3 of 5 modules",\n            when="they view the dashboard",\n            then="a progress bar shows 60% completion",\n        )\n    ],\n)\n\nprint(story.format_story())\nprint(f"Testable: {story.is_testable()}")\nfor ac in story.criteria:\n    print(f"  AC: {ac}")\n`,
    language: "python",
    reviewQuestions: [
      { question: "What does the 'T' in INVEST stand for?", options: ["Timely", "Testable", "Technical", "Tracked"], correctIndex: 1, explanation: "Testable — a good user story has clear acceptance criteria that let the team verify when it's done." },
    ],
    deliverable: "A working Python tool that formats user stories and validates testability.",
    prevLessonId: "LSN-ap-006",
    nextLessonId: "LSN-ap-008",
  },
  {
    id: "LSN-ap-008",
    moduleId: "MOD-ap-b03",
    moduleName: "Agile Delivery",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Agile Delivery — Module Assessment",
    lessonType: "mcq",
    duration: "15 min",
    objectives: ["Demonstrate understanding of Agile delivery fundamentals"],
    content: [
      { type: "heading", text: "Module 3 Assessment" },
      { type: "paragraph", text: "This assessment covers Agile principles, Scrum, user stories, and acceptance criteria. You need 70% to pass the performance gate." },
    ],
    mcqQuestions: [
      { question: "Which Scrum role owns the product backlog?", options: ["Scrum Master", "Product Owner", "Tech Lead", "QA Engineer"], correctIndex: 1, explanation: "The Product Owner owns the product backlog and is responsible for prioritising items to maximise value." },
      { question: "What is the purpose of a sprint retrospective?", options: ["Plan the next sprint", "Demo completed work", "Reflect on the process and identify improvements", "Estimate story points"], correctIndex: 2, explanation: "The retrospective is where the team reflects on what went well, what didn't, and what to improve in the next sprint." },
      { question: "Which acceptance criteria format uses Given-When-Then?", options: ["User story format", "Gherkin / BDD format", "INVEST format", "MoSCoW format"], correctIndex: 1, explanation: "Given-When-Then is the Gherkin/BDD format for writing structured, testable acceptance criteria." },
    ],
    reviewQuestions: [],
    deliverable: "Complete the assessment with 70% or higher to pass the performance gate.",
    prevLessonId: "LSN-ap-007",
    nextLessonId: "LSN-ap-009",
  },
];


// ─── Module 4: AI Product Fundamentals (3 lessons) ─────────────

const m4: TrackLesson[] = [
  {
    id: "LSN-ap-009",
    moduleId: "MOD-ap-b04",
    moduleName: "AI Product Fundamentals",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "What Makes AI Products Different",
    lessonType: "video_text",
    duration: "30 min",
    objectives: ["Explain how AI products differ from traditional software", "Identify the unique risks of AI-powered features", "Understand the build-vs-buy decision for AI capabilities"],
    content: [
      { type: "heading", text: "AI Products Are Probabilistic" },
      { type: "paragraph", text: "Traditional software is deterministic — given the same input, it always produces the same output. AI products are probabilistic — they produce predictions with varying confidence levels. This fundamental difference changes how you design, test, ship, and support AI features." },
      { type: "heading", text: "Key Differences" },
      { type: "list", text: ["Deterministic vs probabilistic outputs", "Data dependency — AI products are only as good as their training data", "Continuous learning — models degrade over time and need retraining", "Explainability — users and regulators may demand to know why a decision was made", "Failure modes — AI fails silently (wrong but confident) unlike traditional software (crashes)"] },
      { type: "heading", text: "Build vs Buy" },
      { type: "paragraph", text: "Not every AI feature needs a custom model. Foundation model APIs (GPT, Claude, Gemini) can handle many tasks. The build-vs-buy decision depends on data sensitivity, performance requirements, cost at scale, and competitive differentiation." },
      { type: "callout", text: "AI product tip: Start with an API-based solution to validate the use case. Only invest in custom models when you've proven the value and the API can't meet your requirements." },
      { type: "keyTakeaway", text: "AI products are probabilistic, data-dependent, and degrade over time. Product managers must design for uncertainty, not just functionality." },
    ],
    reviewQuestions: [
      { question: "How do AI products differ from traditional software?", options: ["They're always faster", "They produce probabilistic outputs instead of deterministic ones", "They don't need testing", "They're cheaper to build"], correctIndex: 1, explanation: "AI products produce predictions with varying confidence, unlike traditional software which gives the same output for the same input." },
      { question: "When should you build a custom model instead of using an API?", options: ["Always — APIs are unreliable", "When data sensitivity, performance, or differentiation requires it", "Never — APIs are always better", "Only for image recognition"], correctIndex: 1, explanation: "Custom models are justified when API solutions can't meet data privacy, performance, cost, or competitive differentiation requirements." },
    ],
    practicePrompt: "Compare an AI-powered recommendation engine to a rule-based one. List 3 advantages and 3 risks of the AI approach from a product manager's perspective.",
    deliverable: "A written comparison of AI vs rule-based approaches with product management implications.",
    prevLessonId: "LSN-ap-008",
    nextLessonId: "LSN-ap-010",
  },
  {
    id: "LSN-ap-010",
    moduleId: "MOD-ap-b04",
    moduleName: "AI Product Fundamentals",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "AI Product Metrics and Success Criteria",
    lessonType: "coding_lab",
    duration: "35 min",
    objectives: ["Define model performance metrics vs product metrics", "Build a simple metric tracking dashboard in Python", "Understand precision, recall, and the trade-offs between them"],
    content: [
      { type: "heading", text: "Two Layers of Metrics" },
      { type: "paragraph", text: "AI products need two layers of metrics: model metrics (accuracy, precision, recall, F1) and product metrics (user engagement, task completion, revenue impact). A model can be technically accurate but still fail as a product if users don't trust or use it." },
      { type: "heading", text: "Precision vs Recall" },
      { type: "paragraph", text: "Precision measures how many of the positive predictions were correct. Recall measures how many of the actual positives were found. The trade-off depends on the cost of false positives vs false negatives in your specific product context." },
      { type: "keyTakeaway", text: "Model accuracy alone doesn't make a successful AI product. Track both model performance and user-facing product metrics." },
    ],
    starterCode: `# AI Product Metric Tracker\n# Build a tool that calculates and compares model vs product metrics\n\ndef precision(true_positives: int, false_positives: int) -> float:\n    \"\"\"Calculate precision: TP / (TP + FP).\"\"\"\n    # TODO: Implement precision calculation\n    # Handle division by zero\n    pass\n\ndef recall(true_positives: int, false_negatives: int) -> float:\n    \"\"\"Calculate recall: TP / (TP + FN).\"\"\"\n    # TODO: Implement recall calculation\n    # Handle division by zero\n    pass\n\ndef f1_score(prec: float, rec: float) -> float:\n    \"\"\"Calculate F1 score: 2 * (precision * recall) / (precision + recall).\"\"\"\n    # TODO: Implement F1 calculation\n    # Handle division by zero\n    pass\n\n# Test with a spam classifier example\ntp, fp, fn = 80, 10, 20\np = precision(tp, fp)\nr = recall(tp, fn)\nf1 = f1_score(p, r)\n\nprint(f"Precision: {p:.2f}")  # Expected: 0.89\nprint(f"Recall: {r:.2f}")     # Expected: 0.80\nprint(f"F1 Score: {f1:.2f}")  # Expected: 0.84\n`,
    language: "python",
    reviewQuestions: [
      { question: "When is high recall more important than high precision?", options: ["When false positives are costly", "When missing a positive case is dangerous (e.g., medical diagnosis)", "When the dataset is small", "When the model is fast"], correctIndex: 1, explanation: "High recall is critical when missing a positive case has severe consequences — like failing to detect a disease or a security threat." },
    ],
    deliverable: "A working Python metric tracker that calculates precision, recall, and F1 score.",
    prevLessonId: "LSN-ap-009",
    nextLessonId: "LSN-ap-011",
  },
  {
    id: "LSN-ap-011",
    moduleId: "MOD-ap-b04",
    moduleName: "AI Product Fundamentals",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "AI Product Concepts — Matching Exercise",
    lessonType: "drag_drop",
    duration: "10 min",
    objectives: ["Match AI product concepts to their definitions"],
    content: [
      { type: "heading", text: "Match the AI Product Concept" },
      { type: "paragraph", text: "Drag each AI product concept to its correct definition." },
    ],
    dragDropPairs: [
      { term: "Model drift", definition: "Degradation of model performance over time as real-world data changes" },
      { term: "Precision", definition: "Proportion of positive predictions that were actually correct" },
      { term: "Recall", definition: "Proportion of actual positives that the model correctly identified" },
      { term: "Explainability", definition: "Ability to describe why an AI system made a specific decision" },
      { term: "Foundation model", definition: "Large pre-trained model adapted for specific tasks via prompting or fine-tuning" },
    ],
    reviewQuestions: [],
    deliverable: "Complete the matching exercise with all AI product concept pairs correctly matched.",
    prevLessonId: "LSN-ap-010",
    nextLessonId: "LSN-ap-012",
  },
];


// ─── Module 5: User Research Basics (2 lessons) ────────────────

const m5: TrackLesson[] = [
  {
    id: "LSN-ap-012",
    moduleId: "MOD-ap-b05",
    moduleName: "User Research Basics",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Research Methods and Interview Techniques",
    lessonType: "video_text",
    duration: "30 min",
    objectives: ["Distinguish qualitative from quantitative research", "Conduct a structured user interview", "Avoid common interviewing biases"],
    content: [
      { type: "heading", text: "Why User Research?" },
      { type: "paragraph", text: "User research is how product teams learn about real user behaviour, needs, and pain points. Without research, product decisions are based on assumptions and opinions. With research, they're based on evidence." },
      { type: "heading", text: "Qualitative vs Quantitative" },
      { type: "list", text: ["Qualitative — interviews, observations, usability tests (why and how)", "Quantitative — surveys, analytics, A/B tests (how many and how much)", "Use qualitative to discover problems; use quantitative to measure them", "Both are needed — qualitative without quantitative is anecdotal; quantitative without qualitative is blind"] },
      { type: "heading", text: "Interview Best Practices" },
      { type: "list", text: ["Ask open-ended questions ('Tell me about...' not 'Do you like...')", "Focus on past behaviour, not hypothetical futures", "Don't lead the witness — avoid suggesting answers", "Listen more than you talk — aim for 80/20 ratio", "Record and transcribe (with consent) for accurate analysis"] },
      { type: "callout", text: "AI product tip: When researching AI features, ask users about their current workflow and pain points — not whether they want AI. Users can't evaluate AI capabilities they haven't experienced." },
      { type: "keyTakeaway", text: "Good research asks about real behaviour, not hypothetical preferences. Let users tell you about their problems; don't pitch your solutions." },
    ],
    reviewQuestions: [
      { question: "Why should you ask about past behaviour instead of hypothetical futures?", options: ["It's faster", "Past behaviour is a reliable predictor; hypothetical answers are unreliable", "Users prefer talking about the past", "It avoids legal issues"], correctIndex: 1, explanation: "People are poor predictors of their own future behaviour. Asking about what they actually did reveals real patterns and needs." },
      { question: "What is the recommended talk ratio in a user interview?", options: ["50/50", "80% interviewer, 20% participant", "20% interviewer, 80% participant", "100% interviewer"], correctIndex: 2, explanation: "The interviewer should listen 80% of the time. The goal is to learn from the participant, not to present your ideas." },
    ],
    practicePrompt: "Write an interview guide with 5 open-ended questions for researching how product managers currently track AI model performance in their products.",
    deliverable: "A structured interview guide with open-ended questions and follow-up probes.",
    prevLessonId: "LSN-ap-011",
    nextLessonId: "LSN-ap-013",
  },
  {
    id: "LSN-ap-013",
    moduleId: "MOD-ap-b05",
    moduleName: "User Research Basics",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Beginner Level — Final Assessment",
    lessonType: "mcq",
    duration: "20 min",
    objectives: ["Demonstrate understanding of all Beginner level concepts"],
    content: [
      { type: "heading", text: "Beginner Level Final Assessment" },
      { type: "paragraph", text: "This comprehensive assessment covers all 5 modules: Product Discovery, Stakeholder Management, Agile Delivery, AI Product Fundamentals, and User Research Basics. You need 70% to pass." },
    ],
    mcqQuestions: [
      { question: "What is the primary purpose of an opportunity-solution tree?", options: ["Track sprint velocity", "Map outcomes to customer needs to potential solutions", "Assign tasks to team members", "Calculate ROI"], correctIndex: 1, explanation: "Opportunity-solution trees connect desired outcomes to customer opportunities and then to potential solutions, preventing premature solution convergence." },
      { question: "Which stakeholder quadrant requires the most active management?", options: ["Low power, low interest", "Low power, high interest", "High power, low interest", "High power, high interest"], correctIndex: 3, explanation: "High power, high interest stakeholders can influence the product and care about it — they need regular updates and involvement in key decisions." },
      { question: "What makes AI products fundamentally different from traditional software?", options: ["They're more expensive", "They produce probabilistic outputs that can degrade over time", "They don't need testing", "They always require GPUs"], correctIndex: 1, explanation: "AI products are probabilistic and data-dependent, meaning outputs vary and model performance degrades as real-world data shifts." },
      { question: "In user research, why avoid leading questions?", options: ["They take too long", "They bias the participant toward a specific answer", "They're illegal", "They confuse participants"], correctIndex: 1, explanation: "Leading questions suggest a desired answer, biasing the data and preventing you from learning what the user actually thinks or does." },
      { question: "What does the 'I' in INVEST stand for?", options: ["Iterative", "Independent", "Integrated", "Immediate"], correctIndex: 1, explanation: "Independent — a good user story can be developed without depending on other stories, allowing flexible prioritisation." },
    ],
    reviewQuestions: [],
    deliverable: "Complete the final assessment with 70% or higher to unlock the Intermediate level.",
    prevLessonId: "LSN-ap-012",
    nextLessonId: null,
  },
];

// ─── Export ─────────────────────────────────────────────────────

export const AI_PRODUCT_LESSONS: TrackLesson[] = [...m1, ...m2, ...m3, ...m4, ...m5];
