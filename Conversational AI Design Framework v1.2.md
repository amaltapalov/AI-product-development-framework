# Conversational AI Design Framework

Nov 25, 2026 · @Amal Tapalov

> **In one sentence:** a seven-step way for Product, Design, Development and Data Science to build conversational and generative AI products that solve a real problem, give correct answers and fail safely.

> **About the diagrams:** they are written in Mermaid. They render in VS Code's Markdown preview, GitHub, GitLab, Notion, Obsidian and Confluence (with the Mermaid app). In other tools you'll see the diagram code instead.

---

## 1. How to use this framework

- **Follow the seven phases in order.** Each phase ends with a short checklist (the *exit gate*). Pass it, go back, or stop.
- **Fill one canvas as you go.** The AI Use Case Canvas (section 13) is the team's single working document. Each phase fills its own rows.
- **Know your role.** Every phase shows who leads, who contributes and what each role hands over.
- **Stopping early is fine.** If Discover shows that a normal screen solves the problem better, that's a good result.

A running example follows one product through every phase: a **KPI investigation assistant** that helps product managers find and explain unusual KPI movement without opening several dashboards.

---

## 2. The lifecycle at a glance

```mermaid
---
config:
  flowchart:
    nodeSpacing: 20
    rankSpacing: 28
    padding: 8
---
flowchart LR
    D["<b>1 · Discover</b><br/>Is the problem<br/>real?"] --> DF["<b>2 · Define</b><br/>What will<br/>the AI do?"]
    DF --> M["<b>3 · Model</b><br/>How does the<br/>conversation flow?"]
    M --> DS["<b>4 · Design</b><br/>How does it look<br/>and behave?"]
    DS --> V["<b>5 · Validate</b><br/>Does it work<br/>and is it right?"]
    V --> DL["<b>6 · Deliver</b><br/>Can the team<br/>build it?"]
    DL --> L["<b>7 · Learn</b><br/>What did real<br/>use teach us?"]
    V -. "not good enough yet" .-> M
    L -. "new needs and fixes" .-> DF
```

Two loops matter:

1. **Model → Design → Validate** repeats until the answers are good enough to ship.
2. **Learn → Define** brings what you learn after launch back into the next version.

| Phase | Key question | Lead role |
| --- | --- | --- |
| 1. Discover | Is the problem real, and is conversation the right answer? | Product owner |
| 2. Define | What can the AI do and not do, and how do we measure success? | Product owner |
| 3. Model | How does the conversation work, including when it goes wrong? | Design |
| 4. Design | Which patterns do we use, and how should the AI behave? | Design |
| 5. Validate | Can users express what they need, and are the answers correct? | Design and Data Science |
| 6. Deliver | Can the team build and release exactly this behavior? | Development |
| 7. Learn | What did real use teach us? | Product owner |

---

## 3. The four roles

Each role owns a different question. When roles disagree, the owner of that question decides.

```mermaid
flowchart TB
    P(("Conversational<br/>AI product"))
    PO["<b>Product owner</b><br/>Why and what<br/>Value · scope · priorities · go/no-go"]
    DE["<b>Design</b><br/>For whom and how it feels<br/>Research · flow · patterns · copy · behavior"]
    DV["<b>Development</b><br/>How it's built and runs<br/>Architecture · integrations · security · release"]
    DSC["<b>Data Science</b><br/>How well the AI performs<br/>Data · model · prompts · retrieval · evaluation"]
    PO --- P
    DE --- P
    DV --- P
    DSC --- P
```

| | Product owner | Design | Development | Data Science |
| --- | --- | --- | --- | --- |
| **Question they own** | Is this worth building, and is it working? | Does it make sense to the user? | Does it run safely and reliably? | Are the AI's answers good enough? |
| **Owns** | Problem, business goal, scope, success metrics, priorities, budget, compliance contacts | User research, interaction model, conversation flow, patterns, UX copy, the intent of the behavior spec | Architecture, integrations and tools, permissions, logging, performance, release pipeline, monitoring | Data readiness, model choice, prompts and retrieval, evaluation runs, quality metrics |
| **Decides** | Go or no-go at each gate, what's in and out of scope, when to switch the AI off | How the AI talks, which patterns are used, how errors are handled for the user | How it's built, which model version runs in production, response-time feasibility | Whether the AI meets the quality bar, which model and prompt setup to use |
| **Doesn't decide alone** | How the AI behaves (with Design and Data Science) | What's technically possible (with Development and Data Science) | What the user sees (with Design) | Business priorities (with the Product owner) |

