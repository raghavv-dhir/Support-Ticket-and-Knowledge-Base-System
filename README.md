# Support Ticket and Knowledge Base System

A full-stack application built with ASP.NET Core and React for managing support tickets, tracking SLA targets, posting ticket comments, logging state changes, and maintaining a searchable knowledge base.

---

## Features

### 1. Authentication and Authorization
* Role-based access control with three system roles: Customer, Agent, and Supervisor.
* Secure JWT bearer authentication.
* Registration portal allows users to signup under their selected system role.

### 2. Support Ticket Management
* Customers can submit support tickets with a title, description, and priority level.
* Customers can view their own ticket history.
* Agents and Supervisors can view a list of all tickets with filters for status, priority, and assignee.
* Tickets cannot be edited or updated once they are closed.

### 3. SLA Tracking
* Service Level Agreement deadlines are automatically calculated upon ticket creation based on priority:
  * Critical: 2 hours
  * High: 8 hours
  * Medium: 24 hours
  * Low: 72 hours
* Automatic SLA breach detection flags tickets as breached when active deadlines are exceeded.

### 4. Interactive Ticket Timeline
* Customers and Agents can post comments on active tickets.
* Customers are restricted from viewing or posting comments on tickets created by other customers.
* An immutable audit log records every status transition, logging the previous status, new status, note, timestamp, and author.
* Allowed status transitions are validated:
  * Open -> In Progress
  * In Progress -> Pending Customer or Resolved
  * Pending Customer -> In Progress
  * Resolved -> Closed

### 5. Knowledge Base
* General users can search knowledge base articles by title, body content, or tags.
* Agents can publish new help articles with tags to categorise documentation.

### 6. Supervisor Dashboard
* Supervisors can view real-time statistics of agent workloads including the count of open, resolved, and breached tickets.
* Supervisors can view a dedicated grid tracking all SLA-breached tickets with calculated hours overdue.

---

## Technology Stack

### Backend
* Framework: ASP.NET Core Web API
* Database: MySQL (using Entity Framework Core)
* Security: JWT Bearer Tokens & BCrypt Password Hashing

### Frontend
* Framework: React.js (Vite compiler)
* Routing: React Router DOM
* Styling: Vanilla CSS

---

## Installation and Setup

### Prerequisites
* .NET SDK (8.0 or later)
* Node.js (18 or later)
* MySQL Server

### Database Setup
1. Configure your MySQL connection string in `Backend/SupportTicketAPI/appsettings.json` under `ConnectionStrings:DefaultConnection`.
2. Configure JWT options in `appsettings.json` under `JwtSettings`.

### Running the Backend
1. Open a terminal in the backend directory:
   ```bash
   cd Backend/SupportTicketAPI
   ```
2. Restore packages and run database migrations:
   ```bash
   dotnet ef database update
   ```
3. Run the application:
   ```bash
   dotnet run
   ```
   The backend API will run and expose endpoints with Swagger documentation.

### Running the Frontend
1. Open a terminal in the frontend directory:
   ```bash
   cd Frontend/support-ticket-ui
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend UI will run at `http://localhost:5173`.

---

## Seed Data Accounts
The application database initializes with three test accounts (all passwords are set to "password"):
* Customer: `alice@demo.com`
* Agent: `bob@demo.com`
* Supervisor: `carol@demo.com`
