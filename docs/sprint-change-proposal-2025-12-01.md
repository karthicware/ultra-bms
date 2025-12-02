# Sprint Change Proposal: UI Component Sourcing Standardization

**Date:** 2025-12-01
**Author:** Bob (Scrum Master)
**Status:** APPROVED
**Scope:** Minor - Direct implementation by development team

---

## 1. Issue Summary

### Problem Statement
UI component sourcing is not standardized across stories. Current stories reference generic shadcn/ui components without leveraging pre-built blocks from shadcn-studio-mcp, which could accelerate development and ensure UI consistency.

### Context
- 6 dashboard stories in `ready-for-dev` status (Epic 8: Stories 8-1, 8-3, 8-4, 8-5, 8-6, 8-7)
- shadcn-studio-mcp provides pre-built dashboard components that align with project requirements
- MCP integration already configured in `.mcp.json`

### Evidence
- shadcn-studio-mcp offers 10+ statistics components, 23+ chart components, 19+ widget components, and 7+ datatable components
- Components include: KPI cards with trends, financial dashboards, timeline widgets, sortable datatables
- All components are built on shadcn/ui foundation, ensuring compatibility

---

## 2. Impact Analysis

### Epic Impact
- **Epic 8 (Dashboard & Reporting):** No scope changes. Dev Notes updates only.
- **Future Epics:** Process improvement applies to all future UI stories.

### Artifact Conflicts
- **PRD:** None - PRD specifies "shadcn/ui for components"; shadcn-studio-mcp extends shadcn/ui
- **Architecture:** None - MCP integration exists, tech stack unchanged
- **UI/UX:** None - shadcn-studio-mcp provides consistent, accessible components

### Stories Affected
| Story | Status | Change Type |
|-------|--------|-------------|
| 8-1 Executive Summary Dashboard | ready-for-dev | Dev Notes update |
| 8-3 Occupancy Dashboard | ready-for-dev | Dev Notes update |
| 8-4 Maintenance Dashboard | ready-for-dev | Dev Notes update |
| 8-5 Vendor Dashboard | ready-for-dev | Dev Notes update |
| 8-6 Finance Dashboard | ready-for-dev | Dev Notes update |
| 8-7 Assets Dashboard | ready-for-dev | Dev Notes update |

---

## 3. Recommended Approach

### Selected Path: Direct Adjustment
Add "UI Component Sourcing" section to Dev Notes of affected stories with:
1. **Primary:** Use shadcn-studio-mcp blocks/components
2. **Fallback:** Use shadcn-mcp if no matching component found

### Rationale
- Low effort: Only Dev Notes updates required
- Low risk: No code changes, no scope changes
- High value: Improves development velocity and UI consistency
- Compatible: shadcn-studio-mcp builds on existing shadcn/ui foundation

### Effort Estimate: Low
### Risk Level: Low

---

## 4. Detailed Change Proposals

### Story 8-1: Executive Summary Dashboard

**UI Component Mapping:**
| UI Element | shadcn-studio-mcp Block | Fallback |
|------------|-------------------------|----------|
| KPI Cards (Net Profit, Occupancy, Overdue, Receivables) | `statistics-component-02` | shadcn/ui Card |
| Priority Maintenance Queue | `widget-component-17` | Custom Card + List |
| PM Jobs Chart | `chart-component-07` or `chart-component-11` | Recharts BarChart |
| Lease Expirations Timeline | Built with Recharts | - |
| Critical Alerts Panel | `widget-component-10` | Custom Card |
| Property Comparison Table | `datatable-component-01` | shadcn/ui Table |

---

### Story 8-3: Occupancy Dashboard

**UI Component Mapping:**
| UI Element | shadcn-studio-mcp Block | Fallback |
|------------|-------------------------|----------|
| KPI Cards (Occupancy, Vacant, Expiring, Rent/SqFt) | `statistics-component-02` | shadcn/ui Card |
| Portfolio Occupancy Donut | `chart-component-03` | Recharts PieChart |
| Lease Expirations Bar Chart | Built with Recharts | - |
| Upcoming Lease Expirations Table | `datatable-component-04` | shadcn/ui Table |
| Activity Feed | `widget-component-17` | Custom Timeline |

---

### Story 8-4: Maintenance Dashboard

