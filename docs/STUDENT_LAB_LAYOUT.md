# Student Lab UI Layout — KoreField Academy

## Overview

The Student Lab is the primary coding practice environment where learners write, execute, and submit code within lessons, labs, and assessments. It uses Monaco Editor and follows a three-panel layout with contextual sidebars.

## Top Bar

```
┌──────────────────────────────────────────────────────────────────────┐
│  ← → ○    Lesson Title | Track | Level    [Save] [Run] [Submit]  Time: 12:45 | 60%  │
└──────────────────────────────────────────────────────────────────────┘
```

- Back/forward navigation arrows
- Lesson title with Track and Level context
- Action buttons: Save, Run, Submit
- Timer display (for timed assessments)
- Progress percentage indicator

## Content Tabs

```
┌─────────┬───────────┬─────────┐
│  Learn  │ Practice  │  Apply  │
└─────────┴───────────┴─────────┘
```

Three tabs controlling the main content area:
- **Learn** — Lesson content, AI Avatar instruction, reading material
- **Practice** — Code editor with execution (primary lab view)
- **Apply** — Assessment/submission mode

## Left Sidebar — Navigation

```
┌──────────────────┐
│ 📁 Module Outline │
│ 📄 Lessons List   │
│ 📄 Resources      │
│ 📁 Files          │
│ 📁 Datasets       │
└──────────────────┘
```

- Module Outline — current module structure, lesson sequence
- Lessons List — all lessons in current module with completion status
- Resources — downloadable materials, reference docs
- Files — learner's working files for the exercise
- Datasets — data files available for the exercise (CSV, JSON, etc.)

## Center Panel — Code Editor + Output (Main Area)

### Code Editor (Top)

```
┌─────────────────────────────────────────────────── • • • ─┐
│ Code Editor                                                │
│  1 │ print('Hello, World!')                                │
│  2 │                                                       │
│  3 │ # Write your code here...                             │
│  4 │                                                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- Monaco Editor (VS Code engine)
- Line numbers
- Syntax highlighting, autocompletion, inline error detection
- Languages: Python (primary), SQL, JavaScript
- Starter code with read-only sections (greyed out) and editable sections
- Auto-save at regular intervals
- Assessment mode: autocompletion and external paste disabled when configured

### Output Panel (Below Editor)

```
┌────────────────────────────────────────────────────────────┐
│ Output                                                     │
│ >> Result here...                                          │
│ __________________________________________________________ │
└────────────────────────────────────────────────────────────┘
```

- Displays execution output after Run
- Shows within 10 seconds of execution
- Displays error messages on time/memory limit exceeded

### Bottom Tabs — Console / Test Results / Logs

```
┌──────────┬──────────────┬────────┐
│ Console  │ Test Results  │  Logs  │
├──────────┴──────────────┴────────┤
│ >> Execution Output...           │
│ ________________________________ │
└──────────────────────────────────┘
```

- **Console** — Raw execution output, print statements, errors
- **Test Results** — Automated test case results: pass/fail per test, expected vs actual on failure
- **Logs** — Execution logs, timing info, memory usage

## Right Sidebar — AI Tutor + Debug + Rubric

### AI Tutor Panel (Top Right)

```
┌──────────────────── • • • ─┐
│ AI Tutor                    │
│                             │
│ Hints & Tips                │
│ ________________________    │
│ ________________________    │
│ ________________________    │
└─────────────────────────────┘
```

- Contextual hints from Tutor Agent (RAG-based)
- Adaptive tips based on learner's code and checkpoint responses
- Non-intrusive — learner can collapse/expand

### Debug Panel (Middle Right)

```
┌─────────────────────────────┐
│ Debug: Error Message        │
│ ________________________    │
│ ________________________    │
└─────────────────────────────┘
```

- Displays error context when code fails
- Highlights relevant line numbers
- Suggests common fixes (via AI Tutor integration)

### Checklist & Rubric Panel (Bottom Right)

```
┌──────────────────── • • • ─┐
│ Checklist & Rubric          │
│ ☑ ________________________  │
│ ☑ ________________________  │
│ ☑ ________________________  │
└─────────────────────────────┘
```

- Exercise requirements checklist
- Rubric criteria with completion indicators
- Updates as test cases pass/fail
- Visible during both Practice and Apply tabs

## Full Layout Grid

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Bar: ← → ○  Title | Track | Level  [Save][Run][Submit] Time | %  │
├────────┬──────────────────────────────────────────────┬───────────────┤
│        │         [Learn] [Practice] [Apply]           │               │
│ Left   │                                              │  AI Tutor     │
│ Side   │  Code Editor (Monaco)                        │  Hints & Tips │
│ bar    │  - Line numbers                              │               │
│        │  - Syntax highlighting                       ├───────────────┤
│ Module │  - Starter code                              │  Debug:       │
│ Outline│                                              │  Error Msg    │
│ Lessons│──────────────────────────────────────────────├───────────────┤
│ Resrc  │  Output                                      │  Checklist    │
│ Files  │  >> Result here...                           │  & Rubric     │
│ Data   │──────────────────────────────────────────────│  ☑ criteria   │
│        │  [Console] [Test Results] [Logs]             │  ☑ criteria   │
│        │  >> Execution Output...                      │  ☑ criteria   │
└────────┴──────────────────────────────────────────────┴───────────────┘
```