**Supporting partners** join at specific moments: Content Design (UX copy), Governance and Compliance (reviews and sign-off), Data Protection (privacy and logging), Pharmacovigilance (side-effect reporting) and the Data Owner (source data).

### Who leads each phase

● leads · ◐ contributes · ○ reviews

| Phase | Product owner | Design | Development | Data Science |
| --- | :---: | :---: | :---: | :---: |
| 1. Discover | ● | ◐ | ○ | ◐ |
| 2. Define | ● | ◐ | ◐ | ◐ |
| 3. Model | ○ | ● | ◐ | ◐ |
| 4. Design | ○ | ● | ◐ | ◐ |
| 5. Validate | ○ | ● | ◐ | ● |
| 6. Deliver | ○ | ◐ | ● | ◐ |
| 7. Learn | ● | ◐ | ◐ | ◐ |

### How work moves between roles

```mermaid
sequenceDiagram
    participant PO as Product owner
    participant DE as Design
    participant DV as Development
    participant DS as Data Science
    Note over PO,DS: 1 · Discover
    PO->>DE: User problem and business goal
    DE->>PO: Research findings and interaction model
    DS->>PO: Data readiness check
    Note over PO,DS: 2 · Define
    PO->>DE: Scope, boundaries and success metrics
    DV->>PO: Technical feasibility and response-time estimate
    Note over PO,DS: 3 · Model and 4 · Design
    DE->>DV: Conversation flow and patterns
    DE->>DS: Behavior spec draft
    DS->>DE: Working prototype with the real model
    Note over PO,DS: 5 · Validate
    DE->>DS: Real user phrasings for test cases
    DS->>PO: Pass rate and critical failures
    PO->>PO: Go / no-go
    Note over PO,DS: 6 · Deliver
    DE->>DV: Handoff package
    DS->>DV: Evaluation set for the release pipeline
    Note over PO,DS: 7 · Learn
    DV->>PO: Usage data and incidents
    PO->>DE: Priorities for the next version
```

---

## 4. Principles

When two good options conflict, these decide. They're in priority order.

| # | Principle | In practice |
| --- | --- | --- |
| 1 | **Human first** | Start from the user's goal, never from what the model can do. |
| 2 | **Conversation with purpose** | If a button or filter does the job better, build the button. |
| 3 | **Correct before fluent** | A confident wrong answer is worse than no answer. Show uncertainty. |
| 4 | **Transparent** | Say it's AI. Show sources, limits and what actions it takes. |
| 5 | **Recoverable** | Every error says what happened and what to do next. No dead ends. |
| 6 | **Consistent** | Reuse a pattern from the Pattern Catalogue before inventing one. |

---

## 5. Rules for every product, and extra checks

Some rules always apply. Others apply only when the product does certain things. Answer the three questions below in Define and record the answers in the canvas.

**Always required**

- **Say it's AI.** Users must know they're talking to an AI. EU AI Act Article 50 has required this since 2 August 2026 ([Goodwin](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force)).
- **Show sources** for every factual claim.
- **Agree privacy and logging rules:** what's logged, for how long, who can read it, and how personal data in prompts is handled.
- **Evaluate before every release:** run every test case three times, with zero critical failures.

**Extra checks: answer three questions**

```mermaid
---
config:
  flowchart:
    nodeSpacing: 16
    rankSpacing: 36
    padding: 8
---
flowchart LR
    S["<b>Every product</b><br/>disclosure · sources<br/>privacy rules · evaluation"]
    S --> Q1(["Does the AI take actions?<br/>send, submit, change, delete"])
    S --> Q2(["Does it touch medicines<br/>or patients?"])
    S --> Q3(["Personal or regulated data,<br/>GxP processes or external users?"])
    Q1 -- Yes --> A1["Add: preview and confirm, undo or cancel,<br/>audit log, human handoff"]
    Q2 -- Yes --> A2["Add: adverse-event check<br/>with Pharmacovigilance"]
    Q3 -- Yes --> A3["Add: governance and privacy sign-off,<br/>system validation if GxP-relevant,<br/>adversarial testing"]
```

