# FinMock — Dashboard Financiero Simulado

Aplicación financiera simulada de tres capas (**Frontend · Backend · Base de Datos**), completamente dockerizada. Diseñada como línea base para formación en estrategias de despliegue y orquestación con **Docker Swarm** y **Kubernetes**.

---

## Arquitectura

El proyecto soporta **dos entornos aislados** (producción y desarrollo) que pueden ejecutarse simultáneamente, cada uno con su propia red Docker y volumen de datos.

```
┌─────────────────────── Production ───────────────────────┐
│                                                          │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────┐ │
│  │   Frontend   │   │     Backend      │   │ Database  │ │
│  │  React/Vite  │──▶│  PHP 8.2/Apache  │──▶│ MySQL 8.0 │ │
│  │  Nginx :3000 │   │     :8088        │   │  :33066   │ │
│  └──────────────┘   └──────────────────┘   └──────────┘ │
│     fin_network_prod                                     │
└──────────────────────────────────────────────────────────┘

┌─────────────────────── Development ──────────────────────┐
│                                                          │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────┐ │
│  │   Frontend   │   │     Backend      │   │ Database  │ │
│  │  React/Vite  │──▶│  PHP 8.2/Apache  │──▶│ MySQL 8.0 │ │
│  │  Nginx :3001 │   │     :8089        │   │  :33068   │ │
│  └──────────────┘   └──────────────────┘   └──────────┘ │
│     fin_network_dev                                      │
└──────────────────────────────────────────────────────────┘
```

### Servicios — Producción

| Servicio   | Tecnología         | Puerto Host | Puerto Contenedor | Nombre Contenedor      |
|------------|--------------------|-----------:|------------------:|------------------------|
| Frontend   | React + Nginx      | `3000`     | `80`              | `finmock_frontend_prod`|
| Backend    | PHP 8.2 + Apache   | `8088`     | `80`              | `finmock_backend_prod` |
| Database   | MySQL 8.0          | `33066`    | `3306`            | `finmock_db_prod`      |

### Servicios — Desarrollo

| Servicio   | Tecnología         | Puerto Host | Puerto Contenedor | Nombre Contenedor      |
|------------|--------------------|-----------:|------------------:|------------------------|
| Frontend   | React + Nginx      | `3001`     | `80`              | `finmock_frontend_dev` |
| Backend    | PHP 8.2 + Apache   | `8089`     | `80`              | `finmock_backend_dev`  |
| Database   | MySQL 8.0          | `33068`    | `3306`            | `finmock_db_dev`       |

> Las bases de datos se exponen en puertos diferentes del host (`33066` prod, `33068` dev) para facilitar la conexión con clientes externos (ej: MySQL Workbench, DBeaver).

---

## Estructura del Proyecto

```
finmock-app/
├── docker-compose.yml              # Orquestación de los 6 servicios (prod + dev)
├── .gitignore
├── README.md
├── db/
│   └── init.sql                    # Schema + datos semilla (compartido)
├── backend/
│   ├── dev/
│   │   ├── Dockerfile              # PHP 8.2 Apache + PDO MySQL
│   │   ├── index.php               # API REST (GET/POST)
│   │   └── config.php              # Configuración DB centralizada
│   └── prod/
│       ├── Dockerfile              # PHP 8.2 Apache + PDO MySQL
│       ├── index.php               # API REST (GET/POST)
│       └── config.php              # Configuración DB centralizada
└── frontend/
    ├── dev/
    │   ├── Dockerfile              # Multi-stage: Node build → Nginx serve
    │   ├── nginx.conf              # SPA fallback config
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── index.html
    │   └── src/
    │       ├── main.jsx
    │       ├── App.jsx             # Componente principal (dashboard)
    │       └── index.css           # Estilos globales (dark mode)
    └── prod/
        ├── Dockerfile              # Multi-stage: Node build → Nginx serve
        ├── nginx.conf              # SPA fallback config
        ├── package.json
        ├── vite.config.js
        ├── index.html
        └── src/
            ├── main.jsx
            ├── App.jsx             # Componente principal (dashboard)
            └── index.css           # Estilos globales (dark mode)
```

---

## Inicio Rápido

### Requisitos Previos

