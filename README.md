# Digital World Backend

A Node.js backend application with Express.js and Sequelize ORM for PostgreSQL database.

## Features

- **Express.js** - Fast, unopinionated web framework
- **Sequelize ORM** - PostgreSQL database integration
- **Role-Based Access Control** - User roles and permissions system
- **Database Migrations** - Version control for database schema
- **Database Seeders** - Initial data setup
- **Security** - Helmet, CORS, and other security middlewares

## Database Schema

The application uses the following database tables:
- `roles` - User roles (Super Admin, Admin, Manager, User, Guest)
- `users` - System users with role assignment
- `tabs` - Application modules/sections
- `permissions` - System permissions (create, read, update, delete, etc.)
- `role_permission_tab` - Junction table for role-permission-tab relationships

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   ```bash
   cp env.example .env
   ```
   Update the `.env` file with your database credentials:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_NAME=digital_world_dev
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   ```

3. **Database Setup:**
   ```bash
   # Create database
   npm run db:create
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data
   npm run db:seed
   ```

4. **Start the server:**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the server in production mode |
| `npm run dev` | Start the server in development mode with nodemon |
| `npm run db:create` | Create the database |
| `npm run db:drop` | Drop the database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:migrate:undo` | Undo last migration |
| `npm run db:migrate:undo:all` | Undo all migrations |
| `npm run db:seed` | Run all seeders |
| `npm run db:seed:undo` | Undo all seeders |
| `npm run db:reset` | Drop, create, migrate, and seed database |

## API Endpoints

### Health Check
- `GET /health` - Server and database health check

### Test Endpoint
- `GET /api/v1/test` - API functionality test

## Default Users

After running seeders, you can use these default users:

| Username | Email | Password | Role |
|----------|-------|----------|------|
| superadmin | superadmin@example.com | admin123 | Super Admin |
| admin | admin@example.com | admin123 | Admin |
| manager | manager@example.com | user123 | Manager |
| testuser | user@example.com | user123 | User |

## Directory Structure

```
src/
├── config/
│   ├── config.json          # Database configuration
│   └── database.js          # Database connection
├── migrations/              # Database migration files
├── models/                  # Sequelize models
│   ├── index.js            # Models loader
│   ├── User.js
│   ├── Role.js
│   ├── Tab.js
│   ├── Permission.js
│   └── RolePermissionTab.js
└── seeders/                 # Database seeder files
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment mode | development |
| `DB_HOST` | Database host | 127.0.0.1 |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | digital_world_dev |
| `DB_USERNAME` | Database username | postgres |
| `DB_PASSWORD` | Database password | password |
| `DATABASE_URL` | Full database URL (for production) | - |

## Development

1. Make sure PostgreSQL is running
2. Create a database named `digital_world_dev`
3. Run migrations and seeders
4. Start the development server with `npm run dev`

The server will be available at `http://localhost:3000`

## License

This project is licensed under the ISC License.
