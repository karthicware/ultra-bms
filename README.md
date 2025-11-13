# Ultra BMS - Building Maintenance System

A comprehensive building maintenance management platform built with Spring Boot and Next.js.

## Project Structure

```
ultra-bms/
├── backend/          # Spring Boot backend (Java 17)
├── frontend/         # Next.js frontend (TypeScript)
└── docs/            # Project documentation
```

## Tech Stack

### Backend
- Spring Boot 3.4.0
- Java 17
- PostgreSQL
- Spring Security + JWT
- Spring Data JPA
- Ehcache

### Frontend
- Next.js 15
- React 19
- TypeScript 5
- Tailwind CSS 4.0
- shadcn/ui
- React Hook Form + Zod

## Database Setup

Ultra BMS uses PostgreSQL as its primary database. Choose one of the following setup methods:

### Option 1: Docker Compose (Recommended)

**Prerequisites:**
- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))

**Steps:**
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. (Optional) Update `.env` with your preferred database password:
   ```bash
   POSTGRES_PASSWORD=your_secure_password
   ```

3. Start PostgreSQL container:
   ```bash
   docker-compose up -d
   ```

4. Verify container is running:
   ```bash
   docker ps
   ```
   You should see `ultra-bms-postgres` container with status "Up" and healthy.

5. Check logs (optional):
   ```bash
   docker logs ultra-bms-postgres
   ```

**Database Details:**
- **Host:** localhost
- **Port:** 5432
- **Database:** ultra_bms_dev
- **Username:** ultra_bms_user
- **Password:** As set in `.env` (default: `dev_password`)

### Option 2: Native Installation

