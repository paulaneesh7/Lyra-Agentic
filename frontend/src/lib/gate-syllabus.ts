export type GateUnit = {
  name: string;
  topics: string[];
};

export type GateSubject = {
  id: string;
  short: string;
  name: string;
  blurb: string;
  typical: string;
  units: GateUnit[];
};

export type GatePaper = {
  id: "CS" | "DA";
  label: string;
  hint: string;
  subjects: GateSubject[];
};

const CS: GateSubject[] = [
  {
    id: "em",
    short: "EM",
    name: "Engineering Mathematics",
    blurb: "Linear algebra, calculus, probability",
    typical: "Often ~13 marks",
    units: [
      { name: "Linear algebra", topics: ["Eigenvalues", "Rank & nullity", "Systems of equations"] },
      { name: "Calculus", topics: ["Limits", "Maxima-minima", "Multiple integrals"] },
      { name: "Probability", topics: ["Bayes theorem", "Random variables", "Distributions"] },
      { name: "Discrete math", topics: ["Graphs", "Combinatorics", "Recurrence relations"] },
    ],
  },
  {
    id: "pds",
    short: "PDS",
    name: "Programming & Data Structures",
    blurb: "C, recursion, trees, hashing",
    typical: "Often ~8–10 marks",
    units: [
      { name: "Programming", topics: ["Pointers", "Recursion", "Parameter passing"] },
      { name: "Linear structures", topics: ["Stacks", "Queues", "Linked lists"] },
      { name: "Trees & hashing", topics: ["BST", "Heaps", "Hashing collisions"] },
    ],
  },
  {
    id: "algo",
    short: "ALGO",
    name: "Algorithms",
    blurb: "Asymptotics, graphs, DP, greedy",
    typical: "Often ~8–10 marks",
    units: [
      { name: "Complexity", topics: ["Master theorem", "Amortized analysis", "Recurrences", "NP-completeness intuition"] },
      { name: "Sorting & search", topics: ["Merge sort", "Quick sort", "Heap sort", "Binary search variants"] },
      { name: "Graphs", topics: ["BFS/DFS", "Shortest paths", "MST", "Topological sort"] },
      { name: "DP & greedy", topics: ["Knapsack", "LCS", "Activity selection", "Matrix chain"] },
    ],
  },
  {
    id: "toc",
    short: "TOC",
    name: "Theory of Computation",
    blurb: "Automata, grammars, decidability",
    typical: "Often ~6–8 marks",
    units: [
      { name: "Regular languages", topics: ["DFA vs NFA", "Regex", "Pumping lemma"] },
      { name: "CFLs", topics: ["CFG", "PDA", "Ambiguity"] },
      { name: "Computability", topics: ["Turing machines", "Undecidability", "Rice's theorem"] },
    ],
  },
  {
    id: "cd",
    short: "CD",
    name: "Compiler Design",
    blurb: "Lexing, parsing, codegen",
    typical: "Often ~4–6 marks",
    units: [
      { name: "Front end", topics: ["Lexical analysis", "FIRST/FOLLOW", "LL vs LR"] },
      { name: "Semantics", topics: ["SDT", "Type checking", "Symbol tables"] },
      { name: "Back end", topics: ["IR", "Code optimization", "Register allocation"] },
    ],
  },
  {
    id: "os",
    short: "OS",
    name: "Operating Systems",
    blurb: "CPU, memory, sync, deadlock",
    typical: "Often ~8–10 marks",
    units: [
      { name: "Processes", topics: ["Process states", "Threads", "Context switch"] },
      { name: "CPU scheduling", topics: ["SJF vs SRTF", "Round robin", "Priority inversion", "Convoy effect", "Multilevel feedback"] },
      { name: "Memory", topics: ["Paging", "TLB", "Page replacement", "Belady's anomaly", "Segmentation vs paging"] },
      { name: "Concurrency", topics: ["Semaphores", "Deadlock", "Banker's algorithm", "Readers-writers", "Priority inversion"] },
    ],
  },
  {
    id: "dbms",
    short: "DBMS",
    name: "Databases",
    blurb: "SQL, NF, transactions",
    typical: "Often ~8 marks",
    units: [
      { name: "Relational model", topics: ["ER model", "Relational algebra", "SQL", "Nested queries"] },
      { name: "Normalization", topics: ["FDs", "3NF vs BCNF", "Lossless join", "Dependency preservation"] },
      { name: "Transactions", topics: ["ACID", "2PL", "Conflict serializability", "Timestamp ordering"] },
    ],
  },
  {
    id: "cn",
    short: "CN",
    name: "Computer Networks",
    blurb: "Layers, TCP, routing",
    typical: "Often ~6–8 marks",
    units: [
      { name: "Layering", topics: ["OSI vs TCP/IP", "Switching", "Error control"] },
      { name: "Routing", topics: ["Distance vector", "Link state", "CIDR"] },
      { name: "Transport", topics: ["TCP congestion", "UDP", "Flow control"] },
    ],
  },
  {
    id: "coa",
    short: "COA",
    name: "Computer Organization",
    blurb: "ISA, pipeline, cache",
    typical: "Often ~6–8 marks",
    units: [
      { name: "ISA", topics: ["Addressing modes", "Instruction formats", "Number systems"] },
      { name: "Pipelining", topics: ["Hazards", "Forwarding", "Speedup"] },
      { name: "Memory hierarchy", topics: ["Cache mapping", "Write policies", "Miss penalty"] },
    ],
  },
  {
    id: "dl",
    short: "DL",
    name: "Digital Logic",
    blurb: "Boolean, combinational, sequential",
    typical: "Often ~4–6 marks",
    units: [
      { name: "Boolean algebra", topics: ["K-maps", "Canonical forms", "Minimization"] },
      { name: "Combinational", topics: ["Mux/decoder", "Adders", "Comparators"] },
      { name: "Sequential", topics: ["Flip-flops", "Counters", "FSM"] },
    ],
  },
  {
    id: "ga",
    short: "GA",
    name: "General Aptitude",
    blurb: "Verbal + numerical",
    typical: "Fixed 15 marks",
    units: [
      { name: "Verbal", topics: ["Grammar", "Analogies", "Critical reasoning"] },
      { name: "Numerical", topics: ["Percentages", "Data interpretation", "Sets"] },
    ],
  },
];