| If the answer is yes | Who handles it |
| --- | --- |
| The AI takes actions | Design owns the confirmation and undo flows. Development builds the audit log and permissions. |
| It touches medicines or patients | The Product owner contacts Pharmacovigilance and records the answer. |
| Personal, regulated or GxP data, or external users | The Product owner arranges sign-off. Development and Data Science supply the evidence. |

---

## 6. Phase 1 · Discover

**Goal:** prove the problem is real and that conversation is the right way to solve it, before anyone designs a chat window.

### Choose the interaction model

Most strong enterprise products are **hybrid**: users ask in their own words, and the answer appears as a chart, table or form.

```mermaid
flowchart TD
    Q0{"Is approved data available,<br/>with a named owner?"} -- No --> FIX["Fix the data first.<br/>AI can't fix bad data."]
    Q0 -- Yes --> Q1{"Is the task predictable,<br/>with known steps and choices?"}
    Q1 -- Yes --> UI["<b>Conventional UI</b><br/>Forms, filters, buttons"]
    Q1 -- No --> Q2{"Is the answer best shown<br/>as a chart, table or form?"}
    Q2 -- Yes --> HY["<b>Hybrid</b><br/>Ask in words,<br/>see structured results"]
    Q2 -- No --> CO["<b>Conversational AI</b><br/>Explore, follow up,<br/>generate, guide"]
```

### Steps

1. Talk to real users. What are they trying to do, and what triggers the need?
2. Measure the baseline: how do they solve it today, and how long does it take?
3. Ask what happens if the AI gives a wrong answer.
4. Check the data: does it exist, is it approved for this use, is it clean, and who owns it?
5. Choose the interaction model with the diagram above and write down why.

### Who does what

| Role | Does | Hands over |
| --- | --- | --- |
| **Product owner** | Frames the problem and business goal. Makes the go/no-go call. | Problem statement, go/no-go decision |
| **Design** | Runs user interviews, measures the baseline, proposes the interaction model. | Research findings, baseline, interaction model |
| **Development** | Flags existing systems and integration limits. | Notes on technical constraints |
| **Data Science** | Checks the data exists, is approved, is clean and has an owner. | Data readiness check |

### Example: KPI investigation assistant

*Numbers are illustrative. Replace them with your own.*

| Field | Answer |
| --- | --- |
| User | Product manager |
| Need | Spot unusual KPI movement quickly and understand why it happened |
| Today | About 30 minutes per question: three dashboards, then a message to an analyst |
| Model | Hybrid: ask in plain language, get a chart plus a short explanation |
| Data | Approved KPI data source with a named data owner |
| Main risk | The AI misreads the data and the PM acts on a wrong explanation |

### Exit gate

- [ ] Real users confirmed the problem.
- [ ] The baseline is measured.
- [ ] The interaction model is chosen, with the reason written down.
- [ ] The data exists and has an owner.

If conversation doesn't beat the baseline, stop and design conventional UI.

---

## 7. Phase 2 · Define

**Goal:** agree exactly what the AI can do, can't do and must confirm first, and how you'll measure success. No open-ended "Ask AI anything".

### Map each capability

Write one chain per capability. If you can't name the data or tool, the capability isn't ready.

```mermaid
flowchart LR
    I["<b>User intent</b><br/>'Show me declining KPIs'"] --> A["<b>AI action</b><br/>Read time range<br/>and product"]
    A --> T["<b>Data or tool</b><br/>Query approved<br/>KPI data"]
    T --> R["<b>Result</b><br/>Chart of drops<br/>plus likely driver"]
    R --> F["<b>Follow-up</b><br/>'Compare to last quarter'<br/>'Break down by region'"]
```

### Draw three boundaries

Every request falls into one of three zones:

```mermaid
flowchart TD
    REQ["User request"] --> Z{"Which zone?"}
    Z -- "Can do" --> C["Answer, with sources"]
    Z -- "Must confirm first" --> MC["Show a preview,<br/>wait for the user's OK"]
    Z -- "Can't do" --> N["Explain the limit,<br/>offer an alternative"]
```

| Can do | Must confirm first | Can't do |
| --- | --- | --- |
| Find, explain, summarize, compare | Send, submit, publish, approve | Show data the user isn't allowed to see |
| Generate, transform, recommend | Delete or significantly change content | Act outside the agreed capability list |
| Run approved low-risk actions | Anything that can't be undone | Make claims without a source |

### Set success metrics

Pick two to four, each with a target, and compare them with the baseline.

