/** @file ai-engineering-content.ts — Lesson content for the AI Engineering track (Beginner level). */

import type { ContentSection, ReviewQuestion } from "./foundation-content";

export type LessonType = "video_text" | "coding_lab" | "mcq" | "drag_drop";

export interface McqQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface DragDropPair {
  term: string;
  definition: string;
}

export interface TrackLesson {
  id: string;
  moduleId: string;
  moduleName: string;
  trackName: string;
  levelTier: string;
  title: string;
  lessonType: LessonType;
  duration: string;
  objectives: string[];
  content: ContentSection[];
  reviewQuestions: ReviewQuestion[];
  /** coding_lab only */
  starterCode?: string;
  language?: "python" | "sql" | "javascript";
  /** mcq only */
  mcqQuestions?: McqQuestion[];
  /** drag_drop only */
  dragDropPairs?: DragDropPair[];
  /** Practice tab instruction for video_text lessons */
  practicePrompt?: string;
  /** Deliverable description for Apply tab */
  deliverable: string;
  /** Cloudflare Stream video ID (null when video not yet available) */
  video_url?: string | null;
  nextLessonId: string | null;
  prevLessonId: string | null;
}

const TRACK = "AI Engineering and Intelligent Systems";
const LEVEL = "Beginner";

// ─── Module 1: Python for AI (3 lessons) ────────────────────────

