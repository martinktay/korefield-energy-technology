/** @file foundation-content.ts — Educational content for the 12-module + capstone AI Foundation School. */

export interface ContentSection {
  type: "heading" | "paragraph" | "list" | "callout" | "keyTakeaway";
  text: string | string[];
}

export interface ReviewQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface PracticeTask {
  instruction: string;
  inputType: "text" | "textarea" | "file";
  placeholder: string;
  example?: string;
}

export interface FoundationModule {
  id: string;
  number: number;
  title: string;
  phase: number;
  phaseTitle: string;
  duration: string;
  objective: string;
  deliverable: string;
  assessmentMethod: string;
  content: ContentSection[];
  practiceTask: PracticeTask;
  reviewQuestions: ReviewQuestion[];
  nextModuleId: string | null;
  prevModuleId: string | null;
}

export interface ConversionTrigger {
  afterModuleId: string;
  headline: string;
  description: string;
  ctaText: string;
  ctaHref: string;
}

export interface FoundationCapstone {
  id: string;
  title: string;
  description: string;
  options: string[];
  deliverables: string[];
  assessmentCriteria: string[];
}

export const FOUNDATION_MODULES: FoundationModule[] = [
  // ─── Phase 1: Awareness & Direction ──────────────────────────
  {
    id: "FND-M01",
    number: 1,
    title: "The AI Opportunity & Future of Work",
    phase: 1,
    phaseTitle: "Awareness & Direction",
    duration: "1 day",
    objective: "Understand where AI fits globally and locally",
    deliverable: "Short written response or video",
    assessmentMethod: "Completion + reflection",
    prevModuleId: null,
    nextModuleId: "FND-M02",
    content: [
      { type: "heading", text: "AI Is Already Here" },
      { type: "paragraph", text: "Artificial Intelligence is not a future technology — it is embedded in the tools you use every day. When your phone suggests the next word you are typing, when a streaming service recommends a show, when a bank flags a suspicious transaction — that is AI at work. Understanding where AI fits in the world around you is the first step to building a career in this space." },
      { type: "heading", text: "Global AI Landscape" },
      { type: "paragraph", text: "AI is transforming every major industry. Healthcare uses AI for diagnostic imaging and drug discovery. Agriculture deploys AI for crop monitoring and yield prediction. Finance relies on AI for fraud detection and credit scoring. Manufacturing uses AI for quality control and predictive maintenance. The global AI market is growing rapidly, and the demand for AI-literate professionals far exceeds supply." },
      { type: "list", text: ["Healthcare: diagnostic imaging, patient triage, drug discovery", "Agriculture: crop disease detection, precision farming, yield forecasting", "Finance: fraud detection, credit scoring, algorithmic trading", "Education: personalised learning, automated assessment, content generation", "Logistics: route optimisation, demand forecasting, warehouse automation"] },
      { type: "heading", text: "Africa's Unique Position" },
      { type: "paragraph", text: "Africa has the world's youngest population and rapidly growing internet penetration. This creates a unique opportunity to leapfrog traditional technology adoption. AI solutions built for African contexts — multilingual, mobile-first, designed for local infrastructure — can address critical challenges in healthcare, agriculture, financial inclusion, and education. The professionals who build these solutions will shape the continent's future." },
      { type: "keyTakeaway", text: "AI is already embedded in everyday tools and transforming every industry. Africa's young, digitally-growing population is uniquely positioned to lead AI adoption. Understanding the AI landscape is your first step toward an AI career." },
    ],
    practiceTask: {
      instruction: "Identify 3 real AI use cases in your immediate environment (home, school, workplace, or community). For each, describe what the AI does and who benefits from it.",
      inputType: "textarea",
      placeholder: "1. AI use case: ...\n2. AI use case: ...\n3. AI use case: ...",
      example: "Example: My bank app uses AI to detect unusual spending patterns and sends me alerts. This benefits customers by preventing fraud before they notice it.",
    },
    reviewQuestions: [
      {
        question: "Which statement best describes the current state of AI adoption?",
        options: ["AI is only used by large tech companies", "AI is embedded in everyday tools across multiple industries", "AI is still purely theoretical and not deployed anywhere", "AI only works in English-speaking countries"],
        correctIndex: 1,
        explanation: "AI is already embedded in everyday tools — from phone keyboards to banking apps to streaming recommendations — across virtually every industry worldwide.",
      },
      {
        question: "Why is Africa uniquely positioned for AI adoption?",
        options: ["Africa has the oldest population globally", "Africa has the youngest population and rapidly growing internet access", "Africa has already deployed more AI than any other continent", "African governments have banned traditional technology"],
        correctIndex: 1,
        explanation: "Africa's young population and rapidly growing internet penetration create an opportunity to leapfrog traditional technology adoption patterns with AI-first solutions.",
      },
    ],
  },
  {
    id: "FND-M02",
    number: 2,
    title: "Choosing Your AI Career Path",
    phase: 1,
    phaseTitle: "Awareness & Direction",
    duration: "1 day",
    objective: "Choose a track early",
    deliverable: "Track selection",
    assessmentMethod: "Required selection (no skip)",
    prevModuleId: "FND-M01",
    nextModuleId: "FND-M03",
    content: [
      { type: "heading", text: "Four Paths Into AI" },
      { type: "paragraph", text: "KoreField Academy offers four specialised tracks, each leading to a distinct career in AI. You do not need to know everything about each track right now — the goal is to pick the one that excites you most. You can always refine your choice later, but making an early decision helps you focus your learning and see how AI Foundation School concepts connect to your future career." },
      { type: "list", text: ["AI Engineering & Intelligent Systems — Build production AI systems, APIs, and intelligent applications", "Data Science & Decision Intelligence — Analyse data, build models, and drive business decisions with AI", "Cybersecurity & AI Security — Protect AI systems and use AI to defend against threats", "AI Product & Project Leadership — Manage AI products, lead teams, and bridge business and technology"] },
      { type: "heading", text: "How to Choose" },
      { type: "paragraph", text: "Think about what energises you. Do you love building things and writing code? AI Engineering might be your path. Do you enjoy finding patterns in data and solving puzzles? Data Science could be the fit. Are you passionate about security and protecting systems? Cybersecurity awaits. Do you prefer leading teams and shaping products? AI Product Leadership is calling." },
      { type: "callout", text: "There is no wrong choice. Every track leads to a high-demand career. The best track is the one that aligns with your interests and strengths. You will have a chance to confirm or change your selection at the end of AI Foundation School." },
      { type: "heading", text: "What Happens After You Choose" },
      { type: "paragraph", text: "Once you select a track, the rest of AI Foundation School will occasionally reference your chosen path — showing you how concepts apply to your specific career direction. After completing AI Foundation School and the capstone project, you will enroll in your chosen Track Pathway (Beginner → Intermediate → Advanced) to build deep expertise." },
      { type: "keyTakeaway", text: "Choose the track that excites you most — AI Engineering, Data Science, Cybersecurity, or AI Product Leadership. Early selection helps you focus. You can confirm or adjust at the end of AI Foundation School." },
    ],
    practiceTask: {
      instruction: "Match your personal interests and strengths to one of the four KoreField tracks. Write a short paragraph explaining why this track appeals to you.",
      inputType: "textarea",
      placeholder: "I chose [track name] because...",
      example: "Example: I chose AI Engineering & Intelligent Systems because I enjoy building things and I want to learn how to create AI-powered applications that solve real problems.",
    },
    reviewQuestions: [
      {
        question: "Which track focuses on building production AI systems and APIs?",
        options: ["Data Science & Decision Intelligence", "AI Engineering & Intelligent Systems", "AI Product & Project Leadership", "Cybersecurity & AI Security"],
        correctIndex: 1,
        explanation: "AI Engineering & Intelligent Systems focuses on building production AI systems, APIs, and intelligent applications.",
      },
      {
        question: "When can you change your track selection?",
        options: ["Never — your first choice is final", "At the end of AI Foundation School before enrolling in a Track Pathway", "Only after completing the Advanced level", "You must complete all four tracks"],
        correctIndex: 1,
        explanation: "You can confirm or adjust your track selection at the end of AI Foundation School (Module 12) before enrolling in your paid Track Pathway.",
      },
    ],
  },
  // ─── Phase 2: Quick Wins & Confidence ────────────────────────
  {
    id: "FND-M03",
    number: 3,
    title: "Prompting That Actually Works",
    phase: 2,
    phaseTitle: "Quick Wins & Confidence",
    duration: "1-2 days",
    objective: "Teach effective prompting",
    deliverable: "Before/after outputs",
    assessmentMethod: "Output quality check",
    prevModuleId: "FND-M02",
    nextModuleId: "FND-M04",
    content: [
      { type: "heading", text: "Why Most Prompts Fail" },
      { type: "paragraph", text: "Most people write prompts the way they would text a friend — vague, incomplete, and missing context. AI models are powerful but literal. They respond to exactly what you give them. A prompt like 'tell me about marketing' will produce a generic essay. A prompt like 'List 5 low-budget digital marketing strategies for a small bakery in Lagos targeting young professionals' will produce something you can actually use." },
      { type: "heading", text: "The Anatomy of a Good Prompt" },
      { type: "list", text: ["Context: who you are and what situation you are in", "Task: exactly what you want the AI to do", "Format: how you want the output structured (list, table, paragraph, code)", "Constraints: length limits, tone, audience, what to include or avoid", "Examples: show the AI what good output looks like (few-shot prompting)"] },
      { type: "heading", text: "Before and After" },
      { type: "paragraph", text: "Bad prompt: 'Write about climate change.' Good prompt: 'Write a 200-word summary of how climate change affects smallholder farmers in East Africa. Use simple language suitable for a community newsletter. Include one actionable recommendation.' The difference is specificity. The good prompt tells the AI exactly what to produce, for whom, and how long it should be." },
      { type: "callout", text: "Prompting is a skill, not a talent. The more you practice writing specific, structured prompts, the better your AI outputs will be. Treat every prompt as a brief for a skilled assistant." },
      { type: "keyTakeaway", text: "Good prompts are specific, structured, and include context, task, format, and constraints. Vague prompts produce vague results. Practice transforms prompting from guesswork into a reliable professional skill." },
    ],
    practiceTask: {
      instruction: "Take this bad prompt and improve it: 'Write something about health.' Rewrite it as a specific, structured prompt with context, task, format, and constraints. Then compare the outputs.",
      inputType: "textarea",
      placeholder: "Bad prompt: 'Write something about health.'\n\nMy improved prompt:\n...\n\nWhy this is better:\n...",
      example: "Example improved prompt: 'Write a 150-word guide on 3 daily habits that improve mental health for university students. Use a friendly, encouraging tone. Format as a numbered list with one sentence of explanation per habit.'",
    },
    reviewQuestions: [
      {
        question: "What is the most important difference between a bad prompt and a good prompt?",
        options: ["Good prompts are longer", "Good prompts are specific and include context, task, format, and constraints", "Good prompts use technical jargon", "Good prompts always include code examples"],
        correctIndex: 1,
        explanation: "The key difference is specificity. Good prompts include context, a clear task, desired format, and constraints — giving the AI everything it needs to produce useful output.",
      },
      {
        question: "Which prompt would produce the most useful output?",
        options: ["'Tell me about business'", "'Write a 200-word email to a client explaining a project delay, using a professional but empathetic tone'", "'Business email please'", "'Write something professional'"],
        correctIndex: 1,
        explanation: "The second prompt specifies the task (email), context (project delay), audience (client), format (200 words), and tone (professional but empathetic) — all elements of an effective prompt.",
      },
    ],
  },
  {
    id: "FND-M04",
    number: 4,
    title: "AI Productivity & Workflow Automation",
    phase: 2,
    phaseTitle: "Quick Wins & Confidence",
    duration: "1-2 days",
    objective: "Show real-life usefulness of AI",
    deliverable: "Output (doc, summary, etc.)",
    assessmentMethod: "Practical task validation",
    prevModuleId: "FND-M03",
    nextModuleId: "FND-M05",
    content: [
      { type: "heading", text: "AI as Your Productivity Partner" },
      { type: "paragraph", text: "AI is not just for data scientists and engineers — it is a productivity tool for everyone. You can use AI to draft emails, summarise long documents, create meeting agendas, generate study notes, translate content, and automate repetitive writing tasks. The key is knowing when AI saves time and when it does not." },
      { type: "heading", text: "Real Productivity Use Cases" },
      { type: "list", text: ["Summarise a 20-page report into key bullet points in 30 seconds", "Draft a professional email from rough notes", "Convert meeting notes into structured action items", "Generate a study guide from lecture content", "Translate a document while preserving tone and context", "Create a first draft of a proposal or business plan"] },
      { type: "heading", text: "When AI Helps vs When It Doesn't" },
      { type: "paragraph", text: "AI excels at first drafts, summaries, reformatting, and brainstorming. It struggles with tasks requiring deep domain expertise, nuanced judgment, or access to private/current information. The best workflow: let AI handle the 80% (drafting, structuring, formatting) and spend your time on the 20% that requires human judgment (reviewing, refining, deciding)." },
      { type: "callout", text: "The goal is not to let AI do your work — it is to let AI handle the tedious parts so you can focus on the parts that matter. Always review AI output before using it." },
      { type: "keyTakeaway", text: "AI is a powerful productivity tool for drafting, summarising, and automating repetitive tasks. Use the 80/20 rule: let AI handle the bulk work, then apply your judgment to refine the output." },
    ],
    practiceTask: {
      instruction: "Use AI to complete a real task: summarise a document, draft an email, create a study guide, or generate a meeting agenda. Submit the AI output along with a brief note on what you would change or improve.",
      inputType: "textarea",
      placeholder: "Task I completed with AI:\n...\n\nAI output:\n...\n\nWhat I would change/improve:\n...",
    },
    reviewQuestions: [
      {
        question: "What is the recommended 80/20 approach to using AI for productivity?",
        options: ["Use AI for 80% of decisions and humans for 20%", "Let AI handle drafting and structuring, then apply human judgment to refine", "Spend 80% of time prompting and 20% reviewing", "Only use AI for 20% of your work"],
        correctIndex: 1,
        explanation: "The 80/20 approach means letting AI handle the bulk work (drafting, structuring, formatting) and spending your time on the parts that require human judgment (reviewing, refining, deciding).",
      },
      {
        question: "Which task is AI LEAST suited for?",
        options: ["Summarising a long document", "Making a nuanced ethical judgment about a specific situation", "Drafting a professional email", "Converting notes into action items"],
        correctIndex: 1,
        explanation: "AI struggles with tasks requiring nuanced judgment, deep domain expertise, or ethical reasoning about specific situations. These require human understanding and context.",
      },
    ],
  },
  {
    id: "FND-M05",
    number: 5,
    title: "Thinking With AI (Fixing Outputs)",
    phase: 2,
    phaseTitle: "Quick Wins & Confidence",
    duration: "1 day",
    objective: "Teach debugging mindset",
    deliverable: "Improved output",
    assessmentMethod: "Reasoning explanation",
    prevModuleId: "FND-M04",
    nextModuleId: "FND-M06",
    content: [
      { type: "heading", text: "AI Gets Things Wrong — And That's Normal" },
      { type: "paragraph", text: "AI models produce incorrect, incomplete, or misleading outputs regularly. This is not a bug — it is a fundamental characteristic of how language models work. They generate text based on statistical patterns, not factual verification. The skill that separates effective AI users from everyone else is the ability to identify problems in AI output and fix them systematically." },
      { type: "heading", text: "Common AI Output Problems" },
      { type: "list", text: ["Hallucination: confident statements that are factually wrong", "Vagueness: generic responses that lack specific, actionable detail", "Wrong format: output that does not match what you asked for", "Missing context: AI ignores important constraints from your prompt", "Outdated information: AI training data has a cutoff date"] },
      { type: "heading", text: "The Fix-It Framework" },
      { type: "paragraph", text: "When AI output is wrong, do not start over. Debug it. Step 1: Identify what is wrong (factual error, wrong format, missing detail). Step 2: Determine why (vague prompt, missing context, task too complex). Step 3: Fix the prompt (add specificity, provide examples, break into smaller steps). Step 4: Regenerate and compare. This iterative approach is faster and more effective than rewriting from scratch." },
      { type: "callout", text: "Debugging AI output is the same mindset as debugging code. Identify the symptom, trace the cause, apply the fix, and verify the result. This is a core professional skill for anyone working with AI." },
      { type: "keyTakeaway", text: "AI outputs are often imperfect. The professional skill is identifying what went wrong and fixing it systematically — not starting over. Use the Fix-It Framework: identify, diagnose, fix the prompt, regenerate, and compare." },
    ],
    practiceTask: {
      instruction: "Take this incorrect AI response and fix it step by step. AI was asked: 'What are the benefits of exercise?' and responded: 'Exercise is good for you. It helps with many things. You should exercise regularly.' Identify what is wrong, improve the prompt, and show the improved output.",
      inputType: "textarea",
      placeholder: "What's wrong with the AI output:\n...\n\nWhy it went wrong:\n...\n\nMy improved prompt:\n...\n\nExpected improved output:\n...",
      example: "The output is vague and generic — no specific benefits, no actionable advice. The original prompt lacked specificity. Improved prompt: 'List 5 specific physical and mental health benefits of 30 minutes of daily exercise, with one sentence of scientific explanation for each.'",
    },
    reviewQuestions: [
      {
        question: "What is the first step in the Fix-It Framework for AI outputs?",
        options: ["Delete the output and start over", "Identify what is wrong with the output", "Switch to a different AI model", "Add more text to the original prompt"],
        correctIndex: 1,
        explanation: "The first step is to identify what is wrong — is it a factual error, wrong format, missing detail, or vagueness? Diagnosis before action leads to better fixes.",
      },
      {
        question: "What is a hallucination in AI output?",
        options: ["When the AI refuses to answer", "When the AI produces confident statements that are factually wrong", "When the AI generates images instead of text", "When the AI takes too long to respond"],
        correctIndex: 1,
        explanation: "Hallucination occurs when an AI model produces confident-sounding content that is factually incorrect, because it generates based on statistical patterns rather than verified facts.",
      },
    ],
  },
  // ─── Phase 3: Build Your First AI System ─────────────────────
  {
    id: "FND-M06",
    number: 6,
    title: "Introduction to AI Agents",
    phase: 3,
    phaseTitle: "Build Your First AI System",
    duration: "1 day",
    objective: "Understand agent systems",
    deliverable: "Workflow diagram",
    assessmentMethod: "Concept clarity check",
    prevModuleId: "FND-M05",
    nextModuleId: "FND-M07",
    content: [
      { type: "heading", text: "What Is an AI Agent?" },
      { type: "paragraph", text: "An AI agent is a system that takes a goal, breaks it into steps, and executes those steps using AI capabilities. Unlike a simple chatbot that responds to one message at a time, an agent can plan, use tools, access data, and make decisions across multiple steps. Think of it as the difference between asking someone a question and hiring someone to complete a project." },
      { type: "heading", text: "How Agents Work" },
      { type: "list", text: ["Input: the agent receives a goal or task from the user", "Planning: the agent breaks the goal into smaller steps", "Tool use: the agent calls APIs, searches databases, or runs code to complete each step", "Memory: the agent remembers context from previous steps", "Output: the agent delivers the final result back to the user"] },
      { type: "heading", text: "Agent vs Chatbot" },
      { type: "paragraph", text: "A chatbot answers questions. An agent completes tasks. A chatbot says 'The weather in Lagos is 32°C.' An agent books your flight, checks the weather at your destination, suggests what to pack, and adds the trip to your calendar. Agents are the next evolution of AI — from answering to doing." },
      { type: "callout", text: "You do not need to be a programmer to understand agents. In the next module, you will build a simple one yourself. Understanding the concept now will make the building process much smoother." },
      { type: "keyTakeaway", text: "AI agents go beyond chatbots — they plan, use tools, and complete multi-step tasks. Understanding agent architecture (input → plan → tools → memory → output) is essential for building real AI systems." },
    ],
    practiceTask: {
      instruction: "Map a simple AI agent workflow for a task you do regularly. Draw or describe the steps: What is the input? What does the agent plan? What tools does it use? What is the final output?",
      inputType: "textarea",
      placeholder: "My agent task: ...\n\nInput: ...\nPlanning steps: ...\nTools needed: ...\nFinal output: ...",
      example: "Example: An AI agent that helps me prepare for meetings. Input: meeting agenda + attendee list. Planning: summarise each attendee's recent work, identify discussion points, draft talking points. Tools: email search, calendar, document summariser. Output: a one-page meeting prep brief.",
    },
    reviewQuestions: [
      {
        question: "What is the key difference between a chatbot and an AI agent?",
        options: ["Agents are faster than chatbots", "Agents can plan and complete multi-step tasks using tools, while chatbots answer individual questions", "Chatbots are more accurate than agents", "There is no difference"],
        correctIndex: 1,
        explanation: "The key difference is that agents can plan, use tools, maintain memory, and complete multi-step tasks — while chatbots respond to individual messages without persistent task execution.",
      },
      {
        question: "Which of these is a component of an AI agent's workflow?",
        options: ["Random output generation", "Planning — breaking a goal into smaller steps", "Ignoring user input", "Deleting previous context"],
        correctIndex: 1,
        explanation: "Planning is a core component of agent workflows. The agent receives input, plans steps, uses tools, maintains memory, and delivers output.",
      },
    ],
  },
  {
    id: "FND-M07",
    number: 7,
    title: "Build Your First AI Assistant",
    phase: 3,
    phaseTitle: "Build Your First AI System",
    duration: "2-3 days",
    objective: "Build something real",
    deliverable: "Working AI workflow",
    assessmentMethod: "Functional test",
    prevModuleId: "FND-M06",
    nextModuleId: "FND-M08",
    content: [
      { type: "heading", text: "From Concept to Creation" },
      { type: "paragraph", text: "In this module, you will build a simple AI assistant that solves a real problem. This is not a toy exercise — you will define a problem, design prompts, test outputs, and iterate until your assistant produces reliable, useful results. By the end, you will have a working AI workflow you can demonstrate and explain." },
      { type: "heading", text: "Step 1: Define the Problem" },
      { type: "paragraph", text: "Every good AI system starts with a clear problem statement. What task do you want your assistant to handle? Who is the user? What does a good output look like? Be specific. 'Help with studying' is too vague. 'Summarise textbook chapters into flashcard-style Q&A pairs for exam revision' is a buildable problem." },
      { type: "heading", text: "Step 2: Design Your Prompts" },
      { type: "list", text: ["System prompt: define the assistant's role, expertise, and behaviour rules", "User prompt template: structure how user input is formatted for the AI", "Output format: specify exactly how the assistant should respond", "Error handling: what should the assistant do when input is unclear or outside scope?"] },
      { type: "heading", text: "Step 3: Test and Iterate" },
      { type: "paragraph", text: "Run your assistant with real inputs. Does it produce useful output? Is the format consistent? Does it handle edge cases? Test at least 5 different inputs and note where the output breaks down. Then refine your prompts based on what you learn. This test-and-iterate cycle is how professional AI systems are built." },
      { type: "keyTakeaway", text: "Building an AI assistant follows a clear process: define the problem, design prompts (system + user + output format), test with real inputs, and iterate. The quality comes from the iteration, not the first attempt." },
    ],
    practiceTask: {
      instruction: "Build a simple AI assistant. Define the problem it solves, write the system prompt and user prompt template, test it with 3 different inputs, and submit the results.",
      inputType: "textarea",
      placeholder: "Problem my assistant solves: ...\n\nSystem prompt: ...\n\nUser prompt template: ...\n\nTest input 1 + output: ...\nTest input 2 + output: ...\nTest input 3 + output: ...",
      example: "Example: Study flashcard generator. System prompt: 'You are a study assistant. Convert textbook content into Q&A flashcards. Each flashcard has a clear question and a concise answer (max 2 sentences).' User template: 'Create flashcards from this content: [paste text]'",
    },
    reviewQuestions: [
      {
        question: "What is the first step in building an AI assistant?",
        options: ["Write the code immediately", "Define a clear, specific problem statement", "Choose the most expensive AI model", "Copy someone else's prompts"],
        correctIndex: 1,
        explanation: "Every good AI system starts with a clear problem statement — what task, who is the user, and what does good output look like. Without this, you cannot design effective prompts.",
      },
      {
        question: "Why is testing with multiple inputs important?",
        options: ["To use up API credits", "To find where the output breaks down so you can refine your prompts", "To prove the AI is perfect", "Testing is not important for AI assistants"],
        correctIndex: 1,
        explanation: "Testing with multiple inputs reveals edge cases and failure modes. This information drives prompt refinement, which is how professional AI systems achieve reliability.",
      },
    ],
  },
  {
    id: "FND-M08",
    number: 8,
    title: "Improve Your AI System",
    phase: 3,
    phaseTitle: "Build Your First AI System",
    duration: "1-2 days",
    objective: "Improve quality & reliability",
    deliverable: "Improved version",
    assessmentMethod: "Comparison check",
    prevModuleId: "FND-M07",
    nextModuleId: "FND-M09",
    content: [
      { type: "heading", text: "Good Enough Is Not Good Enough" },
      { type: "paragraph", text: "Your first version works — but can it be better? Professional AI systems go through multiple rounds of improvement. In this module, you will take the assistant you built in Module 7 and systematically improve its quality, consistency, and reliability. The goal is to move from 'it works sometimes' to 'it works reliably.'" },
      { type: "heading", text: "Improvement Strategies" },
      { type: "list", text: ["Add structure: use clear sections, numbered steps, or templates in your prompts", "Add constraints: limit output length, specify tone, define what to avoid", "Add examples: include 1-2 examples of ideal output (few-shot prompting)", "Add error handling: tell the AI what to do when input is unclear or out of scope", "Add chain-of-thought: ask the AI to reason step-by-step before giving the final answer"] },
      { type: "heading", text: "Before vs After Comparison" },
      { type: "paragraph", text: "The best way to measure improvement is side-by-side comparison. Run the same inputs through your original and improved versions. Is the output more specific? More consistent? More useful? Document the differences. This comparison skill is essential — it is how AI teams evaluate prompt changes in production systems." },
      { type: "callout", text: "Improvement is iterative. You will rarely get the perfect prompt on the second try either. Each round of testing and refinement gets you closer. Professional prompt engineers may iterate 10-20 times on critical prompts." },
      { type: "keyTakeaway", text: "Systematic improvement transforms a working prototype into a reliable system. Use structure, constraints, examples, and chain-of-thought to improve quality. Always compare before and after to measure progress." },
    ],
    practiceTask: {
      instruction: "Take the AI assistant you built in Module 7 and improve it. Apply at least 2 improvement strategies (add structure, constraints, examples, or chain-of-thought). Show the before and after comparison.",
      inputType: "textarea",
      placeholder: "Original prompt: ...\n\nImprovement 1 applied: ...\nImprovement 2 applied: ...\n\nImproved prompt: ...\n\nBefore output (same input): ...\nAfter output (same input): ...\n\nWhat improved: ...",
    },
    reviewQuestions: [
      {
        question: "Which is NOT an effective prompt improvement strategy?",
        options: ["Adding few-shot examples", "Adding constraints like output length and tone", "Making the prompt more vague to give AI freedom", "Adding chain-of-thought reasoning"],
        correctIndex: 2,
        explanation: "Making prompts more vague reduces output quality. Effective improvement strategies include adding structure, constraints, examples, and chain-of-thought — all of which increase specificity.",
      },
      {
        question: "How should you measure whether your prompt improvements worked?",
        options: ["Trust your intuition without testing", "Run the same inputs through original and improved versions and compare", "Count how many words the prompt has", "Ask the AI if it thinks the prompt is better"],
        correctIndex: 1,
        explanation: "Side-by-side comparison with the same inputs is the most reliable way to measure improvement. This is how professional AI teams evaluate prompt changes.",
      },
    ],
  },
  // ─── Phase 4: Conversion & Direction ─────────────────────────
  {
    id: "FND-M09",
    number: 9,
    title: "How AI Systems Work (Simplified)",
    phase: 4,
    phaseTitle: "Conversion & Direction",
    duration: "1 day",
    objective: "Understand system flow",
    deliverable: "Diagram or explanation",
    assessmentMethod: "Concept check",
    prevModuleId: "FND-M08",
    nextModuleId: "FND-M10",
    content: [
      { type: "heading", text: "Behind the Scenes of AI" },
      { type: "paragraph", text: "You have been using AI — now let's understand how it works at a high level. AI systems are not magic. They follow a clear flow: data comes in, gets processed by a model, and an output comes out. Understanding this flow helps you design better systems, debug problems, and communicate with technical teams." },
      { type: "heading", text: "The AI System Flow" },
      { type: "list", text: ["Input layer: user provides text, image, data, or voice", "Pre-processing: input is cleaned, formatted, and tokenised for the model", "Model: a trained neural network processes the input and generates a response", "Post-processing: the raw model output is formatted, filtered, and validated", "Output layer: the final result is delivered to the user or downstream system"] },
      { type: "heading", text: "Key Concepts Simplified" },
      { type: "paragraph", text: "Models learn patterns from training data — they do not memorise facts. Tokens are the units models work with (roughly 4 characters per token in English). Context windows define how much text a model can process at once. APIs are how applications send requests to AI models and receive responses. These concepts will become second nature as you progress through your chosen track." },
      { type: "callout", text: "You do not need to understand the mathematics behind neural networks to work effectively with AI. But understanding the system flow — input, processing, output — helps you diagnose problems and design better solutions." },
      { type: "keyTakeaway", text: "AI systems follow a clear flow: input → pre-processing → model → post-processing → output. Understanding this architecture helps you build better systems and debug problems effectively." },
    ],
    practiceTask: {
      instruction: "Map a simple AI system flow for an application you use (e.g., a chatbot, recommendation engine, or translation tool). Describe each stage: input, processing, and output.",
      inputType: "textarea",
      placeholder: "AI application I chose: ...\n\nInput: what the user provides\nPre-processing: how input is prepared\nModel: what the AI does with it\nPost-processing: how output is refined\nOutput: what the user receives",
      example: "Example: Google Translate. Input: user types a sentence in English. Pre-processing: text is tokenised and language is detected. Model: neural translation model converts tokens to target language. Post-processing: output is reassembled into natural-sounding text. Output: translated sentence displayed to user.",
    },
    reviewQuestions: [
      {
        question: "What is the correct order of an AI system flow?",
        options: ["Output → Model → Input", "Input → Pre-processing → Model → Post-processing → Output", "Model → Input → Output → Pre-processing", "Pre-processing → Output → Input → Model"],
        correctIndex: 1,
        explanation: "The standard AI system flow is: Input → Pre-processing → Model → Post-processing → Output. Understanding this flow is essential for designing and debugging AI systems.",
      },
      {
        question: "What is a token in the context of AI models?",
        options: ["A security credential for API access", "The unit of text that models process (roughly 4 characters in English)", "A type of cryptocurrency", "A visual element in the user interface"],
        correctIndex: 1,
        explanation: "Tokens are the units that AI models work with — roughly 4 characters per token in English. Models process and generate text as sequences of tokens.",
      },
    ],
  },
  {
    id: "FND-M10",
    number: 10,
    title: "Real-World AI Applications",
    phase: 4,
    phaseTitle: "Conversion & Direction",
    duration: "1 day",
    objective: "Show real industry usage",
    deliverable: "Use-case write-up",
    assessmentMethod: "Relevance check",
    prevModuleId: "FND-M09",
    nextModuleId: "FND-M11",
    content: [
      { type: "heading", text: "AI in the Real World" },
      { type: "paragraph", text: "AI is not just a technology demo — it is solving real problems in real industries right now. In this module, you will explore how AI is applied in the industry connected to your chosen track. Understanding real-world applications helps you see where your skills will be needed and what kind of problems you will solve as a professional." },
      { type: "heading", text: "AI Applications by Track" },
      { type: "list", text: ["AI Engineering: building recommendation engines, deploying chatbots at scale, creating intelligent search systems, automating document processing", "Data Science: predicting customer churn, optimising supply chains, detecting anomalies in financial data, building forecasting models", "Cybersecurity: detecting network intrusions with AI, identifying phishing attempts, automated vulnerability scanning, threat intelligence analysis", "AI Product Leadership: managing AI product roadmaps, defining AI feature requirements, measuring AI product impact, stakeholder communication"] },
      { type: "heading", text: "From Use Case to Career" },
      { type: "paragraph", text: "Every real-world AI application represents a job someone is paid to build, maintain, or manage. When you identify a use case that excites you, you are identifying a potential career direction. The Track Pathways at KoreField Academy are designed to give you the skills to work on exactly these kinds of applications." },
      { type: "callout", text: "The best AI professionals are not just technically skilled — they understand the domain they work in. A data scientist in healthcare needs to understand patient data. An AI engineer in finance needs to understand transaction systems. Domain knowledge multiplies your AI skills." },
      { type: "keyTakeaway", text: "AI is solving real problems across every industry. Understanding real-world applications in your chosen track helps you see where your skills will be needed. Domain knowledge combined with AI skills is the most powerful career combination." },
    ],
    practiceTask: {
      instruction: "Identify one real-world AI use case in your chosen track's industry. Describe the problem it solves, how AI is used, and why it matters. Explain how this connects to the track you selected.",
      inputType: "textarea",
      placeholder: "My chosen track: ...\n\nAI use case: ...\nProblem it solves: ...\nHow AI is used: ...\nWhy it matters: ...\nHow this connects to my track: ...",
    },
    reviewQuestions: [
      {
        question: "Why is domain knowledge important for AI professionals?",
        options: ["It is not important — only technical skills matter", "Domain knowledge multiplies AI skills by helping you understand the problems you are solving", "Domain knowledge replaces the need for AI skills", "It is only important for managers, not technical roles"],
        correctIndex: 1,
        explanation: "Domain knowledge combined with AI skills is the most powerful career combination. Understanding the industry you work in helps you build more relevant and effective AI solutions.",
      },
      {
        question: "What does every real-world AI application represent in career terms?",
        options: ["A theoretical research paper", "A job someone is paid to build, maintain, or manage", "A hobby project with no commercial value", "An automated system that needs no human involvement"],
        correctIndex: 1,
        explanation: "Every real-world AI application represents a professional role — someone is paid to build, maintain, manage, or improve it. Identifying exciting use cases helps you find your career direction.",
      },
    ],
  },
  {
    id: "FND-M11",
    number: 11,
    title: "Pod-Based Learning & Collaboration",
    phase: 4,
    phaseTitle: "Conversion & Direction",
    duration: "1 day",
    objective: "Prepare for teamwork",
    deliverable: "Team response",
    assessmentMethod: "Participation",
    prevModuleId: "FND-M10",
    nextModuleId: "FND-M12",
    content: [
      { type: "heading", text: "Why Pods?" },
      { type: "paragraph", text: "In the real world, AI systems are built by teams — not individuals. KoreField Academy uses a pod-based learning model that mirrors real-world delivery teams. Each pod is a small, multidisciplinary group where members take on different roles: project manager, data scientist, AI engineer, security specialist. This prepares you for how AI work actually happens in industry." },
      { type: "heading", text: "How Pods Work at KoreField" },
      { type: "list", text: ["Pods are assigned when you enter a Track Pathway (after AI Foundation School)", "Each pod has 4-6 members with complementary skills and track specialisations", "Pods collaborate on projects, peer reviews, and the final capstone", "An Assessor supervises each pod — providing feedback, coaching, and evaluation", "Pod performance contributes to your overall assessment alongside individual work"] },
      { type: "heading", text: "Collaboration Skills That Matter" },
      { type: "paragraph", text: "Technical skills get you hired. Collaboration skills get you promoted. In AI teams, you need to communicate complex ideas clearly, give and receive constructive feedback, manage shared work without stepping on each other's contributions, and resolve disagreements professionally. These skills are as important as your technical abilities." },
      { type: "callout", text: "The capstone project at the end of each Track Pathway is a pod deliverable — your team builds and defends a real AI system together. Starting to practice collaboration now gives you a significant advantage." },
      { type: "keyTakeaway", text: "AI systems are built by teams. Pod-based learning at KoreField mirrors real-world delivery teams. Collaboration skills — communication, feedback, shared work management — are as important as technical skills." },
    ],
    practiceTask: {
      instruction: "Simulate a mini team task: describe how you would divide an AI project among 4 team members with different roles (PM, Data Scientist, AI Engineer, Security). What does each person do? How do they collaborate?",
      inputType: "textarea",
      placeholder: "AI project: ...\n\nRole 1 (PM): responsible for...\nRole 2 (Data Scientist): responsible for...\nRole 3 (AI Engineer): responsible for...\nRole 4 (Security): responsible for...\n\nHow they collaborate: ...",
      example: "Example project: Build a customer support chatbot. PM: defines requirements, manages timeline, coordinates with stakeholders. Data Scientist: analyses support ticket data, identifies common questions. AI Engineer: builds the chatbot system, designs prompts, deploys. Security: reviews data handling, ensures privacy compliance.",
    },
    reviewQuestions: [
      {
        question: "Why does KoreField use pod-based learning?",
        options: ["To reduce the number of instructors needed", "To mirror real-world AI delivery teams where systems are built collaboratively", "To make learning more difficult", "Because individual learning does not work"],
        correctIndex: 1,
        explanation: "Pod-based learning mirrors how AI work happens in industry — multidisciplinary teams collaborating on projects. This prepares learners for real-world professional environments.",
      },
      {
        question: "What role does an Assessor play in a pod?",
        options: ["They build the AI system for the pod", "They provide feedback, coaching, and evaluation", "They only grade the final exam", "They have no interaction with pods"],
        correctIndex: 1,
        explanation: "Assessors supervise pods by providing feedback, coaching, and evaluation — acting as performance reviewers and professional mentors throughout the learning journey.",
      },
    ],
  },
  {
    id: "FND-M12",
    number: 12,
    title: "Track Selection & Next Steps",
    phase: 4,
    phaseTitle: "Conversion & Direction",
    duration: "1 day",
    objective: "Drive conversion",
    deliverable: "Final decision",
    assessmentMethod: "Required action",
    prevModuleId: "FND-M11",
    nextModuleId: null,
    content: [
      { type: "heading", text: "You've Come a Long Way" },
      { type: "paragraph", text: "Over the past modules, you have learned what AI is, how to use it effectively, how to build a simple AI assistant, and how AI is applied in the real world. You have developed prompting skills, a debugging mindset, and an understanding of AI systems. Now it is time to commit to your path and take the next step." },
      { type: "heading", text: "Confirm Your Track" },
      { type: "paragraph", text: "In Module 2, you made an initial track selection. Now, with everything you have learned, confirm or change your choice. Consider: which modules excited you most? Which practice tasks felt most natural? Where do you see yourself working in 2 years? Your track determines your learning path for the next several months — choose the one that aligns with your passion and career goals." },
      { type: "list", text: ["AI Engineering & Intelligent Systems — for builders who want to create production AI applications", "Data Science & Decision Intelligence — for analysts who want to turn data into decisions", "Cybersecurity & AI Security — for defenders who want to protect AI systems and use AI for security", "AI Product & Project Leadership — for leaders who want to manage AI products and teams"] },
      { type: "heading", text: "What Happens Next" },
      { type: "paragraph", text: "After confirming your track and completing the Foundation Capstone project, you will enroll in your chosen Track Pathway. The pathway has three levels — Beginner, Intermediate, and Advanced — each with modules, labs, assessments, and performance gates. You will be assigned to a pod, work with an Assessor, and build toward a capstone defense for certification." },
      { type: "callout", text: "This is not the end — it is the beginning. AI Foundation School gave you the fundamentals. Your Track Pathway will give you the depth. The combination of both is what makes KoreField graduates industry-ready." },
      { type: "keyTakeaway", text: "Confirm your track selection based on what excited you most during AI Foundation School. Your Track Pathway (Beginner → Intermediate → Advanced) builds deep expertise. AI Foundation School was the beginning — your real journey starts now." },
    ],
    practiceTask: {
      instruction: "Confirm your track selection and write a short learning goal. What track are you choosing? Why? What do you want to be able to do after completing the full pathway?",
      inputType: "textarea",
      placeholder: "My confirmed track: ...\n\nWhy I chose this track: ...\n\nMy learning goal (what I want to be able to do after completing the pathway): ...",
    },
    reviewQuestions: [
      {
        question: "What are the three levels in a Track Pathway?",
        options: ["Easy, Medium, Hard", "Beginner, Intermediate, Advanced", "Bronze, Silver, Gold", "Foundation, Core, Expert"],
        correctIndex: 1,
        explanation: "Each Track Pathway has three levels: Beginner → Intermediate → Advanced, each with modules, labs, assessments, and performance gates.",
      },
      {
        question: "What is required to earn certification at KoreField Academy?",
        options: ["Only completing the AI Foundation School", "Completing the Track Pathway and defending a capstone project", "Paying the full tuition fee", "Watching all video lessons"],
        correctIndex: 1,
        explanation: "Certification requires completing the full Track Pathway (Beginner → Intermediate → Advanced) and successfully defending a capstone project before a panel.",
      },
    ],
  },
];