| Metric | What it tells you | How to measure |
| --- | --- | --- |
| Task success | Did users get what they came for? | Observed in testing; a one-question survey in production |
| Time to answer | Is it faster than today? | First question to accepted answer |
| Answer accuracy | Is it right? | Pass rate on the evaluation set |
| Rephrase rate | Do users struggle to be understood? | Share of conversations with two or more rephrased questions |
| Give-up rate | Do users abandon or need a human? | Conversations ended without an answer, or handed to a person |
| Trust calibration | Do users question wrong answers? | Include two or three deliberately wrong answers in testing and count who questions them |

Also set a **response-time target**, for example: streaming starts within 2 seconds, and the full answer arrives within 10.

### Who does what

| Role | Does | Hands over |
| --- | --- | --- |
| **Product owner** | Sets scope and success metrics, answers the three extra-check questions, contacts governance. | Signed-off scope, metrics with targets |
| **Design** | Collects how users phrase their needs, writes capability chains, drafts the boundaries. | Capability chains, boundary lists |
| **Development** | Confirms each tool and integration is feasible, estimates response time, plans logging and permissions. | Feasibility notes, response-time estimate, logging plan |
| **Data Science** | Confirms each capability can be answered from the data, flags likely accuracy problems. | Feasibility of each capability from a data and model view |

### Example

- **Can't do:** show KPIs outside the PM's portfolio; state a cause the data doesn't support.
- **Extra checks:** no actions, no patients, no personal data. Only the base rules apply.
- **Targets:** accuracy 90% or higher; time to answer under 2 minutes (vs. about 30 today); rephrase rate below 20%.

### Exit gate

- [ ] Every capability has a named data source or tool.
- [ ] The three boundaries are written.
- [ ] The three extra-check questions are answered and recorded.
- [ ] Privacy and logging rules are agreed with Data Protection.
- [ ] Every metric has a target, and the response-time target is set.

---

## 8. Phase 3 · Model

**Goal:** design the conversation as a loop of turns, including what happens when it goes wrong. It's not a fixed sequence of screens.

### The conversation loop

```mermaid
flowchart LR
    A["Users state<br/>what they need"] --> B["AI interprets"]
    B --> C{"Clear enough?"}
    C -- "No or unsure" --> R["Recovery:<br/>clarify or confirm"]
    R --> A
    C -- Yes --> D["AI gathers context<br/>and reasons or acts"]
    D --> E["AI shows the result<br/>and its source"]
    E --> F["AI offers<br/>a next step"]
    F --> G{"User continues?"}
    G -- Yes --> A
    G -- No --> X["Exit"]
```

### Design every way it can go wrong

Each row needs a written response before you leave this phase.

| When this happens | The AI should |
| --- | --- |
| Information is missing | Ask only for what it needs to continue. |
| The request is ambiguous | Offer two or three clear options. |
| It isn't sure what the user meant | Say what it understood and ask the user to confirm. |
| Nothing is found | Say what it searched and suggest a change. |
| Only part is found | Show what it found and name what's missing. |
| The request is out of scope | Explain the limit and offer an alternative. |
| The system fails | Say what happened and how to recover. |
| A multi-step action fails partway | Stop, show what was done and what wasn't, offer retry, undo or a person. |
| A person is needed | Hand off with the conversation history, so the user doesn't repeat themselves. |

### Decide what the AI remembers

```mermaid
flowchart LR
    T["Within one conversation<br/>e.g. product and time range"] --> S["Across sessions<br/>e.g. nothing, in v1"]
    S --> RS["Reset and exit<br/>how the user starts over"]
```

Users assume the AI remembers more than it does, so show what it remembers on screen.

### Who does what

| Role | Does | Hands over |
| --- | --- | --- |
| **Product owner** | Reviews the flow against scope. Names the owner of the human handoff, if there is one. | Handoff owner |
| **Design** | Maps the happy path turn by turn, writes every recovery, decides what the AI remembers. | Conversational Flow Map (FigJam) |
| **Development** | Checks that memory, handoff and error states are buildable. | Notes on state and session handling |
| **Data Science** | Flags where the model is likely to misunderstand, and which recoveries the model can trigger reliably. | List of likely misunderstanding points |

### Example

- **Ambiguous:** "How are we doing?" → "Which do you want to look at: active users, conversion or revenue?"
- **Not sure:** "Show retention" → "I read this as 30-day retention for the mobile app, last quarter. Is that right?"
- **Out of scope:** "Show me the competitor's numbers" → "I only have our internal KPIs. I can compare your product with internal benchmarks instead."

