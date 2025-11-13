# Ultra BMS Backend

Spring Boot backend for Ultra Building Maintenance System.

## Prerequisites

- Java 17 or higher
- Maven 3.9+
- PostgreSQL 14+ (for production, Story 1.2)

## Build & Run

```bash
# Build
./mvnw clean install

# Run
./mvnw spring-boot:run
```

## Configuration

- `application.yml` - Main configuration
- `application-dev.yml` - Development configuration
- `application-prod.yml` - Production configuration

## Code Quality

```bash
# Run Checkstyle
./mvnw checkstyle:check

# Run tests
./mvnw test
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Package Structure

```
com.ultrabms/
├── config/          # Configuration classes
├── controller/      # REST controllers
├── service/         # Business logic
├── repository/      # Data access
├── entity/          # JPA entities
├── dto/             # Data transfer objects
├── mapper/          # Entity-DTO mappers
├── exception/       # Custom exceptions
├── security/        # Security configuration
└── util/            # Utility classes
```