## Responsive Behavior

- Desktop (1024px+): Full three-column layout as shown
- Tablet (768px–1023px): Left sidebar collapses to icons, right sidebar becomes bottom drawer
- Mobile (320px–767px): Single column, tabs for switching between editor/output/tutor/rubric
- Plain-text fallback for insufficient network conditions (Monaco not loaded)

## Practice Mode Selector

The Practice tab supports two execution modes, toggled via a mode selector:

```
┌──────────────────────────────────────────┐
│  [Script Mode]  |  [Notebook Mode]       │
└──────────────────────────────────────────┘
```

### Script Mode (Default)
- Monaco Editor with single-file code execution
- Best for: focused coding exercises, algorithm challenges, SQL queries
- Layout: as described above (editor + output + console tabs)

### Notebook Mode (DataCamp-style)
- Cell-based execution with interleaved markdown and code cells
- Best for: Data Science, EDA, ML experiments, visualization exercises

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Bar: ← → ○  Title | Track | Level  [Save][Run All][Submit] Time  │
├────────┬──────────────────────────────────────────────┬───────────────┤
│        │  [Script Mode] | [Notebook Mode]             │               │
│ Left   │                                              │  AI Tutor     │
│ Side   │  ┌─ Cell 1 [Markdown] ─────────────────┐    │  Hints & Tips │
│ bar    │  │ ## Introduction                      │    │               │
│        │  │ In this exercise you will explore... │    ├───────────────┤
│ Module │  └──────────────────────────────────────┘    │  Debug:       │
│ Outline│  ┌─ Cell 2 [Code ▶] ───────────────────┐    │  Error Msg    │
│ Lessons│  │ import pandas as pd                  │    │               │
│ Resrc  │  │ df = pd.read_csv('data.csv')         │    ├───────────────┤
│ Files  │  │ df.head()                            │    │  Checklist    │
│ Data   │  ├──────────────────────────────────────┤    │  & Rubric     │
│        │  │ [Output]                             │    │  ☑ criteria   │
│        │  │   col_a  col_b  col_c               │    │  ☑ criteria   │
│        │  │   1      2      3                    │    │               │
│        │  └──────────────────────────────────────┘    │               │
│        │  ┌─ Cell 3 [Code ▶] ───────────────────┐    │               │
│        │  │ df.describe()                        │    │               │
│        │  └──────────────────────────────────────┘    │               │
│        │  [+ Add Cell]                                │               │
└────────┴──────────────────────────────────────────────┴───────────────┘
```

#### Notebook Mode Features
- Markdown cells for instructions, context, and explanations (read-only for instructor-authored, editable for learner notes)
- Code cells with individual Run buttons (▶) and Run All from top bar
- Inline output below each code cell (tables, charts, text, errors)
- Rich output rendering: pandas DataFrames as tables, matplotlib/plotly charts inline, print output
- Cell ordering: add, delete, reorder cells (in learner sandbox sections)
- Instructor-locked cells: starter code and instructions marked read-only
- Kernel status indicator (idle/busy/error) in top bar
- Variable inspector panel (collapsible) showing current namespace variables and types
- Auto-save per cell execution

#### Notebook Backend Architecture
- **JupyterLite (WebAssembly)** for lightweight exercises: runs entirely in browser, no server needed, supports Pyodide (Python in WASM), good for basic pandas/numpy/matplotlib
- **Managed Jupyter Kernels (JupyterHub on ECS)** for heavy workloads: real Python environment with full library support, GPU access for ML exercises, session-based with auto-shutdown after inactivity
- Kernel selection per exercise configured by instructor (lite vs managed)
- Exercise data files pre-loaded into kernel workspace from Datasets sidebar
- Execution timeout: 30 seconds per cell (configurable per exercise)
- Memory limit: 512MB default (configurable per exercise, up to 2GB for ML exercises)

#### When to Use Each Mode
| Mode | Best For | Tracks |
|------|----------|--------|
| Script | Algorithm challenges, API integration, focused coding | AI Engineering, Cybersecurity |
| Notebook | EDA, data visualization, ML experiments, statistical analysis | Data Science, AI Engineering (ML modules) |
| SQL Workspace | Database querying, schema exploration, data analysis | Data Science, AI Engineering, Cybersecurity |
| Terminal | Shell scripting, log parsing, Docker, cloud CLI, system commands | Cybersecurity, AI Engineering |

### SQL Workspace Mode

A dedicated SQL execution environment with schema browser and result tables, similar to DataCamp's SQL interface.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Bar: ← → ○  Title | Track | Level  [Save][Run][Submit] Time      │
├────────┬──────────────────────────────────────────────┬───────────────┤
│        │  [Script] | [Notebook] | [SQL Workspace]     │               │
│ Schema │                                              │  AI Tutor     │
│ Browser│  ┌─ SQL Editor ────────────────────────┐     │  Hints & Tips │
│        │  │ SELECT u.name, COUNT(e.id)          │     │               │
│ Tables │  │ FROM users u                        │     ├───────────────┤
│ ├ users│  │ JOIN enrollments e ON u.id = e.uid  │     │  Debug:       │
│ ├ enrl │  │ GROUP BY u.name                     │     │  Error Msg    │
│ ├ trks │  │ ORDER BY COUNT(e.id) DESC;          │     │               │
│ └ pods │  └─────────────────────────────────────┘     ├───────────────┤
│        │                                              │  Checklist    │
│ Cols   │  ┌─ Query Results ─────────────────────┐     │  & Rubric     │
│ ├ id   │  │ name        │ count                 │     │  ☑ criteria   │
│ ├ name │  │─────────────┼───────────────────────│     │  ☑ criteria   │
│ ├ email│  │ Alice       │ 3                     │     │               │
│ └ role │  │ Bob         │ 2                     │     │               │
│        │  │ Charlie     │ 1                     │     │               │
│        │  └─────────────────────────────────────┘     │               │
│        │  Rows: 3 | Time: 0.012s                      │               │
└────────┴──────────────────────────────────────────────┴───────────────┘
```