const DA: GateSubject[] = [
  {
    id: "ps",
    short: "P&S",
    name: "Probability & Statistics",
    blurb: "Inference, distributions",
    typical: "Core DA paper",
    units: [
      { name: "Probability", topics: ["Bayes", "Expectation", "Variance"] },
      { name: "Statistics", topics: ["MLE", "Hypothesis testing", "Confidence intervals"] },
    ],
  },
  {
    id: "la",
    short: "LA",
    name: "Linear Algebra",
    blurb: "Matrices, SVD, projections",
    typical: "Core DA paper",
    units: [
      { name: "Matrices", topics: ["Eigen decomposition", "SVD", "Positive definite"] },
    ],
  },
  {
    id: "ml",
    short: "ML",
    name: "Machine Learning",
    blurb: "Supervised models, bias-variance",
    typical: "Core DA paper",
    units: [
      { name: "Supervised", topics: ["Linear regression", "SVM", "Decision trees"] },
      { name: "Unsupervised", topics: ["k-means", "PCA", "Clustering validity"] },
    ],
  },
  {
    id: "ai",
    short: "AI",
    name: "Artificial Intelligence",
    blurb: "Search, logic, planning",
    typical: "Core DA paper",
    units: [
      { name: "Search", topics: ["A*", "Minimax", "Constraint satisfaction"] },
    ],
  },
  {
    id: "pda",
    short: "PDA",
    name: "Programming & Algorithms",
    blurb: "Structures, complexity, graphs",
    typical: "Shared with CS",
    units: [
      { name: "DSA", topics: ["Hashing", "Graphs", "Dynamic programming"] },
    ],
  },
];

export const GATE_PAPERS: GatePaper[] = [
  { id: "CS", label: "GATE CS & IT", hint: "Computer Science and Information Technology", subjects: CS },
  { id: "DA", label: "GATE DA", hint: "Data Science and Artificial Intelligence", subjects: DA },
];

export const FOCUSES = [
  { id: "quick_facts", label: "Quick facts", hint: "One-liners for last-day revision" },
  { id: "key_concepts", label: "Key concepts", hint: "Invariants, examples, crisp ideas you can recall in 20s" },
  { id: "recurring_patterns", label: "Question patterns", hint: "Practice-style shapes GATE often uses — not official PYQs" },
  { id: "definitions", label: "Definitions", hint: "Precise terms: serializability, hazard, pumping lemma" },
  { id: "common_mistakes", label: "GATE traps", hint: "Off-by-one, wrong model, lookalike definitions" },
  { id: "formulas", label: "Formulas & complexity", hint: "Standard identities, T/S complexity, recurrences" },
  { id: "concept_questions", label: "Check questions", hint: "One-line conceptual prompts" },
  { id: "pyq_insights", label: "Revision angles", hint: "What this topic is usually tested on" },
];

export const PRIMARY_FOCUSES = FOCUSES.slice(0, 4);
export const EXTRA_FOCUSES = FOCUSES.slice(4);

export const GENERATE_COST = 5;

export const EXAM_WEIGHTS = [
  { id: "mixed", label: "GATE mix", hint: "1-mark recall + 2-mark reasoning" },
  { id: "1_mark", label: "1-mark flavour", hint: "Fast recall, definitions, true/false traps" },
  { id: "2_mark", label: "2-mark flavour", hint: "Short reason, tiny derivation, compare" },
];

export const CARD_FORMATS = [
  { id: "qa", label: "Q & A", hint: "Prompt on front, answer on back" },
  { id: "cloze", label: "Cloze", hint: "Hide the key term — active recall" },
  { id: "compare", label: "Compare", hint: "X vs Y — paging vs segmentation" },
  { id: "formula", label: "Formula", hint: "Complexity, identities, recurrences" },
];