const m1: TrackLesson[] = [
  {
    id: "LSN-aie-101",
    moduleId: "MOD-aie-01",
    moduleName: "Python for AI",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Variables, Types, and Data Structures",
    lessonType: "video_text",
    duration: "25 min",
    objectives: ["Declare variables with type hints", "Use lists, dicts, tuples, and sets", "Understand mutability vs immutability"],
    content: [
      { type: "heading", text: "Why Python for AI?" },
      { type: "paragraph", text: "Python is the dominant language in AI and machine learning. Its readable syntax, rich ecosystem (NumPy, Pandas, PyTorch, LangChain), and interactive tooling make it the natural choice for building intelligent systems." },
      { type: "heading", text: "Variables and Type Hints" },
      { type: "paragraph", text: "Python is dynamically typed, but modern Python uses type hints to improve readability and catch errors early. Type hints don't enforce types at runtime — they're documentation that tools like mypy can check." },
      { type: "list", text: ["int, float, str, bool — primitive types", "list[str] — a list of strings", "dict[str, int] — a dictionary mapping strings to integers", "Optional[str] — a string or None"] },
      { type: "heading", text: "Core Data Structures" },
      { type: "paragraph", text: "Lists are ordered and mutable. Dictionaries map keys to values. Tuples are immutable sequences. Sets are unordered collections of unique elements. Choosing the right structure affects both correctness and performance." },
      { type: "callout", text: "AI tip: Most ML frameworks expect data as lists or NumPy arrays. Understanding Python's built-in structures is the foundation for working with tensors, datasets, and model inputs." },
      { type: "keyTakeaway", text: "Python's type hints + core data structures (list, dict, tuple, set) form the building blocks for every AI system you'll build in this track." },
    ],
    reviewQuestions: [
      { question: "Which Python data structure is ordered and mutable?", options: ["tuple", "set", "list", "frozenset"], correctIndex: 2, explanation: "Lists are ordered and mutable — you can add, remove, and reorder elements." },
      { question: "What do type hints do in Python?", options: ["Enforce types at runtime", "Improve readability and enable static analysis", "Make code run faster", "Convert types automatically"], correctIndex: 1, explanation: "Type hints are documentation checked by tools like mypy — they don't enforce types at runtime." },
    ],
    practicePrompt: "Write a short paragraph explaining when you would use a dictionary vs a list in an AI data pipeline. Give a concrete example for each.",
    deliverable: "A written comparison of Python data structures with AI-relevant examples.",
    prevLessonId: null,
    nextLessonId: "LSN-aie-102",
  },
  {
    id: "LSN-aie-102",
    moduleId: "MOD-aie-01",
    moduleName: "Python for AI",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Functions, Loops, and List Comprehensions",
    lessonType: "coding_lab",
    duration: "35 min",
    objectives: ["Write functions with type-annotated parameters", "Use for/while loops effectively", "Apply list comprehensions for data transformation"],
    content: [
      { type: "heading", text: "Functions in Python" },
      { type: "paragraph", text: "Functions are the building blocks of reusable code. In AI engineering, you'll write functions for data preprocessing, feature extraction, model inference, and result formatting. Clean function design makes your code testable and maintainable." },
      { type: "heading", text: "List Comprehensions" },
      { type: "paragraph", text: "List comprehensions are a concise way to create lists from existing iterables. They're faster than equivalent for-loops and are heavily used in data processing pipelines." },
      { type: "callout", text: "In production AI code, list comprehensions are preferred for simple transformations. For complex logic, use regular loops or generator expressions to maintain readability." },
      { type: "keyTakeaway", text: "Functions + list comprehensions are the core patterns for data transformation in AI pipelines." },
    ],
    starterCode: `# Write a function that takes a list of numbers and returns\n# only the even numbers, doubled.\n\ndef double_evens(numbers: list[int]) -> list[int]:\n    # Your code here\n    pass\n\n# Test it\nprint(double_evens([1, 2, 3, 4, 5, 6]))  # Expected: [4, 8, 12]\n`,
    language: "python",
    reviewQuestions: [
      { question: "What does this list comprehension produce: [x*2 for x in range(5) if x > 2]?", options: ["[0, 2, 4, 6, 8]", "[6, 8]", "[4, 6, 8]", "[3, 4]"], correctIndex: 1, explanation: "range(5) gives 0-4. Only 3 and 4 are > 2. Doubled: [6, 8]." },
    ],
    deliverable: "A working Python function that filters and transforms a list using comprehensions.",
    prevLessonId: "LSN-aie-101",
    nextLessonId: "LSN-aie-103",
  },
  {
    id: "LSN-aie-103",
    moduleId: "MOD-aie-01",
    moduleName: "Python for AI",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Python for AI — Module Assessment",
    lessonType: "mcq",
    duration: "15 min",
    objectives: ["Demonstrate understanding of Python fundamentals for AI"],
    content: [
      { type: "heading", text: "Module 1 Assessment" },
      { type: "paragraph", text: "This assessment covers variables, data structures, functions, and list comprehensions. You need 70% to pass the performance gate." },
    ],
    mcqQuestions: [
      { question: "Which type hint represents a function that may return a string or nothing?", options: ["str", "Optional[str]", "Union[str]", "Any"], correctIndex: 1, explanation: "Optional[str] is equivalent to Union[str, None] — the function may return a string or None." },
      { question: "What is the output of list(set([3, 1, 2, 1, 3]))?", options: ["[3, 1, 2, 1, 3]", "[1, 2, 3]", "[3, 1, 2]", "Error"], correctIndex: 2, explanation: "set() removes duplicates. The order may vary, but the result contains {1, 2, 3}. list() converts back." },
      { question: "Which is NOT a valid Python data structure?", options: ["dict", "array", "tuple", "set"], correctIndex: 1, explanation: "Python has no built-in 'array' type. You need to import array from the array module or use numpy.array." },
      { question: "What does def greet(name: str) -> str mean?", options: ["name must be a string at runtime", "The function returns a string (type hint)", "The function converts name to string", "name is optional"], correctIndex: 1, explanation: "-> str is a return type hint indicating the function returns a string. It's not enforced at runtime." },
      { question: "Which loop is best for iterating over dictionary keys and values?", options: ["while loop", "for key in dict", "for key, val in dict.items()", "list comprehension"], correctIndex: 2, explanation: "dict.items() returns key-value pairs, making it the idiomatic way to iterate over both." },
    ],
    reviewQuestions: [],
    deliverable: "Complete the assessment with 70% or higher to pass the performance gate.",
    prevLessonId: "LSN-aie-102",
    nextLessonId: "LSN-aie-201",
  },
];


// ─── Module 2: Data Structures for AI (3 lessons) ───────────────

