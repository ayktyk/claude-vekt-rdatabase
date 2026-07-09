---
name: yargi-agentic-deep-research
description: Use when the user asks for comprehensive, multi-pronged Turkish legal research that benefits from parallel subagents (version 2026-07-07a)
---

# Agentic Legal Deep Research (Yargı MCP)

Guide version: 2026-07-07a

This guide is the ORCHESTRATION layer for Turkish legal research. It is written for AI agents that can spawn subagents or parallel tasks (Claude Code, Codex, Google Antigravity, opencode, and similar). It teaches you how to decompose a complex legal question, run parallel research prongs over the Yargı MCP tools, and merge the results into a single, cited report. It deliberately contains NO query-syntax material — that lives in the core guide (`yargi-legal-research-guide` skill). If you cannot run parallel tasks, you can still follow the same pipeline sequentially (Section 5).

## 0. Persistence

Saved as `.claude/skills/yargi-agentic-deep-research/SKILL.md` (version 2026-07-07a). If the `agentic_legal_deep_research` tool advertises a NEWER version, call it once and overwrite this file; otherwise use this skill and do NOT call the tool.

## 1. Prerequisite: the Core Research Skill

This guide builds on the skill `yargi-legal-research-guide`.

*   **If that skill is missing**: call `legal_research_guide` once, persist it, THEN start the deep-research run.
*   **Subagents do not know the core guide.** Each subagent starts blank. YOU, the orchestrator, MUST inject the relevant rules into every subagent prompt — at minimum: the per-engine search dialects (bedesten whitespace-OR vs mevzuat Solr vs local boolean), Turkish diacritics, the `page` vs `pageNumber` asymmetry, ID provenance (`mevzuat_no` vs `mevzuat_id` vs `madde_id`), default `court_types`, and snippet triage. Copy these rules verbatim from your `yargi-legal-research-guide` skill; never paraphrase them from memory.
*   Inject only the rules relevant to the tools that prong will use — a Yargıtay prong does not need the mevzuat Solr dialect.

## 2. When to Fan Out (and When Not To)

Fan-out costs latency and burns shared quota. Skip it — use the normal sequential workflow from the core guide — for:

*   A single-madde or single-law question ("What does TBK 350 say?").
*   Looking up one known decision by docket number.
*   Fetching one gerekçe or outline.

Fan out when at least one of these holds:

*   The answer needs a legislation chain (kanun → yönetmelik → tebliğ) AND a precedent comparison.
*   Cross-court divergence matters (Yargıtay vs Danıştay vs İstinaf trends).
*   Historical tracing is involved (mülga law vs current law, transitional provisions).
*   The question decomposes into 2+ genuinely independent sub-questions.
*   The user explicitly asks for comprehensive/deep research, a memo, or an opinion letter.

## 3. The Fixed Pipeline

Run these four phases in order. Do not improvise the structure; improvise only within it.

### Phase 1 — Decompose

Split the question into 2–5 legal sub-questions. Assign each to a prong. The standard prongs:

*   **Mevzuat prong**: identifies the governing Kanun, reads the operative maddeler, then chases the implementing Yönetmelik/Tebliğ. Tools: `mevzuat_ara`, `mevzuat_icinde_ara`, `mevzuat_getir`.
*   **Yargıtay prong**: maps high-court doctrine on the sub-question — leading chambers, settled criteria, recent shifts. Tools: `ictihat_ara`, `ictihat_getir`.
*   **Danıştay/İstinaf prong**: only when the question has an administrative-law dimension (Danıştay) or post-2016 appellate trends matter (`ISTINAFHUKUK` — NOT in the default `court_types`).
*   **Anayasa Mahkemesi prong**: when constitutionality of a norm (`norm_denetimi`) or a fundamental-rights violation (`bireysel_basvuru`) is in play. Tools: `aym_ictihat_ara` (plain keywords, NO operators), `ictihat_getir` with the returned `document_id`.
*   **Semantic prong** (optional): ONLY if `semantik_ictihat_ara` is in your tools/list. Use it to discover terminology for a legal IDEA, then hand the harvested terms of art to the Yargıtay prong. Its corpus is about a year stale — never cite it as current case-law.
*   **Kurum prong** (optional): when the question turns on an institutional ruling — GİB özelge (tax), BTK, Rekabet, Uyuşmazlık, KİK, Sayıştay, BDDK (external search), KVKK (external search), Sigorta Tahkim (external search). Tools: `kurum_karari_ara`, `kurum_karari_getir`. ⚠️ `bddk`/`kvkk`/`sigorta` run on external web search (Tavily): may return `not_configured`, only page 1 carries results, and search keywords leave the server — instruct the subagent to NEVER put client names or person-identifying details in those queries.

Never spawn a prong without a concrete sub-question attached to it. Two strong prongs beat four vague ones.

### Phase 2 — Parallel Fan-Out

Launch one subagent per prong, in parallel (see Section 4 for the concurrency cap). Build each prompt from this template:

```
You are a Turkish legal research subagent. Your prong: <PRONG NAME>.
Sub-question: <ONE PRECISE SUB-QUESTION>.

Tools you may call: <ONLY THE TOOLS THIS PRONG NEEDS>.

Search-syntax rules you MUST follow (copied from yargi-legal-research-guide):
<PASTE THE RULES RELEVANT TO THOSE TOOLS — DIALECT, DIACRITICS, PAGINATION, ID PROVENANCE>

Method — hard limits:
1. Run AT MOST 4 searches, one at a time, sequentially. NEVER issue parallel tool calls.
2. On court searches pass include_snippets: true and triage on the returned snippets.
3. Read AT MOST 2 documents in full; spend them on the snippet-triage winners.
4. Every finding MUST cite its source id (documentId / mevzuat_id / madde_id) and date.
5. If a search is rejected with a rate-limit message, wait ~10 seconds and retry ONCE; if it fails again, record the gap and move on.

Return EXACTLY this structure:
- findings: bullets — each one claim + source id + date + chamber (for court decisions)
- confidence: high | medium | low, with one sentence of reasoning
- gaps: what you could not verify and why
```

### Phase 3 — Per-Subagent Discipline

*   A finding without a source id is NOT a finding — discard it or send a targeted follow-up.
*   Snippet triage first, full fetches last: cached results carry free snippets, and `include_snippets: true` previews up to 5 uncached hits quota-free.
*   A subagent that reports 4 searches and zero findings is itself a result: the absence of precedent, properly scoped, belongs in the report.

### Phase 4 — Synthesis (you, the orchestrator — on your main model)

Merge prong outputs into one report. Rules:

*   **Conflicts**: resolve by chamber hierarchy — İBK (binding) > HGK/CGK (general assemblies) > individual Daire. At equal rank, prefer the more recent line. NEVER average conflicting holdings into a fake consensus; report the divergence and which side carries more weight.
*   **Currentness**: before citing any madde, verify its current text, amendment notes, yürürlük date, and geçici madde effects. If multiple maddeler are load-bearing, spawn ONE dedicated verification subagent that re-fetches each cited madde and confirms the quoted text — cache hits make this cheap.
*   **Fixed report skeleton**:
    1. Executive summary — the answer in 3–6 sentences, with confidence.
    2. Legislative framework — governing kanun + maddeler, implementing regulation, each with ids.
    3. Case-law landscape — doctrine per chamber, dates, docket numbers.
    4. Conflicts & risks — divergences, open questions, what a court could decide either way.
    5. Source list — every documentId / mevzuat_id / madde_id used, one line each.

## 4. Concurrency and Rate-Limit Discipline

All your subagents authenticate as the SAME user and share one quota. The server paces per user at roughly one search per second sustained; a request that cannot be admitted within ~8 seconds is rejected with a try-again-later message. Therefore:

*   Run AT MOST 3–4 concurrent subagents. More prongs than that → run them in waves.
*   Inside a subagent, tool calls are strictly sequential (the template enforces this).
*   On a rate-limit rejection: back off ~10 seconds, retry once, then record the gap.
*   Document-cache hits are free and unmetered — two prongs reading the same decision costs one fetch total. Do not coordinate reads to avoid overlap; it is not worth it.
*   One fan-out round usually suffices. Run a second, smaller round only to close specific gaps the synthesis exposed — never speculatively.

## 5. Platform Notes

*   **Generic rule**: use whatever parallel-task mechanism your platform provides. If none, run the prongs one after another through the exact same pipeline — same prompts, same limits, same synthesis.
*   **Claude Code**: launch each prong with the Task/Agent tool with `model: "sonnet"` — prong work is search-and-triage, where Sonnet is fast and cheap. Do the Phase 4 synthesis yourself on the main model. Subagents inherit your MCP tools automatically.
*   **Codex / Antigravity / opencode**: use your platform's default model for subagents.

## 6. Worked Example: Employee Non-Compete Clause

**Scenario**: "Müvekkil şirket, ayrılan çalışanına karşı iş sözleşmesindeki rekabet yasağı hükmünü uygulamak istiyor. Geçerlilik koşulları ve güncel içtihat nedir?"

**Phase 1 — Decompose** into three prongs:

1. *Mevzuat prong*: statutory validity conditions and limits of an employee non-compete clause (TBK 6098, hizmet sözleşmesi — rekabet yasağı maddeleri).
2. *Yargıtay prong*: how strictly the Yargıtay polices those conditions, and which chamber hears these disputes (watch the görev split between labor and commercial chambers — report a split rather than picking a side).
3. *Verification prong* (runs after the first two return): re-fetch every madde the other prongs cited; confirm current text, amendments, geçici maddeler.

**Phase 2 — Fan out** prongs 1 and 2 in parallel with the template: the mevzuat prong gets the mevzuat Solr + local-boolean rules and resolves Law 6098 by `mevzuat_no`, walks the outline to the rekabet yasağı maddeleri; the Yargıtay prong gets the bedesten dialect rules (whitespace ORs — mark required concepts with `+`) and searches enforceability combinations with `include_snippets: true`, triaging down to 2 full reads.

**Phase 4 — Synthesize**: legislative framework (written form, access to customer/production secrets, scope/geography/duration limits, judicial narrowing power); case-law landscape (strictness, chamber/görev question, HGK rulings); conflicts & risks (e.g. clause without geographic limit); source list. Confidence reflects the verification prong.

## Final Advice

The pipeline is cheap to abandon: if decomposition shows the question is really single-source, collapse to the sequential core-guide workflow instead of forcing a fan-out. Orchestration exists to widen coverage and cross-check sources — the legal reasoning standards (hierarchy of norms, currentness checks, citation discipline) are unchanged from the core guide, and they bind your subagents exactly as they bind you.