export const CONVERSION_TRIGGERS: ConversionTrigger[] = [
  {
    afterModuleId: "FND-M05",
    headline: "You've learned how to use AI — now learn to build real systems",
    description: "You can prompt, debug, and automate with AI. The next step is learning to build production AI systems that solve real-world problems.",
    ctaText: "Preview Track Pathways",
    ctaHref: "/learner/tracks",
  },
  {
    afterModuleId: "FND-M08",
    headline: "You just built your first AI assistant — imagine building production systems",
    description: "You designed, built, and improved an AI assistant from scratch. In your Track Pathway, you will build enterprise-grade AI systems with real users.",
    ctaText: "Explore Your Track",
    ctaHref: "/learner/tracks",
  },
  {
    afterModuleId: "FND-M12",
    headline: "Ready to become an AI Engineer / Data Scientist / Security Specialist / AI Leader?",
    description: "AI Foundation School is complete. Your Track Pathway awaits — Beginner → Intermediate → Advanced, with pods, assessors, and a capstone defense.",
    ctaText: "Enroll in Your Track",
    ctaHref: "/learner/tracks",
  },
];

export const FOUNDATION_CAPSTONE: FoundationCapstone = {
  id: "FND-CAP",
  title: "Foundation Mini Project",
  description: "Build a simple AI assistant that solves a real problem. Choose one of the options below, design your prompts, test with real inputs, iterate to improve, and explain your approach.",
  options: [
    "Study assistant — helps with exam revision, flashcards, or concept explanations",
    "Research assistant — summarises articles, extracts key points, or compares sources",
    "Content generator — creates social media posts, blog drafts, or marketing copy",
    "Personal productivity tool — manages tasks, drafts emails, or organises notes",
  ],
  deliverables: [
    "Problem definition — what problem does your assistant solve and for whom?",
    "Prompt design — system prompt, user prompt template, and output format",
    "Output samples — at least 3 test inputs with their outputs",
    "Improvement iteration — before/after comparison showing at least 2 improvements",
    "Short explanation — 200-word explanation of your design decisions and what you learned",
  ],
  assessmentCriteria: [
    "Does it work? — the assistant produces useful, relevant output for the defined problem",
    "Is it useful? — a real person would benefit from using this assistant",
    "Can the student explain it? — the student can articulate their design decisions and improvement process",
  ],
};