const m2: TrackLesson[] = [
  {
    id: "LSN-aie-201",
    moduleId: "MOD-aie-02",
    moduleName: "Data Structures for AI",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "NumPy Arrays and Vectorized Operations",
    lessonType: "coding_lab",
    duration: "40 min",
    objectives: ["Create and manipulate NumPy arrays", "Understand broadcasting and vectorization", "Perform element-wise and matrix operations"],
    content: [
      { type: "heading", text: "Why NumPy?" },
      { type: "paragraph", text: "NumPy is the foundation of Python's scientific computing stack. Every ML framework — PyTorch, TensorFlow, Scikit-learn — builds on NumPy arrays. Understanding NumPy is non-negotiable for AI engineering." },
      { type: "heading", text: "Vectorization" },
      { type: "paragraph", text: "Vectorized operations process entire arrays at once instead of looping element by element. This is 10-100x faster than Python loops and is the standard pattern in AI code." },
      { type: "callout", text: "Rule of thumb: if you're writing a for-loop over array elements in AI code, there's probably a NumPy vectorized operation that does it faster." },
      { type: "keyTakeaway", text: "NumPy arrays + vectorized operations are the performance foundation of all AI computation in Python." },
    ],
    starterCode: `import numpy as np\n\n# Create a 3x3 matrix of random integers between 1 and 10\nmatrix = np.random.randint(1, 11, size=(3, 3))\nprint("Matrix:\\n", matrix)\n\n# TODO: Calculate the mean of each row\nrow_means = None  # Your code here\nprint("Row means:", row_means)\n\n# TODO: Normalize the matrix (subtract mean, divide by std)\nnormalized = None  # Your code here\nprint("Normalized:\\n", normalized)\n`,
    language: "python",
    reviewQuestions: [
      { question: "Why is vectorization faster than Python loops?", options: ["It uses less memory", "Operations run in compiled C code on entire arrays", "It skips error checking", "It uses multiple threads"], correctIndex: 1, explanation: "NumPy vectorized operations execute in optimized C code on entire arrays, avoiding Python's per-element overhead." },
    ],
    deliverable: "Working NumPy code that creates, transforms, and normalizes arrays.",
    prevLessonId: "LSN-aie-103",
    nextLessonId: "LSN-aie-202",
  },
  {
    id: "LSN-aie-202",
    moduleId: "MOD-aie-02",
    moduleName: "Data Structures for AI",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Pandas DataFrames for Data Wrangling",
    lessonType: "video_text",
    duration: "30 min",
    objectives: ["Load and inspect DataFrames", "Filter, group, and aggregate data", "Handle missing values"],
    content: [
      { type: "heading", text: "DataFrames: The AI Engineer's Spreadsheet" },
      { type: "paragraph", text: "Pandas DataFrames are tabular data structures that combine the power of SQL with Python's flexibility. In AI engineering, you'll use DataFrames for data loading, cleaning, feature engineering, and exploratory analysis before feeding data into models." },
      { type: "heading", text: "Core Operations" },
      { type: "list", text: ["df.head() / df.describe() — quick inspection", "df[df['col'] > threshold] — boolean filtering", "df.groupby('col').agg({'val': 'mean'}) — aggregation", "df.fillna(0) / df.dropna() — missing value handling"] },
      { type: "heading", text: "Missing Data Strategy" },
      { type: "paragraph", text: "Real-world AI data is messy. Missing values can bias models, crash pipelines, or silently degrade performance. Your strategy — drop, fill with mean/median, or impute — depends on the data and the model." },
      { type: "keyTakeaway", text: "Pandas DataFrames are your primary tool for data preparation. Master filtering, grouping, and missing value handling before moving to model training." },
    ],
    reviewQuestions: [
      { question: "Which Pandas method groups rows and computes aggregate statistics?", options: ["df.filter()", "df.groupby()", "df.merge()", "df.pivot()"], correctIndex: 1, explanation: "groupby() splits data into groups, then you apply aggregate functions like mean, sum, or count." },
      { question: "What's the risk of dropping all rows with missing values?", options: ["It's always safe", "You might lose too much data and introduce bias", "It makes the DataFrame immutable", "It changes column types"], correctIndex: 1, explanation: "Dropping rows with missing values can significantly reduce your dataset and introduce selection bias if missingness isn't random." },
    ],
    practicePrompt: "Describe a real-world scenario where you'd use groupby + aggregation on AI training data. What columns would you group by, and what would you aggregate?",
    deliverable: "A written data wrangling strategy for a hypothetical AI dataset.",
    prevLessonId: "LSN-aie-201",
    nextLessonId: "LSN-aie-203",
  },
  {
    id: "LSN-aie-203",
    moduleId: "MOD-aie-02",
    moduleName: "Data Structures for AI",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Data Structures — Matching Exercise",
    lessonType: "drag_drop",
    duration: "10 min",
    objectives: ["Match data structures to their AI use cases"],
    content: [
      { type: "heading", text: "Match the Data Structure" },
      { type: "paragraph", text: "Drag each data structure to its most common AI engineering use case." },
    ],
    dragDropPairs: [
      { term: "NumPy array", definition: "Storing model weights and performing matrix multiplication" },
      { term: "Pandas DataFrame", definition: "Loading CSV data and computing feature statistics" },
      { term: "Python dict", definition: "Mapping configuration keys to hyperparameter values" },
      { term: "Python set", definition: "Deduplicating a list of unique token IDs" },
      { term: "Python list", definition: "Collecting variable-length sequences of predictions" },
    ],
    reviewQuestions: [],
    deliverable: "Complete the matching exercise with all pairs correctly matched.",
    prevLessonId: "LSN-aie-202",
    nextLessonId: "LSN-aie-301",
  },
];


