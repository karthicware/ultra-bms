# Story 1.3: Ehcache Configuration for Application Caching

Status: drafted

## Story

As a backend developer,
I want Ehcache configured for application-level caching,
so that frequently accessed data is cached in-memory for performance optimization.

## Acceptance Criteria

1. **AC1 - Spring Cache Configuration:** @EnableCaching annotation added to UltraBmsApplication.java main class, Ehcache 3.x configured as cache provider via spring.cache.type=jcache, JSR-107 (JCache) API dependency added to pom.xml.

2. **AC2 - Ehcache XML Configuration:** ehcache.xml file created in backend/src/main/resources/ with 5 cache regions defined:
   - userCache: max 1000 entries, TTL 30 minutes
   - sessionCache: max 5000 entries, TTL 24 hours
   - tenantCache: max 2000 entries, TTL 1 hour
   - propertyCache: max 500 entries, TTL 2 hours
   - lookupCache: max 10000 entries, TTL 12 hours
   - Heap memory allocation: 100 MB total across all caches
   - Eviction policy: LRU (Least Recently Used)

3. **AC3 - Cache Monitoring Configuration:** Statistics enabled in ehcache.xml for all cache regions, Actuator /actuator/caches endpoint accessible and showing cache details, JMX beans enabled for monitoring via JConsole/VisualVM, cache metrics exposed via Spring Boot Actuator.

4. **AC4 - Documentation:** README.md updated with "Caching Setup" section explaining Ehcache configuration, caching annotations documented (@Cacheable, @CachePut, @CacheEvict, @Caching), cache key generation strategies explained, monitoring guide for cache statistics.

5. **AC5 - Verification:** Application starts successfully with cache configuration loaded, Actuator endpoint shows all 5 cache regions initialized, cache statistics are accessible and show 0 hits/misses initially, logs confirm Ehcache initialization with configured regions.

## Tasks / Subtasks

