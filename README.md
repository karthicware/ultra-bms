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