// ─── Module 3: REST APIs (3 lessons) ────────────────────────────

const m3: TrackLesson[] = [
  {
    id: "LSN-aie-301",
    moduleId: "MOD-aie-03",
    moduleName: "REST APIs and HTTP",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "HTTP Methods, Status Codes, and API Design",
    lessonType: "video_text",
    duration: "25 min",
    objectives: ["Understand REST principles and HTTP methods", "Read and interpret API responses", "Design clean API endpoints"],
    content: [
      { type: "heading", text: "Why APIs Matter for AI Engineers" },
      { type: "paragraph", text: "Every AI model you build will eventually be served through an API. Whether it's a prediction endpoint, a RAG query interface, or a model management dashboard — APIs are how AI systems communicate with the world." },
      { type: "heading", text: "HTTP Methods" },
      { type: "list", text: ["GET — retrieve data (model predictions, status checks)", "POST — create or submit (send input for inference, upload training data)", "PUT — replace entirely (update model configuration)", "PATCH — partial update (adjust a single hyperparameter)", "DELETE — remove (delete a model version)"] },
      { type: "heading", text: "Status Codes" },
      { type: "list", text: ["200 OK — success", "201 Created — resource created", "400 Bad Request — invalid input", "401 Unauthorized — missing/invalid auth", "404 Not Found — resource doesn't exist", "500 Internal Server Error — server-side failure"] },
      { type: "keyTakeaway", text: "REST APIs are the interface between your AI models and the applications that use them. Clean API design makes your models accessible and maintainable." },
    ],
    reviewQuestions: [
      { question: "Which HTTP method should you use to send data for model inference?", options: ["GET", "POST", "PUT", "DELETE"], correctIndex: 1, explanation: "POST is used to submit data for processing — like sending input text to a language model for inference." },
      { question: "What does a 401 status code mean?", options: ["Success", "Not found", "Unauthorized", "Server error"], correctIndex: 2, explanation: "401 means the request lacks valid authentication credentials." },
    ],
    practicePrompt: "Design 3 API endpoints for a sentiment analysis service. Specify the HTTP method, path, request body, and expected response for each.",
    deliverable: "A written API design document for an AI inference service.",
    prevLessonId: "LSN-aie-203",
    nextLessonId: "LSN-aie-302",
  },
  {
    id: "LSN-aie-302",
    moduleId: "MOD-aie-03",
    moduleName: "REST APIs and HTTP",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Building a FastAPI Prediction Endpoint",
    lessonType: "coding_lab",
    duration: "40 min",
    objectives: ["Create a FastAPI app with a prediction endpoint", "Validate request bodies with Pydantic", "Return structured JSON responses"],
    content: [
      { type: "heading", text: "FastAPI for AI Services" },
      { type: "paragraph", text: "FastAPI is the go-to framework for serving AI models in Python. It's fast, has automatic OpenAPI docs, and uses Pydantic for request validation — which catches bad input before it reaches your model." },
      { type: "heading", text: "Pydantic Models" },
      { type: "paragraph", text: "Pydantic models define the shape of your request and response data. They validate input automatically and generate clear error messages when data doesn't match the expected schema." },
      { type: "callout", text: "In production AI services, input validation prevents crashes from malformed data. Always validate before inference." },
      { type: "keyTakeaway", text: "FastAPI + Pydantic gives you type-safe, auto-documented AI endpoints with minimal boilerplate." },
    ],
    starterCode: `from fastapi import FastAPI\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass PredictionRequest(BaseModel):\n    text: str\n    max_tokens: int = 100\n\nclass PredictionResponse(BaseModel):\n    prediction: str\n    confidence: float\n\n# TODO: Create a POST endpoint at /predict\n# that accepts PredictionRequest and returns PredictionResponse\n\n@app.post("/predict", response_model=PredictionResponse)\ndef predict(req: PredictionRequest):\n    # Simulate a prediction\n    pass  # Your code here\n`,
    language: "python",
    reviewQuestions: [
      { question: "What does Pydantic do in a FastAPI application?", options: ["Runs the server", "Validates request/response data", "Connects to the database", "Handles authentication"], correctIndex: 1, explanation: "Pydantic validates that incoming request data matches the expected schema and serializes response data." },
    ],
    deliverable: "A working FastAPI endpoint that accepts input and returns a structured prediction response.",
    prevLessonId: "LSN-aie-301",
    nextLessonId: "LSN-aie-303",
  },
  {
    id: "LSN-aie-303",
    moduleId: "MOD-aie-03",
    moduleName: "REST APIs and HTTP",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "REST APIs — Module Assessment",
    lessonType: "mcq",
    duration: "15 min",
    objectives: ["Demonstrate understanding of REST API concepts and FastAPI"],
    content: [
      { type: "heading", text: "Module 3 Assessment" },
      { type: "paragraph", text: "This assessment covers HTTP methods, status codes, API design, and FastAPI basics." },
    ],
    mcqQuestions: [
      { question: "Which HTTP method is idempotent?", options: ["POST", "GET", "PATCH", "None of these"], correctIndex: 1, explanation: "GET is idempotent — calling it multiple times produces the same result without side effects." },
      { question: "What does FastAPI's response_model parameter do?", options: ["Validates the request body", "Filters and validates the response data", "Sets the HTTP method", "Configures CORS"], correctIndex: 1, explanation: "response_model tells FastAPI to validate and filter the response data according to the Pydantic model." },
      { question: "Which status code indicates a resource was successfully created?", options: ["200", "201", "204", "301"], correctIndex: 1, explanation: "201 Created indicates that a new resource was successfully created." },
    ],
    reviewQuestions: [],
    deliverable: "Complete the assessment with 70% or higher to pass the performance gate.",
    prevLessonId: "LSN-aie-302",
    nextLessonId: "LSN-aie-401",
  },
];


