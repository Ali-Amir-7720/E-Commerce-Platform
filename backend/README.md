# E-Commerce Platform Backend

This is the backend for the E-Commerce platform, built using Node.js, Express.js, and PostgreSQL. It uses raw SQL queries without any ORMs.

## Tech Stack
- Node.js & Express.js
- PostgreSQL (pg library)
- bcrypt for password hashing
- jsonwebtoken for authentication
- dotenv for environment variables
- swagger-ui-express for API documentation

## Setup
1. Clone the repository and navigate to `backend`.
2. Run `npm install` to install dependencies.
3. Create a `.env` file based on `.env.example`.
4. Run the SQL schema to initialize the database: `schema.sql`.
5. Start the server using `node server.js` or `npm run dev` (if nodemon is installed).

## Folder Structure
Follows a modular, RESTful architecture with separate routes, controllers, middleware, and services.

## API Documentation
Swagger documentation is available at `/api-docs`.