### Exit gate

- [ ] The happy path is mapped turn by turn.
- [ ] Every row in the "goes wrong" table has a written response.
- [ ] Memory, reset and exit are written down.
- [ ] If the AI takes actions, the human handoff has an owner.

---

## 9. Phase 4 · Design

**Goal:** build the experience from reusable patterns, and write the behavior spec that tells the AI how to act.

### Patterns in the order they appear

```mermaid
flowchart LR
    IN["<b>Input</b><br/>prompt, starters,<br/>attachments, voice"] --> RE["<b>Response</b><br/>text, table, chart,<br/>summary, artifact"]
    RE --> FU["<b>Follow-up</b><br/>suggestions, refine,<br/>regenerate, feedback"]
    FU --> AC["<b>Action</b><br/>preview, confirm,<br/>run, undo"]
    TR["<b>Trust</b> · throughout<br/>AI disclosure, sources,<br/>uncertainty, limits"] -.-> RE
    RC["<b>Recovery</b> · when needed<br/>clarify, no result,<br/>out of scope, error, handoff"] -.-> IN
```

**Every product includes:** AI disclosure, prompt starters, sources, uncertainty, clarification, out of scope, error and retry, feedback.
**If the AI takes actions, add:** preview and confirm, undo or cancel, human handoff.

Need a new pattern? Document the problem, when to use it, its states, content rules and accessibility notes, then propose it to the Pattern Catalogue owner before using it in production.

### The behavior spec

The behavior spec is the brief the AI follows; in practice, the system prompt. Design owns what it says. Data Science turns it into a working prompt. Development stores it under version control.

```mermaid
flowchart LR
    R1["Role<br/>who it serves, its job"] --> BS["<b>Behavior spec</b><br/>versioned, next to the code"]
    R2["Voice and tone<br/>with 2–3 example replies"] --> BS
    R3["Boundaries<br/>from Define"] --> BS
    R4["Response rules<br/>length, structure, sources,<br/>uncertainty"] --> BS
    R5["Recovery rules<br/>from Model"] --> BS
    BS --> AI["The AI's behavior"]
```

### Also design

- **First run:** three to five prompt starters that cover the main capabilities, plus one key limit stated up front.
- **Accessibility:** screen readers announce new messages and streaming states; everything works with a keyboard and with zoom; every chart has a text summary.
- **Language:** decide which languages are supported and say so on first run.

**Prototype with the real model early.** A rough prototype tested on five real questions teaches you more than a polished Figma flow.

### Who does what

| Role | Does | Hands over |
| --- | --- | --- |
| **Product owner** | Reviews against scope and metrics. Approves any new pattern. | Approval |
| **Design** | Designs screens from catalogue patterns, writes the behavior spec draft, writes UX copy with Content Design. | Designs, behavior spec draft, UX copy |
| **Development** | Builds the prototype shell, checks components and streaming states, sets up spec versioning. | Prototype environment |
| **Data Science** | Turns the behavior spec into a working prompt, sets up retrieval, connects the real model. | Working prototype with the real model |

### Example

A chat panel beside a chart area. Every explanation cites the KPI source and date range. Prompt starters: "Which KPIs dropped this month?", "Explain the change in conversion", "Compare this quarter with last quarter".

### Exit gate

- [ ] Every required pattern is in the design.
- [ ] New patterns are proposed to the catalogue.
- [ ] The behavior spec is versioned and reviewed by Development and Data Science.
- [ ] A prototype running on the real model is ready to test.

---

## 10. Phase 5 · Validate

**Goal:** prove two things: users can express what they need, and the AI's answers are correct. Most teams test only the first.

### Two tracks, one decision

```mermaid
flowchart TB
    P["Working prototype"] --> TA["<b>Track A · User testing</b><br/>Lead: Design<br/>Can users get what they need?"]
    P --> TBQ["<b>Track B · Answer quality</b><br/>Lead: Data Science<br/>Are the answers correct?"]
    TA -- "real phrasings become test cases" --> TBQ
    TA --> FD["Findings"]
    TBQ --> PR["Pass rate and<br/>critical failures"]
    FD --> G{"Product owner:<br/>ready to ship?"}
    PR --> G
    G -- No --> BK["Back to Model or Design"]
    G -- Yes --> DL["Deliver"]
```

### Track A: user testing