// ─── Module 4: Prompt Engineering (2 lessons) ───────────────────

const m4: TrackLesson[] = [
  {
    id: "LSN-aie-401",
    moduleId: "MOD-aie-04",
    moduleName: "Prompt Engineering",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Prompt Patterns and Chain-of-Thought",
    lessonType: "video_text",
    duration: "30 min",
    objectives: ["Apply zero-shot, few-shot, and chain-of-thought prompting", "Structure prompts for reliable outputs", "Evaluate prompt quality"],
    content: [
      { type: "heading", text: "From User to Engineer" },
      { type: "paragraph", text: "In AI Foundation School you learned prompting as a user. Now you'll learn it as an engineer — designing prompts that are reliable, testable, and production-ready. The difference is repeatability: a good engineering prompt produces consistent results across thousands of inputs." },
      { type: "heading", text: "Core Patterns" },
      { type: "list", text: ["Zero-shot: direct instruction with no examples", "Few-shot: 2-5 examples showing the expected input→output pattern", "Chain-of-thought: 'Think step by step' to improve reasoning", "Structured output: 'Respond in JSON with keys: sentiment, confidence'"] },
      { type: "callout", text: "Production prompts should always specify the output format. Unstructured outputs are hard to parse and break downstream systems." },
      { type: "keyTakeaway", text: "Engineering-grade prompts are structured, testable, and specify exact output formats. They're code, not conversation." },
    ],
    reviewQuestions: [
      { question: "What's the main advantage of few-shot prompting over zero-shot?", options: ["It's faster", "It provides examples that guide the model's output format", "It uses less tokens", "It works with any model"], correctIndex: 1, explanation: "Few-shot examples show the model exactly what format and style you expect, improving consistency." },
    ],
    practicePrompt: "Write a production-ready prompt for a customer support classifier. It should classify tickets into categories (billing, technical, account, other) and return structured JSON with category and confidence.",
    deliverable: "A production-ready prompt template with structured output specification.",
    prevLessonId: "LSN-aie-303",
    nextLessonId: "LSN-aie-402",
  },
  {
    id: "LSN-aie-402",
    moduleId: "MOD-aie-04",
    moduleName: "Prompt Engineering",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Building a Prompt Testing Pipeline",
    lessonType: "coding_lab",
    duration: "35 min",
    objectives: ["Write parameterized prompt templates", "Test prompts against evaluation datasets", "Measure prompt quality metrics"],
    content: [
      { type: "heading", text: "Prompts as Code" },
      { type: "paragraph", text: "In production, prompts are version-controlled, parameterized, and tested — just like any other code. A prompt testing pipeline runs your prompt against a set of known inputs and checks that outputs meet quality criteria." },
      { type: "keyTakeaway", text: "Treat prompts like code: version them, test them, and measure their quality before deploying to production." },
    ],
    starterCode: `# Prompt testing pipeline\nfrom string import Template\n\n# Define a parameterized prompt template\nCLASSIFY_PROMPT = Template(\"\"\"Classify the following support ticket.\n\nTicket: $ticket_text\n\nRespond with JSON: {"category": "...", "confidence": 0.0-1.0}\nCategories: billing, technical, account, other\n\"\"\")\n\n# TODO: Write a function that renders the template with a ticket\ndef render_prompt(ticket_text: str) -> str:\n    pass  # Your code here\n\n# TODO: Write a test that checks the prompt contains the ticket text\ndef test_prompt_rendering():\n    result = render_prompt("I can't log in to my account")\n    assert "I can't log in" in result\n    print("Test passed!")\n\ntest_prompt_rendering()\n`,
    language: "python",
    reviewQuestions: [
      { question: "Why should prompts be version-controlled?", options: ["To save storage space", "To track changes and roll back if quality degrades", "To make them run faster", "To comply with GDPR"], correctIndex: 1, explanation: "Version control lets you track prompt changes, compare performance across versions, and roll back if a new prompt degrades quality." },
    ],
    deliverable: "A working prompt testing pipeline with parameterized templates and assertions.",
    prevLessonId: "LSN-aie-401",
    nextLessonId: "LSN-aie-501",
  },
];

