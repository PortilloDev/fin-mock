# FinMock — Dashboard Financiero Simulado

Aplicación financiera simulada de tres capas (**Frontend · Backend · Base de Datos**), completamente dockerizada. Diseñada como línea base para formación en estrategias de despliegue y orquestación con **Docker Swarm** y **Kubernetes**.

---

## Arquitectura

```
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│   Frontend   │      │     Backend      │      │   Database   │
│  React/Vite  │─────▶│   PHP 8.2/Apache │─────▶│  MySQL 8.0   │
│  Nginx :3000 │      │     :8088        │      │   :3306      │
└──────────────┘      └──────────────────┘      └──────────────┘
     SPA (port 3000)       API REST (port 8088)      Persistencia
```

| Servicio   | Tecnología         | Puerto Host | Puerto Contenedor | Nombre Contenedor  |
|------------|--------------------|-----------:|------------------:|--------------------|
| Frontend   | React + Nginx      | `3000`     | `80`              | `finmock_frontend` |
| Backend    | PHP 8.2 + Apache   | `8088`     | `80`              | `finmock_backend`  |
| Database   | MySQL 8.0          | `33066`    | `3306`            | `finmock_db`       |

> La base de datos se expone en el puerto `33066` del host para facilitar la conexión con clientes externos (ej: MySQL Workbench, DBeaver).

---

## Estructura del Proyecto

```
finmock-app/
├── docker-compose.yml          # Orquestación de los 3 servicios
├── README.md
├── db/
│   └── init.sql                # Schema + datos semilla
├── backend/
│   ├── Dockerfile              # PHP 8.2 Apache + PDO MySQL
│   ├── index.php               # API REST (GET/POST)
│   └── config.php              # Configuración DB centralizada
└── frontend/
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

# Construir imágenes y levantar los servicios
docker compose up --build -d

# Verificar que los 3 contenedores están corriendo
docker compose ps
```

### Acceder a la Aplicación

| Recurso            | URL                                      |
|--------------------|------------------------------------------|
| **Frontend (SPA)** | [http://localhost:3000](http://localhost:3000) |
| **Backend (API)**  | [http://localhost:8088](http://localhost:8088) |

### Detener el Entorno

```bash
# Parar los servicios
docker compose down

# Parar y eliminar volúmenes (resetea la base de datos)
docker compose down -v
```

---

## Conexiones entre Servicios

### Red Docker

Todos los servicios están conectados a la red bridge `fin_network`. Dentro de esta red, los servicios se resuelven entre sí por **nombre de servicio** (DNS interno de Docker):

| Origen    | Destino   | Hostname   | Puerto |
|-----------|-----------|------------|-------:|
| Backend   | Database  | `db`       | `3306` |
| Frontend  | Backend   | _vía host_ | `8088` |

> **Nota:** El frontend es una SPA que corre en el **navegador del usuario**, por lo que las llamadas a la API van a `http://localhost:8088` (el host), no al nombre de servicio Docker.

### Conexión Backend → Base de Datos

El backend se conecta a MySQL usando **PDO** con las siguientes variables de entorno:

| Variable   | Valor por Defecto | Descripción                    |
|------------|-------------------|--------------------------------|
| `DB_HOST`  | `db`              | Hostname del servicio MySQL    |
| `DB_NAME`  | `findb`           | Nombre de la base de datos     |
| `DB_USER`  | `user`            | Usuario MySQL                  |
| `DB_PASS`  | `password`        | Contraseña del usuario         |

**Cadena de conexión resultante:**

```
mysql:host=db;dbname=findb  (user: user / pass: password)
```

### Conexión Frontend → Backend

La URL de la API se configura en tiempo de **build** mediante la variable de entorno de Vite:

| Variable        | Valor por Defecto         | Descripción                    |
|-----------------|---------------------------|--------------------------------|
| `VITE_API_URL`  | `http://localhost:8088`   | URL de la API desde el navegador |

> ⚠️ **Importante:** Vite embebe las variables de entorno en el bundle de JavaScript durante la compilación. Cambiar `VITE_API_URL` requiere **reconstruir** la imagen del frontend.

### Credenciales MySQL

| Parámetro               | Valor            |
|--------------------------|-----------------|
| Root Password            | `rootpassword`  |
| Database                 | `findb`         |
| User                     | `user`          |
| Password                 | `password`      |

---

## API Endpoints

### `GET /` — Listar Transacciones

```bash
curl http://localhost:8088
```

**Respuesta** (`200 OK`):

```json
[
  {
    "id": "1",
    "description": "Nómina",
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

El fichero `db/init.sql` se ejecuta automáticamente la **primera vez** que se crea el volumen `db_data`:

| ID | Descripción         | Monto     | Tipo      |
|----|---------------------|----------:|-----------|
| 1  | Nómina              | 2,500.00  | income    |
| 2  | Suscripción Cloud   | 45.50     | expense   |
| 3  | Cafetería           | 12.00     | expense   |

> Para reiniciar los datos semilla, elimina el volumen: `docker compose down -v && docker compose up --build -d`

---

## Healthcheck

El servicio `db` incluye un **healthcheck** que verifica la disponibilidad de MySQL. El backend tiene `depends_on` con `condition: service_healthy`, lo que garantiza que no arrancará hasta que MySQL esté listo para aceptar conexiones.

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