- [Docker](https://docs.docker.com/get-docker/) ≥ 20.10
- [Docker Compose](https://docs.docker.com/compose/install/) ≥ 2.0

### Levantar el Entorno

```bash
# Clonar / posicionarse en el directorio del proyecto
cd finmock-app

# Construir y levantar TODOS los servicios (prod + dev)
docker compose up --build -d

# Levantar solo producción
docker compose up --build -d db_prod backend_prod frontend_prod

# Levantar solo desarrollo
docker compose up --build -d db_dev backend_dev frontend_dev

# Verificar que los contenedores están corriendo
docker compose ps
```

### Acceder a la Aplicación

| Recurso                    | URL                                                |
|----------------------------|----------------------------------------------------|
| **Frontend Producción**    | [http://localhost:3000](http://localhost:3000)      |
| **Backend API Producción** | [http://localhost:8088](http://localhost:8088)      |
| **Frontend Desarrollo**    | [http://localhost:3001](http://localhost:3001)      |
| **Backend API Desarrollo** | [http://localhost:8089](http://localhost:8089)      |

### Detener el Entorno

```bash
# Parar todos los servicios
docker compose down

# Parar y eliminar volúmenes (resetea ambas bases de datos)
docker compose down -v
```

---

## Límites de Recursos

Los servicios de frontend incluyen límites de recursos para controlar el consumo de CPU y memoria:

```yaml
deploy:
  resources:
    limits:
      cpus: "0.15"
      memory: 250M
    reservations:
      cpus: "0.1"
      memory: 128M
```

Estos límites aplican tanto al frontend de producción como al de desarrollo.

---

## Conexiones entre Servicios

### Redes Docker

Los entornos están **aislados** en redes bridge independientes:

| Red                  | Servicios conectados                                    |
|----------------------|---------------------------------------------------------|
| `fin_network_prod`   | `db_prod`, `backend_prod`, `frontend_prod`              |
| `fin_network_dev`    | `db_dev`, `backend_dev`, `frontend_dev`                 |

Dentro de cada red, los servicios se resuelven entre sí por **nombre de servicio** (DNS interno de Docker):

| Origen         | Destino     | Hostname     | Puerto |
|----------------|-------------|--------------|-------:|
| backend_prod   | db_prod     | `db_prod`    | `3306` |
| backend_dev    | db_dev      | `db_dev`     | `3306` |
| frontend_*     | backend_*   | _vía host_   | `8088` / `8089` |

> **Nota:** El frontend es una SPA que corre en el **navegador del usuario**, por lo que las llamadas a la API van a `localhost` (el host), no al nombre de servicio Docker.

### Conexión Backend → Base de Datos

El backend se conecta a MySQL usando **PDO** con las siguientes variables de entorno:

| Variable   | Valor (Prod)  | Valor (Dev)   | Descripción                    |
|------------|---------------|---------------|--------------------------------|
| `DB_HOST`  | `db_prod`     | `db_dev`      | Hostname del servicio MySQL    |
| `DB_NAME`  | `findb`       | `findb`       | Nombre de la base de datos     |
| `DB_USER`  | `user`        | `user`        | Usuario MySQL                  |
| `DB_PASS`  | `password`    | `password`    | Contraseña del usuario         |

### Conexión Frontend → Backend

La URL de la API se configura en tiempo de **build** mediante la variable de entorno de Vite:

| Variable        | Valor (Prod)               | Valor (Dev)                | Descripción                     |
|-----------------|----------------------------|----------------------------|---------------------------------|
| `VITE_API_URL`  | `http://localhost:8088`    | `http://localhost:8089`    | URL de la API desde el navegador |

> ⚠️ **Importante:** Vite embebe las variables de entorno en el bundle de JavaScript durante la compilación. Cambiar `VITE_API_URL` requiere **reconstruir** la imagen del frontend.

### Credenciales MySQL

| Parámetro               | Valor (ambos entornos) |
|--------------------------|------------------------|
| Root Password            | `rootpassword`         |
| Database                 | `findb`                |
| User                     | `user`                 |
| Password                 | `password`             |

---

## API Endpoints

### `GET /` — Listar Transacciones

```bash
# Producción
curl http://localhost:8088

# Desarrollo
curl http://localhost:8089
```

**Respuesta** (`200 OK`):

```json
[
  {
    "id": "1",
    "description": "Sueldo",
    "amount": "2500.00",
    "type": "income",
    "created_at": "2026-02-21 06:00:00"
  }
]
```

### `POST /` — Crear Transacción

```bash
curl -X POST http://localhost:8088 \
  -H "Content-Type: application/json" \
  -d '{"description": "Freelance", "amount": 800.00, "type": "income"}'
```

**Respuesta** (`201 Created`):

```json
{
  "message": "Transacción creada",
  "id": "4"
}
```

**Errores:**

- `400 Bad Request` — Datos incompletos (faltan `description`, `amount` o `type`)
- `500 Internal Server Error` — Error de conexión a la base de datos

---

## Datos Semilla

El fichero `db/init.sql` se ejecuta automáticamente la **primera vez** que se crea el volumen de datos (`db_data_prod` y `db_data_dev`):

| ID | Descripción         | Monto     | Tipo      |
|----|---------------------|----------:|-----------|
| 1  | Sueldo              | 2,500.00  | income    |
| 2  | Cursor              | 45.50     | expense   |
| 3  | Restaurante         | 12.00     | expense   |

> Para reiniciar los datos semilla, elimina los volúmenes: `docker compose down -v && docker compose up --build -d`

---

## Healthcheck

Los servicios de base de datos (`db_prod` y `db_dev`) incluyen un **healthcheck** que verifica la disponibilidad de MySQL. Los backends tienen `depends_on` con `condition: service_healthy`, lo que garantiza que no arrancarán hasta que MySQL esté listo para aceptar conexiones.

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpassword"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

---

## Para la Formación (Próximos Pasos)

Este proyecto está preparado para ser migrado a:

- **Docker Swarm**: Convertir `docker-compose.yml` en un stack de Swarm con réplicas y servicios distribuidos.
- **Kubernetes**: Crear manifiestos (Deployments, Services, ConfigMaps, PVCs) a partir de la arquitectura existente.

---

## Licencia

Proyecto de formación — Uso interno.