**UI Component Mapping:**
| UI Element | shadcn-studio-mcp Block | Fallback |
|------------|-------------------------|----------|
| Job KPIs | `statistics-component-01` | shadcn/ui Card |
| Jobs by Status Pie | `chart-component-03` | Recharts PieChart |
| Priority/Category Bar Charts | Built with Recharts | - |
| High Priority/Overdue List | `widget-component-17` | Custom Card + List |

---

### Story 8-5: Vendor Dashboard

**UI Component Mapping:**
| UI Element | shadcn-studio-mcp Block | Fallback |
|------------|-------------------------|----------|
| Vendor KPIs | `statistics-component-04` | shadcn/ui Card |
| Jobs by Specialization | Built with Recharts | - |
| Performance Scatter Plot | `chart-component-13` | Recharts ScatterChart |
| Expiring Documents | `widget-component-07` | Custom Card |
| Top Vendors Table | `datatable-component-04` | shadcn/ui Table |

---

### Story 8-6: Finance Dashboard

**UI Component Mapping:**
| UI Element | shadcn-studio-mcp Block | Fallback |
|------------|-------------------------|----------|
| Finance YTD KPIs | `statistics-component-05` | shadcn/ui Card |
| Income vs Expense Chart | `chart-component-11` | Recharts ComposedChart |
| Expense Categories Donut | `chart-component-03` | Recharts PieChart |
| Receivables Aging Table | `datatable-component-05` | shadcn/ui Table |
| PDC Status Widget | `widget-component-03` | Custom Card |

---

### Story 8-7: Assets Dashboard

**UI Component Mapping:**
| UI Element | shadcn-studio-mcp Block | Fallback |
|------------|-------------------------|----------|
| Asset KPIs | `statistics-component-02` | shadcn/ui Card |
| Assets by Category Donut | `chart-component-03` | Recharts PieChart |
| Maintenance Spend Bar | `chart-component-05` | Recharts BarChart |
| Overdue PM List | `widget-component-17` | Custom Card + List |
| Depreciation Summary | `statistics-component-07` | shadcn/ui Card |

---

## 5. Implementation Handoff

### Scope Classification: Minor
Direct implementation by development team.

### Handoff Recipients
- **Development Team:** Update story Dev Notes sections
- **Scrum Master (Bob):** Verify updates applied correctly

### Responsibilities
1. SM updates each story's Dev Notes with UI Component Sourcing section
2. Dev team uses mapped components when implementing stories
3. Dev team falls back to shadcn-mcp or manual components if needed

### Success Criteria
- All 6 dashboard story files updated with UI Component Sourcing section
- Developers reference shadcn-studio-mcp as primary source during implementation
- Consistent UI components across all dashboards

---

## 6. Approval Record

**Approved by:** Nata
**Date:** 2025-12-01
**Conditions:** None

---

## Appendix: shadcn-studio-mcp Installation Commands

When implementing, use these commands to install blocks:

```bash
# Statistics Components
npx shadcn@latest add "https://shadcn-studio.com/r/statistics-component-01"
npx shadcn@latest add "https://shadcn-studio.com/r/statistics-component-02"
npx shadcn@latest add "https://shadcn-studio.com/r/statistics-component-04"
npx shadcn@latest add "https://shadcn-studio.com/r/statistics-component-05"
npx shadcn@latest add "https://shadcn-studio.com/r/statistics-component-07"

# Chart Components
npx shadcn@latest add "https://shadcn-studio.com/r/chart-component-03"
npx shadcn@latest add "https://shadcn-studio.com/r/chart-component-05"
npx shadcn@latest add "https://shadcn-studio.com/r/chart-component-07"
npx shadcn@latest add "https://shadcn-studio.com/r/chart-component-11"
npx shadcn@latest add "https://shadcn-studio.com/r/chart-component-13"

# Widget Components
npx shadcn@latest add "https://shadcn-studio.com/r/widget-component-03"
npx shadcn@latest add "https://shadcn-studio.com/r/widget-component-07"
npx shadcn@latest add "https://shadcn-studio.com/r/widget-component-10"
npx shadcn@latest add "https://shadcn-studio.com/r/widget-component-17"

# DataTable Components
npx shadcn@latest add "https://shadcn-studio.com/r/datatable-component-01"
npx shadcn@latest add "https://shadcn-studio.com/r/datatable-component-04"
npx shadcn@latest add "https://shadcn-studio.com/r/datatable-component-05"
```

---

*Generated by BMad Method Correct-Course Workflow*