#### SQL Workspace Features
- **Schema Browser (Left Sidebar)**: Expandable tree showing tables, columns, types, and relationships for the exercise database
- **SQL Editor (Center Top)**: Monaco Editor with SQL syntax highlighting, autocompletion for table/column names, multi-statement support
- **Query Results (Center Bottom)**: Tabular result display with column sorting, row count, execution time
- **Sandboxed PostgreSQL**: Each exercise runs against an isolated, pre-seeded PostgreSQL instance
- **Pre-loaded datasets**: Exercise-specific tables and data seeded per exercise definition
- **Read-only mode**: Exercises can restrict to SELECT-only queries (no INSERT/UPDATE/DELETE)
- **Multi-query support**: Run multiple statements, results shown for last SELECT
- **Query history**: Recent queries accessible for re-execution
- **Execution limits**: 10-second timeout, 1000-row result cap (configurable per exercise)
- **Expected results validation**: Instructor defines expected query output, auto-graded on Submit

#### SQL Workspace Backend
- Sandboxed PostgreSQL containers per learner session (ECS Fargate)
- Pre-seeded with exercise-specific schema and data from `db/seeds/`
- Auto-shutdown after 30 minutes of inactivity
- No persistent state between exercises (fresh database per exercise)
- Connection pooling for concurrent learner sessions

### Terminal Mode (Bash/Shell)

