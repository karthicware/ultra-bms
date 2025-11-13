# Database Initialization Scripts

This directory contains database initialization scripts for the Ultra BMS application.

## Files

- **schema.sql** - Optional DDL for explicit schema definition (Hibernate auto-generates schema in dev)
- **data.sql** - Optional seed data for development environment

## Current Strategy (Epic 1)

**Development Environment:**
- Hibernate auto-generates schema using `spring.jpa.hibernate.ddl-auto=update`
- Schema is created/updated automatically from JPA entity annotations
- No manual DDL execution required

**Why Hibernate DDL Auto-Generation?**
- Rapid development iteration - no need to manually sync schema with entity changes
- Entity classes are the single source of truth
- Changes to entities automatically update database schema

## Future Strategy (Production)

**Production Environment:**
- Switch to `spring.jpa.hibernate.ddl-auto=validate` (only validates, doesn't modify)
- Use Flyway or Liquibase for versioned schema migrations
- Benefits:
  - Version-controlled database changes
  - Repeatable deployments
  - Rollback capability
  - Audit trail of schema evolution

**Migration Path:**
1. Epic 1-4: Use Hibernate DDL auto-generation for rapid local development
2. Before production deployment: Introduce Flyway with baseline
3. Create Flyway migrations: `V1__initial_schema.sql`, `V2__add_tenants.sql`, etc.
4. Update `application-prod.yml` to use `ddl-auto=validate` and Flyway

## Flyway Migration Naming Convention

```
V{version}__{description}.sql

Examples:
V1__initial_schema.sql
V2__add_tenant_table.sql
V3__add_maintenance_tables.sql
V4__add_indexes.sql
```

## References

- Spring Boot Flyway Documentation: https://docs.spring.io/spring-boot/docs/current/reference/html/howto.html#howto.data-initialization.migration-tool.flyway
- Hibernate DDL Auto Strategies: https://docs.spring.io/spring-boot/docs/current/reference/html/application-properties.html#application-properties.data.spring.jpa.hibernate.ddl-auto
