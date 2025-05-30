# centrya-backend

## Docker Setup

This project uses Docker and Docker Compose to simplify development and deployment.

### Prerequisites

*   **Docker and Docker Compose**: Ensure you have Docker Desktop (which includes Docker Compose) installed on your system.
    *   Official installation guide: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

### Environment Variables

The Docker Compose setup uses environment variables defined directly within the `docker-compose.yml` (for development defaults) and `docker-compose.prod.yml` (for production defaults) files.

For local development, you can optionally create a `.env` file in the root of this repository to override these defaults or to provide sensitive credentials without modifying the compose files directly. Docker Compose automatically loads this file.

**Example `.env` file for development (matching `docker-compose.yml` defaults):**
```env
# Backend application port
PORT=3000

# Development Database credentials (match these in docker-compose.yml's db service)
DB_HOST=db
DB_PORT=5432
DB_USERNAME=devuser
DB_PASSWORD=devpassword
DB_DATABASE=devdb

# For production, these would be different and managed securely via your hosting environment.
```

### Development Environment

The development environment provides hot-reloading for the backend service.

*   **Build and run services**:
    ```bash
    docker-compose up --build
    ```
*   **Run in detached mode (background)**:
    ```bash
    docker-compose up -d
    ```
*   **Stop services**:
    ```bash
    docker-compose down
    ```
*   **Accessing the application**: Once running, the application is accessible at `http://localhost:3000`.
*   **Accessing Swagger API documentation**: The Swagger UI is available at `http://localhost:3000/api`.
*   **Hot Reloading**: Changes made to the source code in the `user-management-backend` directory will automatically trigger a reload of the backend service.

### Production Environment

The production environment uses settings optimized for deployment.

*   **Build and run services for production**:
    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
    ```
    This command merges the base `docker-compose.yml` with `docker-compose.prod.yml` for production-specific configurations (e.g., different database credentials, no source code mounting).
*   **Stop production services**:
    ```bash
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
    ```
*   **Data Persistence**: Production database data is stored in a Docker named volume called `prod_pgdata` to ensure data persistence across container restarts.

### Accessing Database

*   **Development**: The PostgreSQL database for the development environment is mapped to `localhost:5432` by default as defined in `docker-compose.yml`. You can connect to it using any compatible database client with the credentials `devuser`/`devpassword` for database `devdb`.
*   **Production**: For security reasons, direct external access to the production database container might be disabled (port not mapped to host in `docker-compose.prod.yml`). Application services within the Docker network can access it via its service name (`db`) and configured port (`5432`).