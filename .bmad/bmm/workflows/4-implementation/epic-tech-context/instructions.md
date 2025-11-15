<!-- BMAD BMM Tech Spec Workflow Instructions (v6) -->

```xml
<critical>The workflow execution engine is governed by: {project_root}/.bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language}</critical>
<critical>This workflow generates a comprehensive Technical Specification from PRD and Architecture, including detailed design, NFRs, acceptance criteria, and traceability mapping.</critical>
<critical>If required inputs cannot be auto-discovered HALT with a clear message listing missing documents, allow user to provide them to proceed.</critical>

<workflow>
  <step n="1" goal="Collect inputs and discover next epic" tag="sprint-status">
    <action>Identify PRD and Architecture documents from recommended_inputs. Attempt to auto-discover at default paths.</action>
    <ask if="inputs are missing">ask the user for file paths. HALT and wait for docs to proceed</ask>

    <!-- Intelligent Epic Discovery -->
    <critical>MUST read COMPLETE {sprint-status} file to discover next epic</critical>
    <action>Read ALL development_status entries</action>
    <action>Find all epics with status "backlog" (not yet contexted)</action>
    <action>Identify the FIRST backlog epic as the suggested default</action>

    <check if="backlog epics found">
      <output>📋 **Next Epic Suggested:** Epic {{suggested_epic_id}}: {{suggested_epic_title}}</output>
      <ask>Use this epic?
- [y] Yes, use {{suggested_epic_id}}
- [n] No, let me specify a different epic_id
      </ask>

      <check if="user selects 'n'">
        <ask>Enter the epic_id you want to context</ask>
        <action>Store user-provided epic_id as {{epic_id}}</action>
      </check>

      <check if="user selects 'y'">
        <action>Use {{suggested_epic_id}} as {{epic_id}}</action>
      </check>
    </check>

    <check if="no backlog epics found">
      <output>✅ All epics are already contexted!

No epics with status "backlog" found in sprint-status.yaml.
      </output>
      <ask>Do you want to re-context an existing epic? Enter epic_id or [q] to quit:</ask>

      <check if="user enters epic_id">
        <action>Store as {{epic_id}}</action>
      </check>

      <check if="user enters 'q'">
        <action>HALT - No work needed</action>
      </check>
    </check>

    <action>Resolve output file path using workflow variables and initialize by writing the template.</action>
  </step>

  <step n="1.5" goal="Discover and load project documents">
    <invoke-protocol name="discover_inputs" />
    <note>After discovery, these content variables are available: {prd_content}, {gdd_content}, {architecture_content}, {ux_design_content}, {epics_content} (will load only epic-{{epic_id}}.md if sharded), {document_project_content}</note>
    <action>Extract {{epic_title}} from {prd_content} or {epics_content} based on {{epic_id}}.</action>
  </step>

  <step n="2" goal="Validate epic exists in sprint status" tag="sprint-status">
    <action>Look for epic key "epic-{{epic_id}}" in development_status (already loaded from step 1)</action>
    <action>Get current status value if epic exists</action>

    <check if="epic not found">
      <output>⚠️ Epic {{epic_id}} not found in sprint-status.yaml

This epic hasn't been registered in the sprint plan yet.
Run sprint-planning workflow to initialize epic tracking.
      </output>
      <action>HALT</action>
    </check>

    <check if="epic status == 'contexted'">
      <output>ℹ️ Epic {{epic_id}} already marked as contexted

Continuing to regenerate tech spec...
      </output>
    </check>
  </step>

  <step n="3" goal="Overview and scope">
    <action>Read COMPLETE found {recommended_inputs}.</action>
    <template-output file="{default_output_file}">
      Replace {{overview}} with a concise 1-2 paragraph summary referencing PRD context and goals
      Replace {{objectives_scope}} with explicit in-scope and out-of-scope bullets
      Replace {{system_arch_alignment}} with a short alignment summary to the architecture (components referenced, constraints)
    </template-output>
  </step>

  <step n="4" goal="Detailed design">
    <action>Derive concrete implementation specifics from all {recommended_inputs} (CRITICAL: NO invention). If a epic tech spec precedes this one and exists, maintain consistency where appropriate.</action>
    <template-output file="{default_output_file}">
      Replace {{services_modules}} with a table or bullets listing services/modules with responsibilities, inputs/outputs, and owners
      Replace {{data_models}} with normalized data model definitions (entities, fields, types, relationships); include schema snippets where available
      Replace {{apis_interfaces}} with API endpoint specs or interface signatures (method, path, request/response models, error codes)
      Replace {{workflows_sequencing}} with sequence notes or diagrams-as-text (steps, actors, data flow)
    </template-output>
  </step>

  <step n="5" goal="Non-functional requirements">
    <template-output file="{default_output_file}">
      Replace {{nfr_performance}} with measurable targets (latency, throughput); link to any performance requirements in PRD/Architecture
      Replace {{nfr_security}} with authn/z requirements, data handling, threat notes; cite source sections
      Replace {{nfr_reliability}} with availability, recovery, and degradation behavior
      Replace {{nfr_observability}} with logging, metrics, tracing requirements; name required signals
    </template-output>
  </step>

  <step n="6" goal="Dependencies and integrations">
    <action>Scan repository for dependency manifests (e.g., package.json, pyproject.toml, go.mod, Unity Packages/manifest.json).</action>
    <template-output file="{default_output_file}">
      Replace {{dependencies_integrations}} with a structured list of dependencies and integration points with version or commit constraints when known
    </template-output>
  </step>

  <step n="7" goal="Acceptance criteria and traceability">
    <action>Extract acceptance criteria from PRD; normalize into atomic, testable statements.</action>
    <template-output file="{default_output_file}">
      Replace {{acceptance_criteria}} with a numbered list of testable acceptance criteria
      Replace {{traceability_mapping}} with a table mapping: AC → Spec Section(s) → Component(s)/API(s) → Test Idea
    </template-output>
  </step>

  <step n="7.5" goal="Define UI component strategy for epic (shadcn/ui MCP)">
    <critical>Establishes component strategy at epic level, providing guidance for all stories in this epic</critical>

    <action>Based on PRD requirements and UX Design Spec, identify all UI component categories needed for this epic</action>
    <action>Use MCP shadcn tools to map components:</action>
      - Search for relevant components: mcp__shadcn__search_items_in_registries
      - View component details: mcp__shadcn__view_items_in_registries
      - Get usage examples: mcp__shadcn__get_item_examples_from_registries

    <action>Review UX Design Spec Section 6 (Component Library Strategy) for component recommendations specific to this epic's module</action>
    <action>Identify custom components needed (those without shadcn equivalents with clear rationale)</action>

    <template-output file="{default_output_file}">
      Replace {{ui_component_strategy}} with:

      ## UI Component Strategy

      ### shadcn/ui Components Required

      **Forms & Inputs:**
      - form, input, textarea, select, checkbox, radio-group
      - date-picker, combobox (for searchable dropdowns)
      - [List specific to epic needs]

      **Data Display:**
      - table, data-table (for list views)
      - card (for summary displays)
      - badge (for status indicators)
      - [Epic-specific components]

      **Navigation & Actions:**
      - button (primary, secondary, destructive variants)
      - dialog, sheet (for modals and side panels)
      - tabs, breadcrumb
      - [Epic-specific navigation]

      **Feedback:**
      - toast, alert
      - skeleton (for loading states)
      - [Epic-specific feedback components]

      **Installation Command:**
      ```bash
      npx shadcn@latest add [list all components space-separated]
      ```

      ### Custom Components Required

      **[ComponentName]**
      - **Purpose:** [What it does]
      - **Rationale:** [Why shadcn alternative doesn't exist]
      - **Composition:** [Built from which shadcn primitives, if any]
      - **Stories:** [Which stories in this epic will use it]

      ### Component Usage Guidelines for This Epic

      - [Epic-specific patterns, e.g., "All forms use standard validation pattern from Story 2.1"]
      - [Consistency requirements, e.g., "Status badges follow color scheme: blue=draft, green=approved, red=rejected"]
      - [Reference to UX Design Spec sections relevant to this epic]
      - [Priority order: 1) Use shadcn/ui, 2) Compose from shadcn primitives, 3) Custom only if necessary]
    </template-output>

    <note>This component strategy guides all stories in the epic, ensuring consistency and preventing redundant component discovery</note>
  </step>

  <step n="8" goal="Risks and test strategy">
    <template-output file="{default_output_file}">
      Replace {{risks_assumptions_questions}} with explicit list (each item labeled as Risk/Assumption/Question) with mitigation or next step
      Replace {{test_strategy}} with a brief plan (test levels, frameworks, coverage of ACs, edge cases)
    </template-output>
  </step>

  <step n="9" goal="Validate and mark epic contexted" tag="sprint-status">
    <invoke-task>Validate against checklist at {installed_path}/checklist.md using .bmad/core/tasks/validate-workflow.xml</invoke-task>

    <!-- Mark epic as contexted -->
    <action>Load the FULL file: {sprint_status}</action>
    <action>Find development_status key "epic-{{epic_id}}"</action>
    <action>Verify current status is "backlog" (expected previous state)</action>
    <action>Update development_status["epic-{{epic_id}}"] = "contexted"</action>
    <action>Save file, preserving ALL comments and structure including STATUS DEFINITIONS</action>

    <check if="epic key not found in file">
      <output>⚠️ Could not update epic status: epic-{{epic_id}} not found</output>
    </check>

    <output>**✅ Tech Spec Generated Successfully, {user_name}!**

**Epic Details:**
- Epic ID: {{epic_id}}
- Epic Title: {{epic_title}}
- Tech Spec File: {{default_output_file}}
- Epic Status: contexted (was backlog)

**Note:** This is a JIT (Just-In-Time) workflow - run again for other epics as needed.

**Next Steps:**
1. Load SM agent and run `create-story` to begin implementing the first story under this epic.
    </output>
  </step>

</workflow>
```