- [ ] **Task 1: Add Ehcache Dependencies to pom.xml** (AC: #1)
  - [ ] Add `org.ehcache:ehcache:3.10.8` dependency (Ehcache 3.x)
  - [ ] Add `javax.cache:cache-api:1.1.1` dependency (JSR-107 JCache API)
  - [ ] Verify spring-boot-starter-cache already present (from Story 1.1)
  - [ ] Run `./mvnw dependency:tree` to verify no conflicts
  - [ ] Run `./mvnw clean install` to download dependencies

- [ ] **Task 2: Enable Spring Cache Abstraction** (AC: #1)
  - [ ] Add `@EnableCaching` annotation to UltraBmsApplication.java main class
  - [ ] Configure `spring.cache.type=jcache` in application-dev.yml
  - [ ] Configure `spring.cache.jcache.config=classpath:ehcache.xml` to specify config file location
  - [ ] Add cache-related logging: `logging.level.org.springframework.cache=DEBUG` for development
  - [ ] Add ehcache logging: `logging.level.org.ehcache=INFO`

- [ ] **Task 3: Create ehcache.xml Configuration File** (AC: #2)
  - [ ] Create `backend/src/main/resources/ehcache.xml` file
  - [ ] Define XML namespace and schema: `http://www.ehcache.org/v3`
  - [ ] Configure heap memory resource: `<heap unit="MB">100</heap>`
  - [ ] Define userCache: 1000 entries, 30 min TTL, LRU eviction
  - [ ] Define sessionCache: 5000 entries, 24 hour TTL, LRU eviction
  - [ ] Define tenantCache: 2000 entries, 1 hour TTL, LRU eviction
  - [ ] Define propertyCache: 500 entries, 2 hour TTL, LRU eviction
  - [ ] Define lookupCache: 10000 entries, 12 hour TTL, LRU eviction
  - [ ] Enable statistics for all cache regions (for monitoring)

- [ ] **Task 4: Configure Cache Monitoring** (AC: #3)
  - [ ] Verify Actuator dependency present (confirmed from Story 1.2)
  - [ ] Enable cache endpoint: `management.endpoints.web.exposure.include=health,info,caches` in application-dev.yml
  - [ ] Enable JMX: `spring.jmx.enabled=true` (default in Spring Boot)
  - [ ] Configure management metrics: `management.metrics.enable.cache=true`
  - [ ] Add cache statistics logging configuration (optional)

- [ ] **Task 5: Update README with Caching Documentation** (AC: #4)
  - [ ] Add "Caching Setup" section after "Database Setup" in README.md
  - [ ] Document Ehcache configuration and cache regions
  - [ ] Explain caching annotations with code examples:
    - `@Cacheable`: Cache method results (read operations)
    - `@CachePut`: Update cache (write operations)
    - `@CacheEvict`: Invalidate cache entries (delete operations)
    - `@Caching`: Combine multiple cache operations
  - [ ] Document cache key generation strategies (default vs custom)
  - [ ] Explain monitoring via /actuator/caches endpoint
  - [ ] Add JMX monitoring instructions (JConsole/VisualVM connection)
  - [ ] Document cache troubleshooting (clearing cache, memory tuning)

- [ ] **Task 6: Test Cache Configuration** (AC: #5)
  - [ ] **MANUAL TEST:** Start Spring Boot application: `cd backend && ./mvnw spring-boot:run`
  - [ ] **MANUAL TEST:** Verify application logs show Ehcache initialization messages
  - [ ] **MANUAL TEST:** Check logs for all 5 cache regions created
  - [ ] **MANUAL TEST:** Access /actuator/caches endpoint: `curl http://localhost:8080/actuator/caches`
  - [ ] **MANUAL TEST:** Verify JSON response shows cacheNames: ["userCache", "sessionCache", "tenantCache", "propertyCache", "lookupCache"]
  - [ ] **MANUAL TEST:** Check cache statistics show 0 size, 0 hits, 0 misses initially
  - [ ] **MANUAL TEST:** Connect via JConsole to view Ehcache MBeans (optional)

- [ ] **Task 7: Create Example Cacheable Service (Optional Demo)** (AC: #4)
  - [ ] Create simple service method with @Cacheable annotation (for documentation example)
  - [ ] Example: `@Cacheable("lookupCache") public List<String> getRoles()`
  - [ ] Add to README as working example of cache usage
  - [ ] Note: Actual caching will be implemented in later stories when services are built

## Dev Notes

### Architecture Alignment

This story implements application-level caching as specified in the Architecture Document and Tech Spec for Epic 1:

**Caching Strategy:**
- Ehcache 3.x as cache provider (Decision Summary: Caching - ADR-002)
- Spring Cache abstraction for annotation-based caching (Decision Summary: Backend Stack)
- In-memory heap storage (no distributed cache) for local development simplicity
- LRU eviction policy prevents memory exhaustion (Non-Functional Requirements: Performance)

**Cache Region Design:**
- **userCache (1000/30min):** User profiles and authentication data - moderate size, moderate TTL
- **sessionCache (5000/24h):** Active user sessions - largest capacity, longest TTL
- **tenantCache (2000/1h):** Tenant details frequently accessed by property managers - medium size, short TTL (data changes frequently)
- **propertyCache (500/2h):** Property metadata - smaller size (fewer properties than tenants), medium TTL
- **lookupCache (10000/12h):** Reference data (dropdown values, enums, system config) - largest size, longest TTL (rarely changes)

**Performance Targets:**
- Cache hit rate: > 80% after warm-up (Tech Spec: Non-Functional Requirements - Performance)
- Heap memory: 100 MB max allocation (Tech Spec: Non-Functional Requirements - Caching)
- Response time improvement: Cached reads < 10ms vs database reads ~50-100ms

**Alignment with PRD:**
- Section 5.5 (Performance Requirements): < 200ms API response time - caching helps achieve this
- Section 5.2 (Integration Requirements): Future Redis integration path documented (ADR-002)

**Alignment with Architecture Document:**
- ADR-002: No Redis, Use Spring Cache with Caffeine/Ehcache - implements Ehcache option
- Implementation Patterns: Caching pattern with @Cacheable, @CachePut, @CacheEvict annotations
- Performance Considerations: Application-Level Caching section - implements Caffeine/Ehcache strategy

### Project Structure Notes

**Caching Configuration Files:**
```
backend/
├── src/main/
│   ├── java/com/ultrabms/
│   │   └── UltraBmsApplication.java  (add @EnableCaching)
│   └── resources/
│       ├── application-dev.yml  (spring.cache.type=jcache config)
│       └── ehcache.xml  (cache regions definition)
└── pom.xml  (Ehcache + JCache API dependencies)
```

**Configuration Approach:**
- Declarative XML configuration (ehcache.xml) for cache regions - easier to tune without code changes
- Spring Boot auto-configuration detects ehcache.xml and configures JCacheCacheManager
- Actuator metrics integration automatic when cache statistics enabled

### Learnings from Previous Story

**From Story 1-2-local-postgresql-database-setup (Status: done):**

Story 1.2 established patterns that apply to cache configuration:

- **Configuration Files:** Use application-dev.yml for Spring Boot configuration, separate config file (ehcache.xml) for provider-specific settings - mirrors database approach (application-dev.yml + docker-compose.yml)
- **Actuator Integration:** Health endpoints pattern extends to cache metrics - `/actuator/caches` follows `/actuator/health` pattern from Story 1.2
- **Manual Testing:** Same verification approach - start app, check logs, access actuator endpoint, verify initialization
- **Documentation Structure:** Add "Caching Setup" section to README.md following "Database Setup" section format
- **Troubleshooting Guide:** Include common issues (cache not initializing, memory errors) similar to database connection troubleshooting

**Key Takeaway:** The Spring Boot application infrastructure from Stories 1.1 and 1.2 (dependencies, configuration structure, Actuator endpoints, README documentation) provides the foundation for caching integration. This story adds the caching layer without modifying core application structure.

[Source: docs/sprint-artifacts/1-2-local-postgresql-database-setup.md]

### Testing Strategy

**Configuration Testing:**
- Verify ehcache.xml is valid XML and parsed correctly by Ehcache library
- Confirm all 5 cache regions are registered with Spring CacheManager
- Validate heap memory allocation totals to 100 MB across all caches

**Integration Testing:**
- Test @EnableCaching annotation enables Spring Cache abstraction
- Verify JCacheCacheManager is auto-configured by Spring Boot
- Confirm Actuator /actuator/caches endpoint returns expected JSON structure

**Manual Testing:**
- Start application and check logs for Ehcache initialization messages
- Access /actuator/caches endpoint and verify all cache regions present
- Monitor JMX beans via JConsole to see cache statistics
- Test cache annotations on example service method (optional in this story)

**Test Levels:**
- **L1 (Unit):** Not applicable for configuration story
- **L2 (Integration):** Verify cache configuration loaded and cache regions initialized
- **L3 (Manual):** Developer verifies Actuator endpoint, logs, and JMX monitoring

**Actual Cache Usage Testing:**
- Deferred to Story 1.4 (Entities) and Story 1.5 (API) when services implement @Cacheable methods
- Cache hit/miss metrics will be validated when services actively use caching

### Implementation Notes

1. **Maven Dependencies (pom.xml):**
```xml
<!-- Ehcache 3.x (JSR-107 compliant) -->
<dependency>
    <groupId>org.ehcache</groupId>
    <artifactId>ehcache</artifactId>
    <version>3.10.8</version>
</dependency>

<!-- JCache API (JSR-107) -->
<dependency>
    <groupId>javax.cache</groupId>
    <artifactId>cache-api</artifactId>
    <version>1.1.1</version>
</dependency>

<!-- Spring Cache Starter (already present from Story 1.1) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

2. **Enable Caching (UltraBmsApplication.java):**
```java
package com.ultrabms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching  // Enable Spring Cache abstraction
public class UltraBmsApplication {
    public static void main(String[] args) {
        SpringApplication.run(UltraBmsApplication.class, args);
    }
}
```

3. **Spring Boot Cache Configuration (application-dev.yml):**
```yaml
spring:
  cache:
    type: jcache  # Use JCache (JSR-107) provider
    jcache:
      config: classpath:ehcache.xml  # Path to Ehcache configuration

  jmx:
    enabled: true  # Enable JMX for cache monitoring (default)

management:
  endpoints:
    web:
      exposure:
        include: health,info,caches  # Expose cache metrics endpoint
  metrics:
    enable:
      cache: true  # Enable cache metrics

logging:
  level:
    org.springframework.cache: DEBUG  # Cache operation logging for dev
    org.ehcache: INFO  # Ehcache initialization logging
```

4. **Ehcache Configuration (ehcache.xml):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns="http://www.ehcache.org/v3"
        xmlns:jsr107="http://www.ehcache.org/v3/jsr107"
        xsi:schemaLocation="http://www.ehcache.org/v3 http://www.ehcache.org/schema/ehcache-core-3.10.xsd
                            http://www.ehcache.org/v3/jsr107 http://www.ehcache.org/schema/ehcache-107-ext-3.10.xsd">

    <!-- Service configuration -->
    <service>
        <jsr107:defaults enable-management="true" enable-statistics="true"/>
    </service>

    <!-- Global heap memory allocation -->
    <heap unit="MB">100</heap>

    <!-- User Cache: User profiles and authentication data -->
    <cache alias="userCache">
        <key-type>java.lang.String</key-type>
        <value-type>java.lang.Object</value-type>
        <expiry>
            <ttl unit="minutes">30</ttl>
        </expiry>
        <resources>
            <heap unit="entries">1000</heap>
        </resources>
    </cache>

    <!-- Session Cache: Active user sessions -->
    <cache alias="sessionCache">
        <key-type>java.lang.String</key-type>
        <value-type>java.lang.Object</value-type>
        <expiry>
            <ttl unit="hours">24</ttl>
        </expiry>
        <resources>
            <heap unit="entries">5000</heap>
        </resources>
    </cache>

    <!-- Tenant Cache: Tenant details -->
    <cache alias="tenantCache">
        <key-type>java.lang.String</key-type>
        <value-type>java.lang.Object</value-type>
        <expiry>
            <ttl unit="hours">1</ttl>
        </expiry>
        <resources>
            <heap unit="entries">2000</heap>
        </resources>
    </cache>

    <!-- Property Cache: Property metadata -->
    <cache alias="propertyCache">
        <key-type>java.lang.String</key-type>
        <value-type>java.lang.Object</value-type>
        <expiry>
            <ttl unit="hours">2</ttl>
        </expiry>
        <resources>
            <heap unit="entries">500</heap>
        </resources>
    </cache>

    <!-- Lookup Cache: Reference data (dropdowns, enums, system config) -->
    <cache alias="lookupCache">
        <key-type>java.lang.String</key-type>
        <value-type>java.lang.Object</value-type>
        <expiry>
            <ttl unit="hours">12</ttl>
        </expiry>
        <resources>
            <heap unit="entries">10000</heap>
        </resources>
    </cache>

</config>
```

5. **Caching Annotations Examples (for documentation):**
```java
// @Cacheable: Cache method results (read operations)
@Cacheable(value = "userCache", key = "#userId")
public UserDto findUserById(String userId) {
    // Method execution result is cached
    return userRepository.findById(userId);
}

// @CachePut: Update cache (write operations)
@CachePut(value = "userCache", key = "#user.id")
public UserDto updateUser(UserDto user) {
    // Method always executes, result updates cache
    return userRepository.save(user);
}

// @CacheEvict: Remove from cache (delete operations)
@CacheEvict(value = "userCache", key = "#userId")
public void deleteUser(String userId) {
    userRepository.deleteById(userId);
}

// @CacheEvict: Clear entire cache
@CacheEvict(value = "userCache", allEntries = true)
public void clearUserCache() {
    // Evicts all entries from userCache
}

// @Caching: Combine multiple cache operations
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

6. **Cache Key Generation Strategies:**
```java
// Default: Method parameters used as key
@Cacheable("userCache")
public User findByEmail(String email) {
    // Key = email parameter
}

// Custom key using SpEL
@Cacheable(value = "propertyCache", key = "#propertyId + '-' + #includeUnits")
public PropertyDto findProperty(String propertyId, boolean includeUnits) {
    // Key = "propertyId-true" or "propertyId-false"
}

// Complex key using KeyGenerator bean (configured in @Configuration class)
@Cacheable(value = "tenantCache", keyGenerator = "customKeyGenerator")
public TenantDto findTenant(TenantSearchCriteria criteria) {
    // Custom KeyGenerator creates key from criteria object
}
```

7. **Testing Cache via Actuator Endpoint:**
```bash
# Get all cache names and statistics
curl http://localhost:8080/actuator/caches

# Expected response:
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

# Get specific cache statistics (after implementing services with caching)
curl http://localhost:8080/actuator/metrics/cache.gets?tag=cache:userCache
```

8. **JMX Monitoring via JConsole:**
```bash
# Start JConsole (comes with JDK)
jconsole

# Connect to Spring Boot application (local process)
# Navigate to: MBeans → org.ehcache → CacheManager → caches
# View cache statistics: Size, Hits, Misses, HitPercentage
```

### Risks and Mitigations

- **R1:** Cache memory consumption may exceed 100 MB heap limit under high load
  - **Mitigation:** LRU eviction policy automatically removes least-used entries, monitor via Actuator, increase heap limit if needed
- **R2:** TTL values may not match actual data change patterns
  - **Mitigation:** Start with conservative TTLs from tech spec, monitor cache hit rates in later stories, tune based on metrics
- **R3:** Cache key collisions may cause incorrect data retrieval
  - **Mitigation:** Use compound keys (e.g., "userId-propertyId"), document key generation strategy, write unit tests for key generation
- **R4:** Cache invalidation may not occur when database updated directly (bypassing application)
  - **Mitigation:** Document that all data modifications MUST go through application API to maintain cache consistency, consider @CacheEvict on database triggers in production
- **R5:** Ehcache configuration errors may prevent application startup
  - **Mitigation:** Validate ehcache.xml against schema, test configuration during development, provide clear error messages in logs

### References

- [Tech Spec Epic 1: Cache Service](docs/sprint-artifacts/tech-spec-epic-1.md#services-and-modules)
- [Tech Spec Epic 1: Dependencies - Caching](docs/sprint-artifacts/tech-spec-epic-1.md#backend-dependencies-maven)
- [Tech Spec Epic 1: Non-Functional Requirements - Performance - Caching](docs/sprint-artifacts/tech-spec-epic-1.md#performance)
- [Architecture: ADR-002 - No Redis, Use Spring Cache with Caffeine](docs/architecture.md#adr-002-no-redis-use-spring-cache-with-caffeine)
- [Architecture: Performance Considerations - Caching Strategy](docs/architecture.md#caching-strategy)
- [Epics: Story 1.3](docs/epics.md#story-13-ehcache-configuration-for-application-caching)
- [PRD: Performance Requirements](docs/prd.md#55-performance-requirements)

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

### Completion Notes List

### File List