#### Windows
**Using Official Installer:**
1. Download PostgreSQL 15+ from [postgresql.org](https://www.postgresql.org/download/windows/)
2. Run installer and follow setup wizard
3. Note down the postgres superuser password

**Using Chocolatey:**
```powershell
choco install postgresql
```

#### macOS
**Using Homebrew:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Linux (RHEL/CentOS/Fedora)
```bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Manual Database Creation

After installing PostgreSQL natively, create the development database:

1. Connect to PostgreSQL:
   ```bash
   psql -U postgres
   ```

2. Create database and user:
   ```sql
   CREATE DATABASE ultra_bms_dev;
   CREATE USER ultra_bms_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE ultra_bms_dev TO ultra_bms_user;
   \c ultra_bms_dev
   GRANT ALL ON SCHEMA public TO ultra_bms_user;
   ```

3. Exit psql:
   ```sql
   \q
   ```

4. Update `.env` file with your database credentials:
   ```bash
   DB_PASSWORD=your_password
   ```

### Connection String Format

```
jdbc:postgresql://localhost:5432/ultra_bms_dev
```

For custom host/port:
```
jdbc:postgresql://<host>:<port>/<database_name>
```

### Database GUI Tools

Explore and manage the database using these tools:

- **[pgAdmin](https://www.pgadmin.org/)** - Free, feature-rich PostgreSQL GUI
- **[DBeaver](https://dbeaver.io/)** - Universal database tool (supports multiple DBs)
- **[DataGrip](https://www.jetbrains.com/datagrip/)** - JetBrains IDE (paid, powerful)
- **[TablePlus](https://tableplus.com/)** - Modern, native GUI for Mac/Windows

**Connection Details for GUI Tools:**
- Host: `localhost`
- Port: `5432`
- Database: `ultra_bms_dev`
- Username: `ultra_bms_user`
- Password: From your `.env` file

### Schema Management

**Development Environment:**
- Hibernate automatically creates/updates schema based on JPA entities
- Configuration: `spring.jpa.hibernate.ddl-auto=update`
- Schema syncs automatically when entities change

**Production Environment (Future):**
- Will use Flyway for versioned schema migrations
- Configuration: `spring.jpa.hibernate.ddl-auto=validate`
- See `backend/src/main/resources/db/README.md` for migration strategy

### Troubleshooting

#### Connection Refused
**Symptoms:** `Connection refused` or `could not connect to server`

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # Docker
   docker ps

   # macOS
   brew services list

   # Linux
   sudo systemctl status postgresql
   ```

2. Check port 5432 is not in use:
   ```bash
   # macOS/Linux
   lsof -i :5432

   # Windows
   netstat -ano | findstr :5432
   ```

3. Verify `application-dev.yml` has correct host/port

#### Authentication Failed
**Symptoms:** `password authentication failed for user`

**Solutions:**
1. Check `.env` file has correct `DB_PASSWORD`
2. Verify environment variables are loaded (restart IDE/terminal)
3. For native install, confirm user password in PostgreSQL:
   ```sql
   ALTER USER ultra_bms_user WITH PASSWORD 'new_password';
   ```

#### Port Already in Use
**Symptoms:** `bind: address already in use`

**Solutions:**
1. Stop conflicting PostgreSQL instance
2. Change port in both `docker-compose.yml` and `application-dev.yml`:
   ```yaml
   # docker-compose.yml
   ports:
     - "5433:5432"  # Use 5433 locally

   # application-dev.yml
   url: jdbc:postgresql://localhost:5433/ultra_bms_dev
   ```

#### Schema Not Created
**Symptoms:** Tables don't exist after starting application

**Solutions:**
1. Check application logs for Hibernate DDL statements
2. Verify `spring.jpa.hibernate.ddl-auto=update` in `application-dev.yml`
3. Ensure entities are in correct package: `com.ultrabms.entity`
4. Check database permissions:
   ```sql
   \c ultra_bms_dev
   \du  -- List users and permissions
   ```

#### Connection Pool Exhausted
**Symptoms:** `HikariPool - Connection is not available`

**Solutions:**
1. Increase `maximum-pool-size` in `application-dev.yml` (default: 10)
2. Check for leaked connections (connections not properly closed)
3. Review slow queries with `spring.jpa.show-sql=true`

## Caching Setup

Ultra BMS uses Ehcache 3.x for application-level caching to improve performance by caching frequently accessed data in-memory. This reduces database query load and improves API response times (cached reads < 10ms vs database reads ~50-100ms).

### Configuration

Caching is configured via:
- **Spring Boot Configuration:** `backend/src/main/resources/application-dev.yml`
- **Ehcache Configuration:** `backend/src/main/resources/ehcache.xml`
- **Main Application:** `@EnableCaching` annotation on `UltraBmsApplication.java`

### Cache Regions

Five cache regions are configured with different sizes and TTLs based on usage patterns:

| Cache Region | Max Entries | TTL | Purpose |
|--------------|-------------|-----|---------|
| `userCache` | 1,000 | 30 minutes | User profiles and authentication data |
| `sessionCache` | 5,000 | 24 hours | Active user sessions |
| `tenantCache` | 2,000 | 1 hour | Tenant details frequently accessed |
| `propertyCache` | 500 | 2 hours | Property metadata |
| `lookupCache` | 10,000 | 12 hours | Reference data (dropdowns, enums, config) |

**Total Heap Allocation:** 100 MB across all caches
**Eviction Policy:** LRU (Least Recently Used) when capacity reached

### Caching Annotations

Spring Cache provides annotation-driven caching support:

#### @Cacheable - Cache Method Results (Read Operations)
```java
@Cacheable(value = "userCache", key = "#userId")
public UserDto findUserById(String userId) {
    // Method execution result is cached
    // Subsequent calls with same userId return cached value
    return userRepository.findById(userId);
}
```

#### @CachePut - Update Cache (Write Operations)
```java
@CachePut(value = "userCache", key = "#user.id")
public UserDto updateUser(UserDto user) {
    // Method always executes, result updates cache
    return userRepository.save(user);
}
```

#### @CacheEvict - Remove from Cache (Delete Operations)
```java
@CacheEvict(value = "userCache", key = "#userId")
public void deleteUser(String userId) {
    // Removes entry from cache
    userRepository.deleteById(userId);
}

// Clear entire cache
@CacheEvict(value = "userCache", allEntries = true)
public void clearUserCache() {
    // Evicts all entries from userCache
}
```

#### @Caching - Combine Multiple Cache Operations
```java
@Caching(
    evict = {
        @CacheEvict(value = "userCache", key = "#userId"),
        @CacheEvict(value = "sessionCache", key = "#sessionId")
    }
)
public void logoutUser(String userId, String sessionId) {
    // Evicts from multiple caches
}
```

### Cache Key Generation

#### Default Key Generation
By default, method parameters are used as the cache key:
```java
@Cacheable("userCache")
public User findByEmail(String email) {
    // Key = email parameter
}
```

#### Custom Key Using SpEL (Spring Expression Language)
```java
@Cacheable(value = "propertyCache", key = "#propertyId + '-' + #includeUnits")
public PropertyDto findProperty(String propertyId, boolean includeUnits) {
    // Key = "propertyId-true" or "propertyId-false"
}
```

#### Complex Key Using KeyGenerator Bean
```java
// In @Configuration class
@Bean
public KeyGenerator customKeyGenerator() {
    return (target, method, params) -> {
        return method.getName() + "_" + Arrays.toString(params);
    };
}

// In service class
@Cacheable(value = "tenantCache", keyGenerator = "customKeyGenerator")
public TenantDto findTenant(TenantSearchCriteria criteria) {
    // Custom KeyGenerator creates key from criteria object
}
```

### Monitoring Cache Statistics

#### Actuator Cache Endpoint
Access cache information via Spring Boot Actuator:

```bash
# Get all cache names and statistics
curl http://localhost:8080/actuator/caches
```

**Expected Response:**
```json
{
  "cacheManagers": {
    "cacheManager": {
      "caches": {
        "userCache": {
          "target": "org.ehcache.jsr107.Eh107Cache"
        },
        "sessionCache": {
          "target": "org.ehcache.jsr107.Eh107Cache"
        },
        "tenantCache": {
          "target": "org.ehcache.jsr107.Eh107Cache"
        },
        "propertyCache": {
          "target": "org.ehcache.jsr107.Eh107Cache"
        },
        "lookupCache": {
          "target": "org.ehcache.jsr107.Eh107Cache"
        }
      }
    }
  }
}
```

#### Cache Metrics
View cache performance metrics:

```bash
# Get cache hit/miss statistics for specific cache
curl http://localhost:8080/actuator/metrics/cache.gets?tag=cache:userCache
curl http://localhost:8080/actuator/metrics/cache.puts?tag=cache:userCache
curl http://localhost:8080/actuator/metrics/cache.evictions?tag=cache:userCache
```

#### JMX Monitoring with JConsole
Monitor cache statistics in real-time using JConsole (included with JDK):

1. **Start JConsole:**
   ```bash
   jconsole
   ```

2. **Connect to Local Process:**
   - Select the Spring Boot application process (e.g., `ultra-bms-backend-0.0.1-SNAPSHOT.jar`)
   - Click "Connect"

3. **Navigate to Ehcache MBeans:**
   - Go to "MBeans" tab
   - Expand: `org.ehcache` → `CacheManager` → `caches`
   - Select a cache (e.g., `userCache`)

4. **View Statistics:**
   - **Size:** Current number of entries in cache
   - **Hits:** Number of successful cache lookups
   - **Misses:** Number of cache lookups that didn't find entry
   - **HitPercentage:** Cache hit rate (target > 80% after warm-up)
   - **Evictions:** Number of entries removed due to capacity limits

#### VisualVM Monitoring
Alternatively, use VisualVM for advanced monitoring:

1. Download VisualVM: https://visualvm.github.io/
2. Install MBeans plugin: Tools → Plugins → Available Plugins → "VisualVM-MBeans"
3. Connect to Spring Boot process and navigate to MBeans tab

### Troubleshooting

#### Cache Not Initializing
**Symptoms:** Application fails to start with cache-related errors

**Solutions:**
1. Verify `ehcache.xml` is in `backend/src/main/resources/`
2. Check XML syntax is valid (validate against Ehcache 3.10 schema)
3. Ensure `spring.cache.jcache.config=classpath:ehcache.xml` in `application-dev.yml`
4. Review application logs for Ehcache initialization errors:
   ```bash
   cd backend
   ./mvnw spring-boot:run | grep -i ehcache
   ```

#### Cache Not Working (No Hits)
**Symptoms:** Actuator metrics show 0 hits, all lookups are misses

**Solutions:**
1. Verify `@EnableCaching` annotation present on `UltraBmsApplication.java`
2. Check service methods have `@Cacheable` annotations
3. Ensure methods are called via Spring proxy (not `this.method()`)
4. Verify cache names match between `@Cacheable` and `ehcache.xml`
5. Check cache keys are consistent (same parameters = same key)

#### Memory Issues (OutOfMemoryError)
**Symptoms:** Application crashes with heap space errors

**Solutions:**
1. Reduce cache sizes in `ehcache.xml` (decrease max entries)
2. Shorten TTL values to expire entries sooner
3. Increase JVM heap size:
   ```bash
   export MAVEN_OPTS="-Xmx1024m"
   ./mvnw spring-boot:run
   ```
4. Monitor cache usage via JMX and adjust limits accordingly

#### Cache Invalidation Issues
**Symptoms:** Stale data returned from cache after updates

**Solutions:**
1. Ensure `@CachePut` used on update operations
2. Verify `@CacheEvict` used on delete operations
3. Use `@CacheEvict(allEntries = true)` to clear entire cache region
4. Check cache keys match between read/write/delete operations
5. Consider shorter TTL values for frequently changing data

#### Actuator Endpoint Not Accessible
**Symptoms:** 404 error on `/actuator/caches`

**Solutions:**
1. Verify `spring-boot-starter-actuator` dependency in `pom.xml`
2. Check `management.endpoints.web.exposure.include` contains `caches` in `application-dev.yml`
3. Restart application after configuration changes
4. Access full actuator endpoint list: http://localhost:8080/actuator

### Performance Targets

- **Cache Hit Rate:** > 80% after warm-up period
- **Cached Read Response Time:** < 10ms
- **Database Read Response Time:** ~50-100ms
- **Performance Improvement:** 5-10x faster for cached reads
- **Heap Memory Usage:** < 100 MB total across all cache regions

### Future Considerations

The current Ehcache setup is designed for single-instance local development. For production deployment with multiple application instances:

- **Consider Redis:** Distributed caching for shared cache across instances
- **See ADR-002:** Architecture document contains decision rationale and migration path
- **Monitor Metrics:** Track cache hit rates and adjust TTLs based on real usage patterns

## Core Domain Model

Ultra BMS uses JPA entities to represent core domain concepts with strict naming conventions, validation, and relationship mappings. The domain model follows a layered architecture with BaseEntity providing common audit fields and optimistic locking.

### Entity Relationship Diagram

```
┌─────────────────┐
│     User        │
│─────────────────│
│ id (UUID) PK    │
│ email (unique)  │
│ passwordHash    │
│ firstName       │
│ lastName        │
│ role (enum)     │
│ active          │
│ mfaEnabled      │
└─────────┬───────┘
          │
          │ 1:N (manager_id)
          │
          ▼
┌─────────────────┐
│   Property      │
│─────────────────│
│ id (UUID) PK    │
│ name            │
│ address         │
│ type (enum)     │
│ totalUnits      │
│ manager FK      │──┐
└─────────┬───────┘  │
          │          │
          │ 1:N      │
          │          │
          ▼          │
┌─────────────────┐  │
│     Unit        │  │
│─────────────────│  │
│ id (UUID) PK    │  │
│ property FK     │──┘
│ unitNumber      │
│ floor           │
│ bedroomCount    │
│ bathroomCount   │
│ squareFootage   │
│ status (enum)   │
└─────────────────┘

Constraints:
- UNIQUE (property_id, unit_number)
- CHECK (square_footage > 0)
```

### Core Entities

#### User Entity
Represents system users with role-based access control.

**Fields:**
- `id` (UUID) - Primary key, auto-generated
- `email` (String, unique, max 255 chars) - User's email address, indexed for authentication
- `passwordHash` (String) - BCrypt hashed password, never exposed in JSON responses (@JsonIgnore)
- `firstName` (String, max 100 chars) - User's first name
- `lastName` (String, max 100 chars) - User's last name
- `role` (UserRole enum) - User's role in the system
- `active` (Boolean, default true) - Soft delete flag for account deactivation
- `mfaEnabled` (Boolean, default false) - Multi-factor authentication status
- `createdAt` (LocalDateTime) - Auto-managed creation timestamp
- `updatedAt` (LocalDateTime) - Auto-managed update timestamp
- `version` (Long) - Optimistic locking version

**Database Table:** `users` (snake_case)

**Indexes:**
- `idx_users_email` - Email lookup for authentication

**Validation:**
- @NotNull on email, passwordHash, firstName, lastName, role
- @Email on email field
- @Size constraints on string fields

#### Property Entity
Represents real estate properties managed in the system.

**Fields:**
- `id` (UUID) - Primary key
- `name` (String, max 200 chars) - Property name
- `address` (String, max 500 chars) - Physical address
- `type` (PropertyType enum) - Property classification
- `totalUnits` (Integer) - Number of rental units
- `manager` (User) - Property manager assigned (@ManyToOne relationship)
- `createdAt` / `updatedAt` / `version` - Audit fields from BaseEntity

**Database Table:** `properties` (snake_case)

**Indexes:**
- `idx_properties_manager_id` - Manager lookup

**Foreign Keys:**
- `manager_id` → `users(id)`

#### Unit Entity
Represents individual rental units within properties.

**Fields:**
- `id` (UUID) - Primary key
- `property` (Property) - Parent property (@ManyToOne relationship)
- `unitNumber` (String, max 50 chars) - Unit identifier within property (e.g., "101", "A-1")
- `floor` (Integer) - Floor number
- `bedroomCount` (Integer) - Number of bedrooms
- `bathroomCount` (Integer) - Number of bathrooms
- `squareFootage` (BigDecimal) - Unit size in square feet
- `status` (UnitStatus enum) - Current availability status
- `createdAt` / `updatedAt` / `version` - Audit fields from BaseEntity

**Database Table:** `units` (snake_case)

**Indexes:**
- `idx_units_property_id` - Property lookup
- `idx_units_status` - Status filtering

**Foreign Keys:**
- `property_id` → `properties(id)`

**Constraints:**
- UNIQUE (property_id, unit_number) - No duplicate unit numbers per property
- CHECK (square_footage > 0) - Positive square footage validation

### Enumerations

#### UserRole
Defines the six primary user roles for RBAC:
- `SUPER_ADMIN` - Full system access and configuration
- `PROPERTY_MANAGER` - Property-specific management and oversight
- `MAINTENANCE_SUPERVISOR` - Work order and vendor management
- `FINANCE_MANAGER` - Financial operations and reporting
- `TENANT` - Self-service portal access
- `VENDOR` - Job assignment and completion tracking

#### PropertyType
Classifies properties by usage:
- `RESIDENTIAL` - Housing and apartments
- `COMMERCIAL` - Offices and retail spaces
- `MIXED_USE` - Combination of residential and commercial

#### UnitStatus
Tracks unit availability:
- `AVAILABLE` - Available for new tenants
- `OCCUPIED` - Currently occupied by a tenant
- `UNDER_MAINTENANCE` - Unavailable due to maintenance

### Naming Conventions

**Java (Entity Classes):**
- Classes: PascalCase (`User`, `Property`, `Unit`)
- Fields: camelCase (`firstName`, `unitNumber`, `managerId`)
- Enums: PascalCase for type, ALL_CAPS for values (`UserRole.SUPER_ADMIN`)

**Database (PostgreSQL):**
- Tables: snake_case, plural (`users`, `properties`, `units`)
- Columns: snake_case (`first_name`, `unit_number`, `manager_id`)
- Constraints: Prefixed by type (`pk_`, `uk_`, `fk_`, `idx_`, `chk_`)

### Primary Key Strategy

All entities use **UUID (Universally Unique Identifier)** as primary keys instead of auto-increment Long values:

**Benefits:**
- **Scalability:** UUIDs can be generated independently across distributed systems without coordination
- **Security:** Non-sequential IDs prevent enumeration attacks (e.g., guessing `/api/users/1`, `/api/users/2`)
- **Data Migration:** UUIDs remain globally unique during database merges or migrations
- **Offline Generation:** Client-side UUID generation reduces round-trips for ID assignment

**Generation:**
- JPA auto-generates UUIDs via `@GeneratedValue(strategy = GenerationType.UUID)`
- Database stores as `UUID` type (128-bit, 16 bytes storage)
- Java represents as `java.util.UUID`

### Soft Delete Pattern

The User entity implements a **soft delete pattern** using the `active` flag:

**Implementation:**
- `active` (Boolean, default true) - false indicates deactivated account
- Deactivated accounts remain in database for audit trails and historical data
- Prevents cascading deletes that could corrupt referential integrity
- Repository method `findByActiveTrue()` filters to active users only

**Usage:**
```java
// Soft delete
user.setActive(false);
userRepository.save(user);

// Query only active users
List<User> activeUsers = userRepository.findByActiveTrue();
```

**Future Enhancement:**
In Epic 7 (Compliance & Auditing), soft delete will be extended to other entities with:
- `deletedAt` (LocalDateTime) - Timestamp of deletion
- `deletedBy` (UUID) - User who performed deletion
- Enable GDPR compliance for data retention policies

### JPA Configuration

**Auditing:**
- Enabled via `@EnableJpaAuditing` in `JpaAuditingConfig`
- Auto-populates `createdAt` and `updatedAt` fields on entity save
- `AuditorAware<UUID>` bean provides current user ID (placeholder until Epic 2 authentication)

**Optimistic Locking:**
- All entities include `@Version` field (Long)
- JPA increments version on each update
- Prevents lost updates in concurrent scenarios by throwing `OptimisticLockException`

**Naming Strategy:**
- `CamelCaseToUnderscoresNamingStrategy` converts Java camelCase to database snake_case
- Configured in `application-dev.yml`: `spring.jpa.hibernate.naming.physical-strategy`

**Schema Validation:**
- Development mode: `spring.jpa.hibernate.ddl-auto=validate`
- Flyway handles all schema migrations (see Database Migrations below)
- JPA validates entity mappings match database schema on startup

### Database Migrations

Ultra BMS uses **Flyway** for versioned schema migrations:

**Configuration:**
- Migrations: `backend/src/main/resources/db/migration/`
- Naming: `V{version}__{description}.sql` (e.g., `V3__create_domain_entities.sql`)
- Execution: Automatic on application startup
- History: Tracked in `flyway_schema_history` table

**Current Migrations:**
- **V3__create_domain_entities.sql** - Creates users, properties, units tables with all constraints and indexes

**Best Practices:**
- Never modify applied migrations (creates checksum mismatch)
- Always increment version numbers sequentially
- Test migrations against local database before committing
- Include both schema DDL and seed data in same migration file if needed

### Repository Interfaces

Spring Data JPA repositories provide CRUD operations and custom query methods using method naming conventions:

#### UserRepository
```java
// Find user by email (authentication)
Optional<User> findByEmail(String email);

// Find all users with specific role
List<User> findByRole(UserRole role);

// Find all active users (soft delete filter)
List<User> findByActiveTrue();
```

#### PropertyRepository
```java
// Find properties managed by specific user
List<Property> findByManagerId(UUID managerId);

// Find properties by type (RESIDENTIAL, COMMERCIAL, MIXED_USE)
List<Property> findByType(PropertyType type);

// Find property by name
Optional<Property> findByName(String name);
```

#### UnitRepository
```java
// Find all units in a property
List<Unit> findByPropertyId(UUID propertyId);

// Find units by status (AVAILABLE, OCCUPIED, UNDER_MAINTENANCE)
List<Unit> findByStatus(UnitStatus status);

// Find specific unit by property and unit number (enforces unique constraint)
Optional<Unit> findByPropertyIdAndUnitNumber(UUID propertyId, String unitNumber);

// Count units by property and status (occupancy statistics)
long countByPropertyIdAndStatus(UUID propertyId, UnitStatus status);
```

**Query Derivation:**
Spring Data JPA automatically generates queries from method names:
- `findBy` + field name - SELECT query with WHERE clause
- Multiple conditions: `findByAAndB` (AND), `findByAOrB` (OR)
- Comparison: `findByAGreaterThan`, `findByALessThan`, `findByAContaining`
- Null handling: `findByAIsNull`, `findByAIsNotNull`
- Boolean: `findByATrue`, `findByAFalse`

### Usage Example

```java
@Service
public class PropertyService {
    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private UnitRepository unitRepository;

    // Find all available units in a property
    public List<Unit> getAvailableUnits(UUID propertyId) {
        return unitRepository.findByPropertyId(propertyId)
            .stream()
            .filter(unit -> unit.getStatus() == UnitStatus.AVAILABLE)
            .collect(Collectors.toList());
    }

    // Calculate occupancy rate
    public double getOccupancyRate(UUID propertyId) {
        long totalUnits = unitRepository.countByPropertyId(propertyId);
        long occupiedUnits = unitRepository.countByPropertyIdAndStatus(
            propertyId,
            UnitStatus.OCCUPIED
        );
        return totalUnits > 0 ? (double) occupiedUnits / totalUnits * 100 : 0.0;
    }
}
```

### Validation

Entities use Bean Validation (JSR-380) annotations for data integrity:

**Common Validators:**
- `@NotNull` - Field cannot be null
- `@Email` - Valid email format
- `@Size(min, max)` - String length constraints
- `@DecimalMin` / `@DecimalMax` - Numeric range validation
- `@Pattern` - Regex pattern matching

**Validation Timing:**
- **Pre-persist:** Validation occurs before entity save/update
- **Cascade:** Validation propagates to nested entities
- **Exception:** `ConstraintViolationException` thrown on validation failure

**Example:**
```java
@Entity
public class User extends BaseEntity {
    @NotNull(message = "Email cannot be null")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;
}
```

### Future Enhancements

The current domain model will be extended in upcoming epics:

- **Epic 2 (Authentication):** Add audit fields (createdBy, updatedBy) to BaseEntity
- **Epic 3 (Tenant Management):** Add Tenant, Lease, Payment entities
- **Epic 4 (Maintenance):** Add WorkOrder, Task, Vendor entities
- **Epic 6 (Financial):** Add Invoice, Transaction, PDC entities
- **Epic 7 (Compliance):** Extend soft delete to all entities with deletedAt/deletedBy

## Quick Start

### Prerequisites
- Java 17+ ([Download](https://adoptium.net/))
- Node.js 20+ LTS ([Download](https://nodejs.org/))
- PostgreSQL 15+ (see Database Setup above)
- Docker Desktop (for Docker Compose method)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd ultra-bms

# Copy environment template
cp .env.example .env

# Update .env with your database password (optional)
```

### 2. Start Database

```bash
docker-compose up -d
```

### 3. Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend will be available at http://localhost:8080

**Verify Backend:**
- Health Check: http://localhost:8080/actuator/health
- API Docs: http://localhost:8080/swagger-ui.html

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000

### Development Workflow

1. **Backend:** Code changes auto-reload via Spring Boot DevTools
2. **Frontend:** Hot reload enabled via Next.js Fast Refresh
3. **Database:** Schema auto-updates from JPA entity changes

## Documentation

- [Architecture](./docs/architecture.md)
- [PRD](./docs/prd.md)
- [Epics](./docs/epics.md)

## License

Proprietary