// ─── Module 5: Model API Integration (2 lessons) ────────────────

const m5: TrackLesson[] = [
  {
    id: "LSN-aie-501",
    moduleId: "MOD-aie-05",
    moduleName: "Model API Integration",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Calling LLM APIs with Python",
    lessonType: "coding_lab",
    duration: "35 min",
    objectives: ["Make API calls to LLM providers", "Handle rate limits and errors gracefully", "Parse structured responses"],
    content: [
      { type: "heading", text: "LLM APIs in Production" },
      { type: "paragraph", text: "AI engineers don't train models from scratch for every task — they call pre-trained models via APIs. Understanding how to call these APIs reliably, handle errors, and parse responses is a core skill." },
      { type: "heading", text: "Error Handling Patterns" },
      { type: "list", text: ["Retry with exponential backoff on rate limits (429)", "Circuit breaker pattern for sustained failures", "Timeout configuration to prevent hanging requests", "Fallback responses when the API is unavailable"] },
      { type: "keyTakeaway", text: "Production AI systems must handle API failures gracefully. Never assume the LLM API will always respond quickly and correctly." },
    ],
    starterCode: `import json\nfrom time import sleep\n\n# Simulated LLM API call\ndef call_llm(prompt: str, max_retries: int = 3) -> dict:\n    \"\"\"Call an LLM API with retry logic.\"\"\"\n    for attempt in range(max_retries):\n        try:\n            # TODO: Simulate API call\n            # On success, return {"text": "response", "tokens_used": 42}\n            # On failure (attempt < 2), raise an exception\n            pass\n        except Exception as e:\n            if attempt < max_retries - 1:\n                wait = 2 ** attempt  # Exponential backoff\n                print(f"Retry {attempt + 1} after {wait}s: {e}")\n                sleep(0.1)  # Shortened for demo\n            else:\n                return {"text": "Fallback response", "tokens_used": 0}\n    return {"text": "Fallback response", "tokens_used": 0}\n\nresult = call_llm("Classify this ticket: I can't log in")\nprint(json.dumps(result, indent=2))\n`,
    language: "python",
    reviewQuestions: [
      { question: "What is exponential backoff?", options: ["Doubling the request size each retry", "Waiting progressively longer between retries", "Reducing the prompt length", "Switching to a different model"], correctIndex: 1, explanation: "Exponential backoff waits 1s, 2s, 4s, etc. between retries, giving the API time to recover from rate limits." },
    ],
    deliverable: "A working LLM API client with retry logic and error handling.",
    prevLessonId: "LSN-aie-402",
    nextLessonId: "LSN-aie-502",
  },
  {
    id: "LSN-aie-502",
    moduleId: "MOD-aie-05",
    moduleName: "Model API Integration",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Model APIs — Matching Exercise",
    lessonType: "drag_drop",
    duration: "10 min",
    objectives: ["Match API integration concepts to their purposes"],
    content: [
      { type: "heading", text: "Match the Concept" },
      { type: "paragraph", text: "Drag each API integration concept to its correct description." },
    ],
    dragDropPairs: [
      { term: "Rate limiting", definition: "API restricts the number of requests per time window" },
      { term: "Exponential backoff", definition: "Waiting progressively longer between retry attempts" },
      { term: "Circuit breaker", definition: "Stopping requests to a failing service to prevent cascade failures" },
      { term: "Structured output", definition: "Requesting the model to respond in a specific format like JSON" },
    ],
    reviewQuestions: [],
    deliverable: "Complete the matching exercise with all pairs correctly matched.",
    prevLessonId: "LSN-aie-501",
    nextLessonId: "LSN-aie-601",
  },
];

