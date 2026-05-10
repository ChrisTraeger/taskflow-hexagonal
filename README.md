# TaskFlow — Sistema de Gestión de Tareas Colaborativas

> Arquitectura Hexagonal · Código Limpio · Principios SOLID  
> Backend: Django REST Framework | Frontend: React 18 + TypeScript | Base de datos: PostgreSQL

---

## Descripción

TaskFlow es una aplicación web de gestión de tareas colaborativas para equipos. Implementa **Arquitectura Hexagonal (Ports & Adapters)** para garantizar que la lógica de negocio sea completamente independiente de frameworks, bases de datos e interfaces de usuario.

---

## Arquitectura

```
taskflow-hexagonal/
├── backend/
│   ├── domain/               # Entidades, Value Objects, Excepciones (Python puro)
│   │   ├── entities/         # Task, Project, User
│   │   ├── value_objects/    # TaskStatus, Priority, Email
│   │   └── exceptions/       # DomainException, TaskNotFoundError
│   ├── application/          # Casos de uso y Ports (interfaces)
│   │   ├── use_cases/        # CreateTask, AssignTask, CompleteTask
│   │   └── ports/            # ITaskRepository, INotificationPort
│   ├── infrastructure/       # Adapters (implementan los Ports)
│   │   ├── repositories/     # DjangoTaskRepository
│   │   ├── notifications/    # EmailAdapter, WebSocketAdapter
│   │   └── models/           # Modelos ORM de Django
│   ├── presentation/         # API REST (DRF ViewSets)
│   │   └── api/
│   └── tests/
│       └── unit/
└── frontend/
    └── src/
        ├── domain/           # Types e interfaces TypeScript
        ├── application/      # Hooks: useTasks, useProjects
        ├── infrastructure/   # Services (llamadas a la API)
        └── presentation/     # Componentes React
```

---

## Principios SOLID aplicados

| Principio | Aplicación en TaskFlow |
|-----------|----------------------|
| **SRP** | `Task` solo gestiona reglas de tarea. `DjangoTaskRepository` solo persiste. `EmailAdapter` solo notifica. |
| **OCP** | Agregar `MongoTaskRepository` no modifica el dominio ni los casos de uso. |
| **LSP** | `DjangoTaskRepository` y cualquier futura implementación de `ITaskRepository` son intercambiables. |
| **ISP** | `ITaskRepository` separado de `INotificationPort`. Cada adapter implementa solo lo que necesita. |
| **DIP** | `CreateTaskUseCase` recibe `ITaskRepository` (interfaz), no `DjangoTaskRepository` (concreción). |

---

## Flujo de una petición

```
React (UI)
  → POST /api/tasks/
    → DRF ViewSet (Adapter de entrada)
      → CreateTaskUseCase (Application)
        → Task entity (Domain)
          → ITaskRepository.save() (Port)
            → DjangoTaskRepository (Adapter de salida)
              → PostgreSQL
```

---

## Instalación y ejecución

### Requisitos
- Docker y Docker Compose
- Python 3.11+ (para desarrollo local sin Docker)
- Node.js 18+ (para desarrollo local sin Docker)

### Con Docker (recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/estudiante/taskflow-hexagonal.git
cd taskflow-hexagonal

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Levantar los servicios
docker compose up --build

# 4. Aplicar migraciones (primera vez)
docker compose exec backend python manage.py migrate

# 5. Crear superusuario
docker compose exec backend python manage.py createsuperuser
```

La aplicación estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin

### Desarrollo local sin Docker

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Frontend (en otra terminal)
cd frontend
npm install
npm start
```

---

## Endpoints de la API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/token/` | Obtener JWT (login) |
| `POST` | `/api/auth/token/refresh/` | Renovar JWT |
| `GET` | `/api/projects/` | Listar proyectos del usuario |
| `POST` | `/api/projects/` | Crear nuevo proyecto |
| `GET` | `/api/projects/{id}/tasks/` | Tareas de un proyecto |
| `POST` | `/api/tasks/` | Crear nueva tarea |
| `PATCH` | `/api/tasks/{id}/` | Actualizar estado/asignado |
| `DELETE` | `/api/tasks/{id}/` | Eliminar tarea |

---

## Tests

```bash
# Backend (pytest)
cd backend
pytest tests/ -v

# Resultado esperado:
# tests/unit/test_task_entity.py ......
# tests/unit/test_create_task_use_case.py ....
# tests/unit/test_email_value_object.py ....
```

Los tests no necesitan base de datos: los casos de uso reciben **mocks** gracias al principio DIP.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|------------|---------|
| Backend | Django + DRF | 4.2 / 3.14 |
| Frontend | React + TypeScript | 18 / 5.0 |
| Base de datos | PostgreSQL | 15 |
| Autenticación | JWT (simplejwt) | 5.3 |
| Contenedores | Docker + Compose | 24 / 2.2 |
| Testing | pytest + unittest.mock | 7.4 |

---

## Autor

Actividad — Programación Orientada a Objetos Avanzada  
Ingeniería de Sistemas — 2025
