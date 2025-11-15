# Backend Patterns - Ultra BMS

**Source:** Epic 2 (Authentication & User Management)
**Version:** 1.0
**Last Updated:** November 15, 2025
**Status:** ✅ Production-Ready Patterns

---

## Overview

This document captures proven backend patterns from Epic 2 that should be reused throughout the Ultra BMS backend (Spring Boot + Java 17).

---

## Table of Contents

1. [Controller Layer Pattern](#1-controller-layer-pattern)
2. [Service Layer Pattern](#2-service-layer-pattern)
3. [Repository Pattern with Specifications](#3-repository-pattern-with-specifications)
4. [DTO Pattern with MapStruct](#4-dto-pattern-with-mapstruct)
5. [JWT Token Management](#5-jwt-token-management)
6. [Exception Handling](#6-exception-handling)
7. [Security Configuration](#7-security-configuration)
8. [Request/Response Validation](#8-requestresponse-validation)
9. [Audit Logging Pattern](#9-audit-logging-pattern)
10. [Database Migrations with Flyway](#10-database-migrations-with-flyway)

---

## 1. Controller Layer Pattern

**Purpose:** RESTful API endpoints with proper validation and error handling

### Pattern Structure

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest
    ) {
        AuthResponse response = authService.login(request, servletRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        UserResponse user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        UserResponse user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request
    ) {
        authService.logout(userDetails.getUsername(), request);
        return ResponseEntity.noContent().build();
    }
}
```

### Key Principles
- ✅ **@RestController** for REST APIs
- ✅ **@RequiredArgsConstructor** (Lombok) for dependency injection
- ✅ **@Validated** at class level
- ✅ **@Valid** on request bodies
- ✅ **@PreAuthorize** for role/permission checks
- ✅ **ResponseEntity** for proper HTTP status codes
- ✅ **Thin controllers** - delegate to services

---

## 2. Service Layer Pattern

**Purpose:** Business logic separation with transactions

### Pattern Structure

```java
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final SessionRepository sessionRepository;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest servletRequest) {
        log.info("Login attempt for user: {}", request.getEmail());

        // Find user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        // Check if account is active
        if (!user.isEnabled()) {
            throw new AccountDisabledException("Account is disabled");
        }

        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(user);
        String refreshToken = tokenProvider.generateRefreshToken(user);

        // Create session
        createSession(user, servletRequest);

        log.info("User logged in successfully: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toResponse(user))
                .build();
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.getEmail());

        // Check if user exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already registered");
        }

        // Create user entity
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .enabled(true)
                .build();

        // Assign default role
        Role defaultRole = roleRepository.findByName("TENANT")
                .orElseThrow(() -> new IllegalStateException("Default role not found"));
        user.setRoles(Set.of(defaultRole));

        // Save
        user = userRepository.save(user);

        log.info("User registered successfully: {}", user.getEmail());

        return userMapper.toResponse(user);
    }

    private void createSession(User user, HttpServletRequest request) {
        Session session = Session.builder()
                .user(user)
                .ipAddress(getClientIp(request))
                .userAgent(request.getHeader("User-Agent"))
                .lastActivity(LocalDateTime.now())
                .build();

        sessionRepository.save(session);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
```

### Key Principles
- ✅ **@Service** annotation
- ✅ **@Transactional(readOnly = true)** at class level (performance optimization)
- ✅ **@Transactional** on write operations
- ✅ **@Slf4j** for logging
- ✅ **Constructor injection** via @RequiredArgsConstructor
- ✅ **Business logic encapsulation**
- ✅ **Descriptive logging**

---

## 3. Repository Pattern with Specifications

**Purpose:** Data access layer with type-safe queries

### Pattern Structure

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.enabled = true AND u.lastLogin < :date")
    List<User> findInactiveUsers(@Param("date") LocalDateTime date);
}

// For complex queries, use Specifications
@Repository
public interface TenantRepository extends JpaRepository<Tenant, Long>,
        JpaSpecificationExecutor<Tenant> {

    // Simple queries
    List<Tenant> findByProperty_Id(Long propertyId);

    // Complex queries via Specifications
}

// Tenant specifications
public class TenantSpecifications {

    public static Specification<Tenant> hasPropertyId(Long propertyId) {
        return (root, query, cb) ->
                cb.equal(root.get("property").get("id"), propertyId);
    }

    public static Specification<Tenant> hasActiveStatus() {
        return (root, query, cb) ->
                cb.equal(root.get("status"), TenantStatus.ACTIVE);
    }

    public static Specification<Tenant> leaseEndsBefore(LocalDate date) {
        return (root, query, cb) ->
                cb.lessThan(root.get("leaseEndDate"), date);
    }
}

// Usage in service
@Service
public class TenantService {

    public List<Tenant> findActiveTenantsWithExpiringLeases(Long propertyId, LocalDate beforeDate) {
        Specification<Tenant> spec = Specification
                .where(TenantSpecifications.hasPropertyId(propertyId))
                .and(TenantSpecifications.hasActiveStatus())
                .and(TenantSpecifications.leaseEndsBefore(beforeDate));

        return tenantRepository.findAll(spec);
    }
}
```

### Key Principles
- ✅ Extend **JpaRepository** for CRUD operations
- ✅ **Method naming conventions** for simple queries
- ✅ **@Query** for complex JPQL
- ✅ **JOIN FETCH** to avoid N+1 problems
- ✅ **Specifications** for dynamic complex queries

---

## 4. DTO Pattern with MapStruct

**Purpose:** Separation between entities and API contracts

### Pattern Structure

```java
// Request DTO
@Data
@Builder
public class LoginRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be 8-100 characters")
    private String password;

    private Boolean rememberMe;
}

// Response DTO
@Data
@Builder
public class UserResponse {

    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private Boolean enabled;
    private Set<String> roles;
    private Set<String> permissions;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}

// Entity
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password; // NEVER expose in responses!

    private String firstName;
    private String lastName;
    private Boolean enabled;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles;

    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

// MapStruct Mapper
@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "roles", source = "roles", qualifiedByName = "rolesToStrings")
    @Mapping(target = "permissions", source = "roles", qualifiedByName = "extractPermissions")
    UserResponse toResponse(User user);

    @Named("rolesToStrings")
    default Set<String> rolesToStrings(Set<Role> roles) {
        return roles.stream()
                .map(Role::getName)
                .collect(Collectors.toSet());
    }

    @Named("extractPermissions")
    default Set<String> extractPermissions(Set<Role> roles) {
        return roles.stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getName)
                .collect(Collectors.toSet());
    }
}
```

### Key Principles
- ✅ **Separate DTOs for requests and responses**
- ✅ **Validation annotations** on request DTOs
- ✅ **MapStruct** for automatic mapping
- ✅ **NEVER expose password** or sensitive fields
- ✅ **@PrePersist/@PreUpdate** for audit fields

---

## 5. JWT Token Management

**Purpose:** Secure stateless authentication

### Pattern Structure

```java
@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration);

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("email", user.getEmail());
        claims.put("roles", user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList()));

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getEmail())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    public String generateRefreshToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpiration);

        return Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (SignatureException ex) {
            log.error("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.error("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.error("JWT claims string is empty");
        }
        return false;
    }
}
```

### Configuration (application.yml)

```yaml
jwt:
  secret: ${JWT_SECRET:your-secret-key-min-256-bits-long}
  access-token-expiration: 900000  # 15 minutes
  refresh-token-expiration: 604800000  # 7 days
```

---

## 6. Exception Handling

**Purpose:** Consistent error responses

### Pattern Structure

```java
// Custom exceptions
public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String message) {
        super(message);
    }
}

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}

// Global exception handler
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(
            EmailAlreadyExistsException ex
    ) {
        log.warn("Email already exists: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.CONFLICT.value())
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex
    ) {
        log.warn("Resource not found: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex
    ) {
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .message("Validation failed")
                .details(errors)
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex
    ) {
        log.warn("Bad credentials attempt");

        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .message("Invalid credentials")
                .timestamp(LocalDateTime.now())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
}

// Error response DTO
@Data
@Builder
public class ErrorResponse {
    private int status;
    private String message;
    private Map<String, String> details;
    private LocalDateTime timestamp;
}
```

---

## 7. Security Configuration

**Purpose:** Spring Security setup with JWT

### Pattern Structure

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

---

## Quick Reference Table

| Pattern | File Type | Example Location |
|---------|-----------|------------------|
| Controller | `*Controller.java` | `controller/AuthController.java` |
| Service | `*ServiceImpl.java` | `service/impl/AuthServiceImpl.java` |
| Repository | `*Repository.java` | `repository/UserRepository.java` |
| DTO (Request) | `*Request.java` | `dto/request/LoginRequest.java` |
| DTO (Response) | `*Response.java` | `dto/response/UserResponse.java` |
| Mapper | `*Mapper.java` | `mapper/UserMapper.java` |
| Entity | `*.java` | `entity/User.java` |
| Exception | `*Exception.java` | `exception/EmailAlreadyExistsException.java` |
| Config | `*Config.java` | `config/SecurityConfig.java` |

---

**For Epic 3:** Apply these patterns to Tenant Management module!
