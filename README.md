# Assignment #9: Company Project Management API

A RESTful API that manages users, projects, and tasks using JWT authentication and role-based access control.

## Setup

1. Install dependencies
npm install

2. Create `.env`
PORT=3000
DB_TYPE=sqlite
DB_NAME=company_projects.db
JWT_SECRET=super_secret_key

3. Initialize database
npm run setup
npm run seed

4. Start server
npm start

## Authentication
Authorization: Bearer <JWT_TOKEN>

## Roles
- employee: view projects, update assigned task status
- manager: create/manage projects and tasks
- admin: full access

## Seed Users
- john@company.com (employee)
- sarah@company.com (manager)
- mike@company.com (admin)

Password for all: password123
