# KaamSathi backend

This API uses Spring Boot 3, Java 17, Spring Data JPA, and MySQL. The React/Vite frontend remains in `../frontend`.

## Requirements

- Java 17 or later
- Maven 3.6+
- MySQL 8+

Create a MySQL user/database or use a MySQL account that can create the `kaamsathi` database. Database tables are created and updated by Hibernate at startup.

Configure these environment variables before starting the backend:

```powershell
$env:DB_URL = "jdbc:mysql://localhost:3306/kaamsathi?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME = "root"
$env:DB_PASSWORD = "your-mysql-password"
$env:JWT_SECRET = "replace-with-a-random-secret-of-at-least-32-characters"
$env:ADMIN_SETUP_KEY = "choose-a-private-one-time-setup-key"
```

Start the API from the project root:

```powershell
mvn -f backend\pom.xml spring-boot:run
```

The API listens on `http://localhost:5000`; Vite proxies `/api` requests to it. On first setup, create the initial admin account once:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/setup-admin `
  -Headers @{ "x-admin-setup-key" = $env:ADMIN_SETUP_KEY } `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"change-this-password"}'
```

Then start the frontend with `npm run dev --prefix frontend`, or start both from the project root with `npm run dev`.

## Deploy to Render

The repository includes a Render Blueprint (`../render.yaml`) for the static React site and Dockerized Spring Boot API. Render does not provide a managed MySQL service, so create or choose a reachable external MySQL 8 database before deploying. In Render, create a Blueprint from this GitHub repository and enter `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` when prompted. Use a JDBC URL such as:

```text
jdbc:mysql://your-mysql-host:3306/kaamsathi?useSSL=true&serverTimezone=UTC
```

Render generates `JWT_SECRET` and `ADMIN_SETUP_KEY`. The blueprint configures the API CORS origin and frontend API URL for the service names in `render.yaml`; update those URLs if you change the service names or use a custom domain. After both services are healthy, create the first admin account by sending a one-time `POST` request to `https://kaamsathi-api.onrender.com/api/auth/setup-admin`, with the `x-admin-setup-key` header set to the value of the API's `ADMIN_SETUP_KEY` environment variable and a JSON body containing `username` and a strong `password`. Never put database credentials or setup keys in source control.

The current local MySQL records are not automatically copied to the Render database. Export/import the records separately if the hosted app must start with the existing workers and attendance.