// ─── Module 6: Cloud Basics for AI (2 lessons) ─────────────────

const m6: TrackLesson[] = [
  {
    id: "LSN-aie-601",
    moduleId: "MOD-aie-06",
    moduleName: "Cloud Basics for AI",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Cloud Architecture for AI Workloads",
    lessonType: "video_text",
    duration: "30 min",
    objectives: ["Understand cloud compute, storage, and networking basics", "Know when to use GPUs vs CPUs for AI", "Understand containerization with Docker"],
    content: [
      { type: "heading", text: "Why Cloud for AI?" },
      { type: "paragraph", text: "AI workloads need compute power that most local machines can't provide. Cloud platforms offer on-demand GPUs, scalable storage, and managed services that let you focus on building models instead of managing infrastructure." },
      { type: "heading", text: "Key Cloud Concepts" },
      { type: "list", text: ["Compute: VMs, containers (Docker), serverless functions", "Storage: Object storage (S3), databases (RDS), caches (Redis)", "Networking: VPCs, load balancers, API gateways", "GPU instances: For model training and large-scale inference"] },
      { type: "heading", text: "Containers and Docker" },
      { type: "paragraph", text: "Docker containers package your AI application with all its dependencies into a portable unit. This ensures your model runs the same way in development, testing, and production — eliminating 'works on my machine' problems." },
      { type: "keyTakeaway", text: "Cloud + containers = reproducible, scalable AI deployments. Learn Docker first, then cloud-specific services." },
    ],
    reviewQuestions: [
      { question: "When should you use GPU instances instead of CPU?", options: ["For all AI workloads", "For model training and large-scale inference", "For API serving only", "Never — CPUs are always sufficient"], correctIndex: 1, explanation: "GPUs excel at parallel matrix operations needed for training and large-scale inference. Simple API serving often works fine on CPUs." },
      { question: "What problem does Docker solve for AI engineers?", options: ["It makes code run faster", "It ensures consistent environments across dev/staging/prod", "It provides GPU access", "It replaces cloud services"], correctIndex: 1, explanation: "Docker packages your app + dependencies into a container that runs identically everywhere, solving environment inconsistency." },
    ],
    practicePrompt: "Describe the cloud architecture you would design for deploying a sentiment analysis API that handles 1000 requests per minute. Include compute, storage, and networking components.",
    deliverable: "A written cloud architecture proposal for an AI inference service.",
    prevLessonId: "LSN-aie-502",
    nextLessonId: "LSN-aie-602",
  },
  {
    id: "LSN-aie-602",
    moduleId: "MOD-aie-06",
    moduleName: "Cloud Basics for AI",
    trackName: TRACK,
    levelTier: LEVEL,
    title: "Beginner Level — Final Assessment",
    lessonType: "mcq",
    duration: "20 min",
    objectives: ["Demonstrate understanding of all Beginner level concepts"],
    content: [
      { type: "heading", text: "Beginner Level Final Assessment" },
      { type: "paragraph", text: "This comprehensive assessment covers all 6 modules: Python for AI, Data Structures, REST APIs, Prompt Engineering, Model API Integration, and Cloud Basics. You need 70% to pass." },
    ],
    mcqQuestions: [
      { question: "Which NumPy operation normalizes a matrix?", options: ["np.sort()", "(matrix - mean) / std", "np.flatten()", "np.concatenate()"], correctIndex: 1, explanation: "Normalization subtracts the mean and divides by standard deviation, centering data around 0 with unit variance." },
      { question: "What's the correct HTTP method for submitting data to an inference endpoint?", options: ["GET", "POST", "DELETE", "OPTIONS"], correctIndex: 1, explanation: "POST is used to submit data for processing — like sending input to a model for prediction." },
      { question: "Which prompting technique improves reasoning quality?", options: ["Zero-shot", "Chain-of-thought", "Temperature=0", "Max tokens=1"], correctIndex: 1, explanation: "Chain-of-thought prompting ('think step by step') helps models break down complex problems and produce better reasoning." },
      { question: "What does a circuit breaker pattern prevent?", options: ["SQL injection", "Cascade failures from a failing dependency", "Memory leaks", "Unauthorized access"], correctIndex: 1, explanation: "Circuit breakers stop sending requests to a failing service, preventing cascade failures across your system." },
      { question: "Why containerize AI applications with Docker?", options: ["To increase model accuracy", "To ensure consistent environments across deployments", "To reduce training time", "To avoid using cloud services"], correctIndex: 1, explanation: "Docker ensures your AI application runs identically in dev, staging, and production by packaging code + dependencies together." },
    ],
    reviewQuestions: [],
    deliverable: "Complete the final assessment with 70% or higher to unlock the Intermediate level.",
    prevLessonId: "LSN-aie-601",
    nextLessonId: null,
  },
];

// ─── Export ─────────────────────────────────────────────────────

export const AI_ENGINEERING_LESSONS: TrackLesson[] = [...m1, ...m2, ...m3, ...m4, ...m5, ...m6];