A sandboxed terminal emulator for shell scripting, system administration, and DevOps exercises.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Bar: ← → ○  Title | Track | Level  [Save][Run][Submit] Time      │
├────────┬──────────────────────────────────────────────┬───────────────┤
│        │  [Script] | [Notebook] | [SQL] | [Terminal]  │               │
│ Left   │                                              │  AI Tutor     │
│ Side   │  ┌─ Instructions ──────────────────────┐     │  Hints & Tips │
│ bar    │  │ Task: Write a script that finds all  │     │               │
│        │  │ .log files larger than 10MB and      │     ├───────────────┤
│ Module │  │ compresses them with gzip.           │     │  Debug:       │
│ Outline│  └──────────────────────────────────────┘     │  Error Msg    │
│ Lessons│                                              │               │
│ Resrc  │  ┌─ Terminal ──────────────────────────┐     ├───────────────┤
│ Files  │  │ learner@lab:~$ ls -la               │     │  Checklist    │
│ Data   │  │ total 48                            │     │  & Rubric     │
│        │  │ drwxr-xr-x 2 learner learner 4096  │     │  ☑ criteria   │
│        │  │ -rw-r--r-- 1 learner learner 15M    │     │  ☑ criteria   │
│        │  │   app.log                           │     │               │
│        │  │ learner@lab:~$ _                    │     │               │
│        │  └──────────────────────────────────────┘     │               │
└────────┴──────────────────────────────────────────────┴───────────────┘
```

#### Terminal Mode Features
- **Instruction Panel (Top)**: Exercise description, objectives, expected outcomes (collapsible)
- **Terminal Emulator (Center)**: xterm.js-based terminal with full Bash shell access
- **Sandboxed Linux Container**: Isolated container per learner session with pre-installed tools
- **Pre-installed tools**: bash, git, curl, wget, grep, awk, sed, jq, docker CLI, cloud CLIs (aws-cli), Python, Node.js
- **File system**: Exercise-specific files pre-loaded (log files, config files, scripts)
- **Script editor**: Optional split-pane with Monaco editor for writing .sh scripts alongside terminal
- **Command history**: Persistent within session, accessible via up-arrow
- **Copy/paste**: Full clipboard support
- **Output validation**: Instructor defines expected file states, command outputs, or script results for auto-grading

#### Terminal Mode Backend
- Sandboxed Linux containers on ECS Fargate (Alpine or Ubuntu-based)
- Pre-configured with exercise-specific files and tools
- Network access restricted: no outbound internet (except for exercises that require it, e.g., curl exercises)
- Auto-shutdown after 30 minutes of inactivity
- Resource limits: 1 vCPU, 512MB RAM per session (configurable per exercise)
- No persistent state between exercises (fresh container per exercise)

## Interaction Flow

### Script Mode
1. Learner navigates to lesson → lands on Learn tab (AI Avatar content)
2. Switches to Practice tab → Monaco Editor loads with starter code
3. Writes code → clicks Run → output appears in Output panel + Console tab
4. Test Results tab shows pass/fail per instructor-defined test case
5. AI Tutor provides contextual hints based on errors or progress
6. Checklist updates as test cases pass
7. Learner clicks Submit when ready → submission recorded (SUB-*)
8. Switches to Apply tab for assessment-mode exercises (if applicable)

### Notebook Mode
1. Learner navigates to lesson → lands on Learn tab
2. Switches to Practice tab → selects Notebook Mode
3. Notebook loads with instructor-authored markdown + starter code cells
4. Learner executes cells individually (▶) or Run All
5. Output renders inline below each cell (tables, charts, text)
6. AI Tutor provides contextual hints based on cell outputs and errors
7. Checklist updates as exercise criteria are met
8. Learner clicks Submit → notebook state captured as submission (SUB-*)

### SQL Workspace Mode
1. Learner navigates to SQL exercise → lands on Learn tab (context about the database)
2. Switches to Practice tab → selects SQL Workspace
3. Schema Browser loads with exercise tables, columns, and types
4. Learner writes SQL in editor (autocompletion for table/column names)
5. Clicks Run → query executes against sandboxed PostgreSQL → results appear in table
6. AI Tutor provides hints on query optimization or syntax errors
7. Checklist updates as expected results match
8. Learner clicks Submit → query and results captured as submission (SUB-*)

### Terminal Mode
1. Learner navigates to shell exercise → lands on Learn tab (context and objectives)
2. Switches to Practice tab → selects Terminal
3. Instruction panel shows exercise description and expected outcomes
4. Terminal loads with sandboxed Linux environment and pre-loaded files
5. Learner executes commands, writes scripts, manipulates files
6. AI Tutor provides hints on command syntax or approach
7. Checklist updates as expected file states or outputs are detected
8. Learner clicks Submit → terminal history and file states captured as submission (SUB-*)