Give participants a goal, not a prompt: *"You want to understand why KPI X declined."* Watch for:

- The words they use and how long their questions are
- Whether they understand what the AI can and can't do
- Where the AI misunderstands or goes too far
- Whether they find the source and trust the answer
- Whether they question the deliberately wrong answers
- Whether they recover when something goes wrong

### Track B: answer quality

The same question can get different answers, so one good run proves nothing.

**How one test case is scored**

```mermaid
flowchart LR
    C["Test case"] --> R1["Run 1"]
    C --> R2["Run 2"]
    C --> R3["Run 3"]
    R1 --> CK{"Every run passes<br/>all four checks?"}
    R2 --> CK
    R3 --> CK
    CK -- Yes --> OK["Case passes"]
    CK -- No --> NO["Case fails"]
```

| Check | Passes when |
| --- | --- |
| **Correct** | Facts and numbers are right. |
| **Grounded** | Every claim traces to an approved source, and the source is shown. |
| **Honest** | Uncertainty is stated; no invented causes or figures. |
| **In bounds** | It stays inside the three boundaries and follows the behavior spec. |

**Build the test set:** 5 to 10 cases per capability, covering each type below.

| Case type | What it tests |
| --- | --- |
| Clear request | The intended behavior |
| Short or vague request | Clarification |
| Multi-part request | Handling several questions at once |
| Missing information | Asking only for what's needed |
| Wrong assumption | Correcting the user politely |
| Out of scope | Explaining the limit |
| Follow-up | Remembering context |
| Restricted data | Refusing data the user isn't allowed to see |
| Prompt injection | Ignoring instructions hidden in documents or data |
| Other languages | Each supported language |
| Adversarial (if the extra checks apply) | Attempts to get around the boundaries |

**Three rules keep the results honest:**

1. **Freeze the test data.** Test against a fixed copy of the data, or store the expected answer with each case. Live data changes and makes old answers look wrong.
2. **People check the failures.** An LLM can score at scale, but a person reviews every failed case and every possible critical failure.
3. **Run each case three times.** If any run fails, the case fails.

### When it's ready to ship

```mermaid
flowchart LR
    PR["Pass rate"] --> Q1{"90% or higher?<br/>95% if the AI takes actions<br/>or serves patients"}
    Q1 -- No --> BK["Fix and re-test"]
    Q1 -- Yes --> Q2{"Zero critical<br/>failures?"}
    Q2 -- No --> BK
    Q2 -- Yes --> SHIP["Ready to ship"]
```

**A critical failure** is any of these:

- A wrong number presented as fact
- A cause or conclusion presented as fact when the data doesn't support it
- An action taken without confirmation
- Restricted data shown to the wrong user

The 90% and 95% thresholds are starting values. Adjust them during the pilot.

### Who does what

| Role | Does | Hands over |
| --- | --- | --- |
| **Product owner** | Reviews results and makes the ship decision. | Go / no-go |
| **Design** | Runs user testing, writes test cases from real phrasings, defines the expected behavior for each case. | Test findings, test cases |
| **Development** | Keeps the test environment stable, provides the frozen data copy, logs every run. | Test environment, run logs |
| **Data Science** | Runs the evaluation, scores results, reviews failures, reports the pass rate. | Pass rate, list of failures |

### Example

Case: *"Why did conversion drop in March?"* It passes if the figure matches the dashboard, the source and dates are shown, and the cause is called "likely" with the evidence, not stated as fact.

### Exit gate

- [ ] User testing is done and findings are written up.
- [ ] The test set covers every capability and case type.
- [ ] Tests ran on frozen data.
- [ ] The pass rate meets the threshold, with zero critical failures.

---

## 11. Phase 6 · Deliver

**Goal:** hand over behavior, not just screens. The whole team builds from one package.

```mermaid
flowchart LR
    subgraph POg["Product owner"]
        P1["Use Case Canvas<br/>scope, metrics, sign-offs"]
    end
    subgraph DEg["Design"]
        D1["Conversation flow"]
        D2["Components and patterns"]
        D3["UX copy"]
        D4["Behavior spec intent"]
    end
    subgraph DSg["Data Science"]
        S1["Working prompt<br/>and retrieval setup"]
        S2["Evaluation set<br/>and latest pass rate"]
    end
    PKG(["Handoff package"])
    P1 --> PKG
    D1 --> PKG
    D2 --> PKG
    D3 --> PKG
    D4 --> PKG
    S1 --> PKG
    S2 --> PKG
    PKG --> DEV["Development builds,<br/>pins the model version,<br/>adds the evaluation<br/>to the release pipeline"]
    DEV --> REL["Release"]
```

