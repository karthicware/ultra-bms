# AI Code Patterns to Avoid

This document captures error patterns encountered during development. AI assistants should NOT generate code with these patterns.

**Purpose:** Prevent recurring bugs by documenting anti-patterns with their fixes.

**Usage:** Reference before generating JPA/Hibernate native queries with PostgreSQL.

---

## Table of Contents

1. [Quick Reference - Type Casting](#quick-reference---type-casting)
2. [Pattern Categories](#pattern-categories)
   - [PostgreSQL Native Query Parameter Type Casting](#1-postgresql-native-query-parameter-type-casting)
3. [Error Log](#error-log)
4. [Contributing](#contributing)

---

## Quick Reference - Type Casting

### Java to PostgreSQL Type Mapping

| Java Type | PostgreSQL CAST | Example |
|-----------|-----------------|---------|
| UUID | `CAST(:param AS UUID)` | `CAST(:propertyId AS UUID)` |
| LocalDate | `CAST(:param AS DATE)` | `CAST(:startDate AS DATE)` |
| LocalDateTime | `CAST(:param AS TIMESTAMP)` | `CAST(:asOfDate AS TIMESTAMP)` |
| Integer/int | `CAST(:param AS INTEGER)` | `CAST(:days AS INTEGER)` |
| String | `CAST(:param AS VARCHAR)` | `CAST(:status AS VARCHAR)` |
| Long | `CAST(:param AS BIGINT)` | `CAST(:count AS BIGINT)` |
| Float/Double | `CAST(:param AS FLOAT)` | `CAST(:rate AS FLOAT)` |
| BigDecimal | `CAST(:param AS DECIMAL)` | `CAST(:amount AS DECIMAL)` |
| JSON/JSONB | `CAST(:param AS JSONB)` | `CAST(:categoryJson AS JSONB)` |
| Text | `CAST(:param AS TEXT)` | `CAST(:categories AS TEXT)` |

### Golden Rules

| Rule | Anti-Pattern | Correct Pattern |
|------|--------------|-----------------|
| Nullable params | `:param IS NULL` | `CAST(:param AS TYPE) IS NULL` |
| Type casting | `:param::type` | `CAST(:param AS TYPE)` |
| Date arithmetic | `CURRENT_DATE + :days` | `CURRENT_DATE + CAST(:days AS INTEGER)` |
| Interval math | `INTERVAL '1 month' * :n` | `CAST(:n AS INTEGER) * INTERVAL '1 month'` |
| Complex GROUP BY | CASE in both SELECT and GROUP BY | Use CTE to compute first |
| Literal integers | `CURRENT_DATE + 7` | `CURRENT_DATE + CAST(7 AS INTEGER)` |
| EXTRACT results | `EXTRACT(...)::integer` | `CAST(EXTRACT(...) AS INTEGER)` |
| JSONB contains | `:param::jsonb` | `CAST(:param AS JSONB)` |
| Transient fields | `entity.computed_field` in SQL | Use actual DB columns or enum values |

---

## Pattern Categories

### 1. PostgreSQL Native Query Parameter Type Casting

**Problem:** PostgreSQL cannot infer parameter types in certain JPA/Hibernate native query contexts.

**Common Errors:**
- `ERROR: could not determine data type of parameter $1`
- `QueryParameterException: No argument for named parameter ':paramName::type'`
- `ERROR: column must appear in GROUP BY clause`

#### 1.1 Uncast NULL Checks

```sql
-- BAD
WHERE (:propertyId IS NULL OR column = :propertyId)

-- GOOD
WHERE (CAST(:propertyId AS UUID) IS NULL OR column = :propertyId)
```

#### 1.2 PostgreSQL Cast Syntax (::)

```sql
-- BAD: Hibernate interprets ::type as parameter name
FROM generate_series(:startDate::date, :endDate::date, '1 month')
WHERE column < :asOfDate::timestamp

-- GOOD: Use CAST() function
FROM generate_series(CAST(:startDate AS DATE), CAST(:endDate AS DATE), CAST('1 month' AS INTERVAL))
WHERE column < CAST(:asOfDate AS TIMESTAMP)
```

#### 1.3 Uncast Arithmetic Operations

```sql
-- BAD
WHERE column BETWEEN CURRENT_DATE AND CURRENT_DATE + :days
SELECT INTERVAL '1 month' * :months

-- GOOD
WHERE column BETWEEN CURRENT_DATE AND CURRENT_DATE + CAST(:days AS INTEGER)
SELECT CAST(:months AS INTEGER) * INTERVAL '1 month'
```

#### 1.4 GROUP BY with CASE Expressions

```sql
-- BAD: Parameter in repeated CASE causes issues
SELECT
    CASE WHEN :param - column <= 30 THEN 'A' ELSE 'B' END as bucket,
    COUNT(*)
FROM table
GROUP BY
    CASE WHEN :param - column <= 30 THEN 'A' ELSE 'B' END

-- GOOD: Use CTE to compute derived column first
WITH computed AS (
    SELECT id, amount,
        CASE
            WHEN CAST(:param AS DATE) - column <= 30 THEN 'A'
            ELSE 'B'
        END as bucket
    FROM table
)
SELECT bucket, COUNT(*), SUM(amount)
FROM computed
GROUP BY bucket
```

---

## Error Log

### 2025-12-02: Dashboard Repository Fixes

**Files Affected:**

| Repository | Patterns Fixed |
|------------|----------------|
| OccupancyDashboardRepositoryImpl | UUID null check, INTEGER cast for days/months |
| MaintenanceDashboardRepositoryImpl | UUID null check, TIMESTAMP cast, VARCHAR cast |
| FinanceDashboardRepositoryImpl | UUID null check, DATE cast, generate_series, CTE |
| DashboardRepositoryImpl | UUID null check, TIMESTAMP cast, INTEGER cast, DATE cast |

**Errors Encountered:**

<details>
<summary><b>Error 1:</b> UUID NULL check failure</summary>

```
ERROR: could not determine data type of parameter $1
```
```sql
-- FAILED
AND (:propertyId IS NULL OR tc.property_id = :propertyId)

-- FIXED
AND (CAST(:propertyId AS UUID) IS NULL OR tc.property_id = :propertyId)
```
</details>

<details>
<summary><b>Error 2:</b> Hibernate misinterpreting :: syntax</summary>

```
QueryParameterException: No argument for named parameter ':endDate::date'
```
```sql
-- FAILED
FROM generate_series(:startDate::date, :endDate::date, '1 month') d

-- FIXED
FROM generate_series(CAST(:startDate AS DATE), CAST(:endDate AS DATE), CAST('1 month' AS INTERVAL)) d
```
</details>

<details>
<summary><b>Error 3:</b> GROUP BY with CASE expression</summary>

```
ERROR: column "i.due_date" must appear in the GROUP BY clause
```
```sql
-- FAILED
SELECT CASE WHEN :asOfDate - i.due_date <= 30 THEN 'CURRENT' ... END as bucket
FROM invoices i
GROUP BY CASE WHEN :asOfDate - i.due_date <= 30 THEN 'CURRENT' ... END

-- FIXED: Use CTE
WITH invoice_aging AS (
    SELECT i.id, i.total_amount,
        CASE WHEN CAST(:asOfDate AS DATE) - i.due_date <= 30 THEN 'CURRENT' ... END as bucket
    FROM invoices i
)
SELECT bucket, SUM(total_amount) FROM invoice_aging GROUP BY bucket
```
</details>

<details>
<summary><b>Error 4:</b> Uncast integer in date arithmetic</summary>

```sql
-- FAILED
AND t.lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + :days

-- FIXED
AND t.lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + CAST(:days AS INTEGER)
```
</details>

<details>
<summary><b>Error 5:</b> Uncast timestamp comparison</summary>

```sql
-- FAILED
AND wo.scheduled_date < :asOfDate
EXTRACT(DAY FROM :asOfDate - wo.scheduled_date)::integer

-- FIXED
AND wo.scheduled_date < CAST(:asOfDate AS TIMESTAMP)
CAST(EXTRACT(DAY FROM CAST(:asOfDate AS TIMESTAMP) - wo.scheduled_date) AS INTEGER)
```
</details>

<details>
<summary><b>Error 6:</b> Missing column referenced</summary>

```
ERROR: column e.vat_amount does not exist
```
```java
// FAILED: Referencing non-existent column
SELECT COALESCE(SUM(e.vat_amount), 0) FROM expenses e

// FIXED: Return default until column exists
return BigDecimal.ZERO;
```
</details>

### 2025-12-02: Additional Cast Syntax Fixes (Batch 2)

**Files Affected:**

| Repository | Patterns Fixed |
|------------|----------------|
| DashboardRepositoryImpl | `::date`, `::integer`, `::float`, transient field reference |
| OccupancyDashboardRepositoryImpl | `::integer`, `::timestamp` |
| VendorDashboardRepositoryImpl | `::text` |
| AssetsDashboardRepositoryImpl | `::decimal` |
| VendorRepository | `::jsonb` (4 occurrences) |
| ComplianceRequirementRepository | `::jsonb` |

**Errors Encountered:**

<details>
<summary><b>Error 7:</b> Transient/computed field referenced in SQL</summary>

```
ERROR: column vd.is_critical does not exist
```
```sql
-- FAILED: is_critical is a @Transient computed field, not a DB column
WHERE vd.is_critical = true

-- FIXED: Use actual enum values that determine criticality
WHERE vd.document_type IN ('TRADE_LICENSE', 'INSURANCE')
```
</details>

<details>
<summary><b>Error 8:</b> Literal integer in date arithmetic</summary>

```sql
-- FAILED
WHERE vd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7

-- FIXED
WHERE vd.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + CAST(7 AS INTEGER)
```
</details>

<details>
<summary><b>Error 9:</b> ::float cast syntax in division</summary>

```
QueryParameterException: No argument for named parameter ':float'
```
```sql
-- FAILED
(COUNT(CASE WHEN u.status = 'OCCUPIED' THEN 1 END)::float / COUNT(u.id))

-- FIXED
(CAST(COUNT(CASE WHEN u.status = 'OCCUPIED' THEN 1 END) AS FLOAT) / COUNT(u.id))
```
</details>

<details>
<summary><b>Error 10:</b> ::integer on EXTRACT result</summary>

```sql
-- FAILED
EXTRACT(YEAR FROM gs)::integer as year

-- FIXED
CAST(EXTRACT(YEAR FROM gs) AS INTEGER) as year
```
</details>

<details>
<summary><b>Error 11:</b> ::jsonb for JSONB containment operator</summary>

```
QueryParameterException: No argument for named parameter ':categoryJson::jsonb'
```
```sql
-- FAILED
WHERE v.service_categories @> :categoryJson::jsonb

-- FIXED
WHERE v.service_categories @> CAST(:categoryJson AS JSONB)
```
</details>

---

## Contributing

When adding new failed code patterns:

1. **Add to Pattern Categories** if it's a new category
2. **Add to Error Log** with date header
3. **Include:**
   - Exact error message
   - FAILED code snippet
   - FIXED code snippet
   - Files affected (if applicable)

**Template:**
```markdown
### YYYY-MM-DD: Description

**Files Affected:** List files

<details>
<summary><b>Error N:</b> Brief description</summary>

\```
ERROR MESSAGE
\```
\```sql
-- FAILED
code

-- FIXED
code
\```
</details>
```