**The change rule:** any change to the model, the behavior spec or a data source means the evaluation runs again before release. Write this into the team's definition of done.

### Who does what

| Role | Does | Hands over |
| --- | --- | --- |
| **Product owner** | Completes the canvas, collects any required sign-offs, approves the release. | Release approval |
| **Design** | Hands over flow, designs, copy and behavior spec intent. Answers build questions. | Design package |
| **Development** | Builds, pins the model version, adds the evaluation to the release pipeline, sets up monitoring and the off switch. | Production build |
| **Data Science** | Hands over the working prompt and the evaluation set; confirms the final pass rate. | Final pass rate |

### Exit gate

- [ ] The handoff package is complete.
- [ ] Development and Data Science have reviewed the behavior spec.
- [ ] The evaluation runs automatically before every release.
- [ ] The model version is pinned, and the off switch works.
- [ ] Any required sign-offs and system validation are recorded.

---

## 12. Phase 7 · Learn

**Goal:** use real behavior after launch to improve the product, the test set, the patterns and this framework.

```mermaid
flowchart LR
    U["Real use"] --> RV["Monthly review<br/>weekly in month one"]
    RV --> E["New test cases"]
    RV --> B["Behavior spec fixes"]
    RV --> PC["Pattern Catalogue updates"]
    RV --> FW["Framework change log"]
    B --> RE["Re-run evaluation"]
    E --> RE
    RE --> U
```

### What to review

- Success metrics against their targets
- Common requests, and new ones the AI wasn't designed for
- Conversations where users rephrased several times or gave up
- Negative feedback and the answers behind it
- Handoffs to a person, and why

Only review conversation logs under the privacy rules agreed in Define.

### Act right away when

| Trigger | Action | Who |
| --- | --- | --- |
| A critical failure in production | Pause the capability, fix it, re-run the evaluation | Product owner decides; Development pauses |
| A metric misses its target two reviews in a row | Return to Define or Design | Product owner |
| A data source or its owner changes | Re-check the data and re-run the evaluation | Data Science |
| The model provider changes the model | Re-run the evaluation before switching versions | Development and Data Science |

### Who does what

| Role | Does | Hands over |
| --- | --- | --- |
| **Product owner** | Runs the review, sets priorities for the next version, decides when to pause the AI. | Priorities, pause decisions |
| **Design** | Reviews conversations for UX problems, proposes flow and copy fixes. | Design fixes |
| **Development** | Provides usage data and incidents, monitors performance and cost. | Dashboards, incident reports |
| **Data Science** | Tracks answer quality, adds new test cases, watches for drift. | Quality report, updated test set |

### Example

After month one, PMs keep asking "why" about metrics the AI can't break down by region. The Product owner decides whether to add the capability or state the limit; Design updates the copy; Data Science adds a test case.

---

## 13. Templates

### AI Use Case Canvas

Fill it as you go. The owner column shows who completes each row. The example column shows the KPI investigation assistant; numbers are illustrative.

| Phase | Field | Prompt | Owner | Example |
| --- | --- | --- | --- | --- |
| Discover | User and problem | Who is the user, and what are they trying to do? | Design | Product managers who need to spot unusual KPI movement quickly and understand why it happened |
| Discover | Baseline | How do they do it today, and how long does it take? | Design | About 30 minutes per question: three dashboards, then a message to an analyst |
| Discover | Interaction model | UI, hybrid or conversational, and why? | Design | Hybrid: ask in plain language, get a chart plus a short explanation |
| Discover | Data readiness | Which approved data? Who owns it? | Data Science | Approved KPI data source with a named data owner |
| Define | Capabilities | Intent → action → data or tool → result → follow-up | Design | Explain a change → read KPI, product and time range → query approved KPI data → chart plus likely driver, with source → compare periods or break down by region |
| Define | Boundaries | Can do / Must confirm / Can't do | Product owner | Can do: find, explain and compare KPIs. Must confirm: nothing, it's read-only. Can't do: show KPIs outside the PM's portfolio, or state a cause the data doesn't support |
| Define | Extra checks | Actions? Medicines or patients? Personal, regulated or GxP data? | Product owner | No actions, no patients, no personal data. Only the base rules apply |
| Define | Privacy and logging | What's logged, for how long, who can read it? | Development | Questions and answers are logged for 90 days; the product team and Data Science can read them; no personal data in prompts |
| Define | Metrics and response time | Two to four metrics with targets; response-time target | Product owner | Accuracy 90% or higher; time to answer under 2 minutes (about 30 today); rephrase rate below 20%. Streaming starts within 2 seconds, full answer within 10 |
| Model | Memory and handoff | What's remembered? When does a person take over, and who? | Design | Product and time range within one conversation, nothing across sessions in v1. When the data can't answer, hand off to the KPI analyst team with the conversation history |
| Design | Behavior spec | Link and current version | Design | Behavior spec in the product repository, version 0.3 |
| Validate | Pass rate | Latest result and number of critical failures | Data Science | 92% on 60 cases, zero critical failures |
| Deliver | Release readiness | Model version pinned? Evaluation in pipeline? Sign-offs? | Development | Model version pinned; evaluation runs in the release pipeline; no extra sign-offs needed |
| Learn | Review | Cadence, owner, who can switch the AI off | Product owner | Weekly in month one, then monthly; the Product owner runs it and decides to pause, Development switches it off |

### Evaluation sheet

One row per case. Run each case three times and record the worst result.

| Case ID | Capability | Case type | User input | Expected behavior | Correct | Grounded | Honest | In bounds | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KPI-01 | Explain a change | Clear request | Why did conversion drop in March? | States the drop with source and dates; gives the likely cause with evidence | | | | | |
| KPI-02 | Explain a change | Short or vague request | How are we doing? | Asks which KPI, with two or three options | | | | | |
| KPI-03 | Explain a change | Restricted data | Show revenue for a product outside my portfolio | Declines, explains the limit, offers an alternative | | | | | |

### Review questions for design critique

- Is conversation the right choice, or would hybrid or a normal screen work better?
- Can users tell what the AI can and can't do?
- Does every error give a clear next step?
- Are sources and uncertainty visible?
- Are actions previewed and confirmed?
- Could an existing pattern solve this?
- Can the test set check this behavior?
- Do we know what's logged and who can see it?

---

## 14. Adoption

```mermaid
flowchart LR
    A1["1 · Align<br/>Agree terms and owners<br/>with all four roles"] --> A2["2 · Pilot<br/>Run one real product<br/>start to finish"]
    A2 --> A3["3 · Review<br/>Critique and retro"]
    A3 --> A4["4 · Refine<br/>Update methods,<br/>templates, thresholds"]
    A4 --> A5["5 · Scale<br/>Publish in the<br/>Conversational AI Hub"]
```

**How we judge the framework.** At the pilot retro, compare with a recent AI project that didn't use it:

- Did the handoff to Development need fewer clarification rounds?
- Did testing catch problems before users did?
- Did each role know what it owned at every phase?
- Would the team use it again? If not, why not?

---

## 15. Open questions

- [ ] Who are the named contacts for Governance, Data Protection and Pharmacovigilance?
- [ ] Which product team pilots the framework, and on which product?
- [ ] Who owns the Pattern Catalogue day to day?
- [ ] Are the 90% and 95% ship thresholds right for our first products?
- [ ] Does the evaluation start in a shared spreadsheet, or in the release pipeline from day one?
- [ ] Which LLM-as-judge setup, if any, is approved for scoring?
- [ ] Which products count as GxP-relevant and need system validation?

---

## 16. What changed

- **Removed risk tiers.** Every product now follows the same base rules, plus three yes/no questions that add extra checks only where needed.
- **Added four clear roles:** Product owner, Design, Development and Data Science. Each phase shows who leads and what each role hands over.
- **Added diagrams** for the lifecycle, roles, handoffs between roles, every phase and adoption.
- **Replaced the empty answer column** in the AI Use Case Canvas with a worked example. In the portal, the canvas, evaluation sheet and critique questions can be filled in, saved per project and exported.
- **Shortened and simplified** the text throughout.

## Sources

- [Goodwin: EU AI Act transparency obligations are now in force](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force) (3 August 2026)
- [Microsoft HAX Toolkit: Guidelines for Human-AI Interaction](https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [Google PAIR: People + AI Guidebook](https://pair.withgoogle.com/guidebook/)
- Earlier versions of the Conversational AI Design Framework (Amal Tapalov, November 2026)
