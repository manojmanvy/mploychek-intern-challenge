# MPloyChek — Role-Based User Management System

A full-stack web application developed as part of the **MPloyChek Software Intern Challenge**. This project demonstrates role-based authentication, dashboard development, REST API integration, asynchronous data loading, and administrative user management.

Built using Angular, Node.js, Express.js, and MongoDB.

---

## 📌 Table of Contents

* [Overview](#-overview)
* [Features](#-features)
* [Tech Stack](#️-tech-stack)
* [Application Architecture](#-application-architecture)
* [Getting Started](#-getting-started)
* [Demo Credentials](#-demo-credentials)
* [API Endpoints](#-api-endpoints)
* [Project Structure](#-project-structure)
* [Security Considerations](#-security-considerations)
* [Developer](#-developer)
* [Application Screenshots](#-application-screenshots)

---

## 🎯 Overview

MPloyChek is a role-based user management application that demonstrates how a frontend communicates with backend APIs and a database.

The application provides separate functionality for general users and administrators.

General users can log in, view their profile information, and access application records. Administrators can manage user accounts through a dedicated dashboard.

The project also demonstrates asynchronous API requests and loading indicators to simulate real-world application behavior.

---

## ✨ Features

### 🔐 Authentication

* Login using User ID, password, and role.
* Backend API integration for credential validation.
* Session information maintained on the frontend.
* Logout functionality.

### 📊 Interactive Dashboard

* Personalized user information.
* Profile information retrieved through REST APIs.
* Application records displayed in a structured table.
* Loading indicators during asynchronous API requests.
* User-friendly error and success messages.

### 🛡️ Administrative User Management

* Dedicated administrator dashboard.
* View registered user accounts.
* Create new user accounts.
* Delete existing user accounts.
* Assign roles during user creation.

### ⚡ Backend Integration

* REST API architecture using Node.js and Express.js.
* MongoDB integration using Mongoose.
* Initial user-data migration from a JSON file when the database collection is empty.
* Configurable API delays for demonstrating asynchronous processing.

### 🎨 User Interface

* Modern dark-themed dashboard.
* Responsive layouts for different screen sizes.
* Interactive tables and forms.
* Status indicators and loading states.
* Consistent styling across application pages.

---

## 🛠️ Tech Stack

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| Angular 12 | Frontend framework            |
| TypeScript | Application logic             |
| HTML5      | Page structure                |
| CSS3       | Styling and responsive design |
| Node.js    | Backend runtime               |
| Express.js | REST API development          |
| MongoDB    | Database                      |
| Mongoose   | MongoDB object modeling       |
| Git        | Version control               |
| GitHub     | Source code hosting           |

---

## 🏗️ Application Architecture

```text
                    ┌──────────────────────┐
                    │       Browser        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Angular Frontend   │
                    │                      │
                    │   Login Page         │
                    │   User Dashboard     │
                    │   Admin Dashboard    │
                    │   Angular Services   │
                    └──────────┬───────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌──────────────────────┐
                    │    Express.js API    │
                    │                      │
                    │   Authentication     │
                    │   Profile & Records  │
                    │   User Management    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       MongoDB        │
                    │    User Accounts     │
                    └──────────────────────┘
```

---

## 🚀 Getting Started

Follow these instructions to run the application locally.

### Prerequisites

* [Node.js](https://nodejs.org/)
* npm
* [Angular CLI](https://angular.dev/tools/cli)
* A MongoDB database, such as MongoDB Atlas
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/manojmanvy/mploychek-intern-challenge.git
cd mploychek-intern-challenge
```

### 2. Install Frontend Dependencies

From the project root:

```bash
npm install
```

### 3. Configure the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory and configure the environment variables expected by the backend code.

Example:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
```

**Important:** Check the backend source code for the exact environment-variable names. Replace the example connection string with your own MongoDB connection string. Never upload real database credentials or `.env` files to GitHub.

### 4. Start the Backend

From the `backend` directory:

```bash
npm start
```

The backend should be available at:

```text
http://localhost:3000
```

### 5. Start the Frontend

Open a separate terminal in the project root:

```bash
ng serve
```

Open the application in your browser:

```text
http://localhost:4200
```

---

## 🔑 Demo Credentials

The following demonstration accounts are configured for testing the application.

| Role          | User ID    | Password    |
| ------------- | ---------- | ----------- |
| General User  | `user001`  | `User@123`  |
| General User  | `user002`  | `User@123`  |
| Administrator | `admin001` | `Admin@123` |

> These are demonstration credentials only and must not be used in a production environment.

---

## 🔄 Application Workflow

1. The user opens the application.
2. The user enters their User ID, password, and role.
3. The frontend sends a login request to the backend.
4. The backend validates the credentials and returns an authentication response.
5. The dashboard retrieves profile information and application records.
6. Loading indicators demonstrate asynchronous API processing.
7. Administrators can access user-management functionality.
8. Administrators can create and delete user accounts.
9. Users can log out of the application.

---

## 🔌 API Endpoints

| HTTP Method | Endpoint         | Description                       |
| ----------- | ---------------- | --------------------------------- |
| GET         | `/api/health`    | Check backend health              |
| POST        | `/api/login`     | Authenticate a user               |
| POST        | `/api/logout`    | Log out                           |
| GET         | `/api/profile`   | Retrieve profile information      |
| GET         | `/api/records`   | Retrieve application records      |
| GET         | `/api/users`     | Retrieve users for administration |
| POST        | `/api/users`     | Create a user account             |
| PUT         | `/api/users/:id` | Update a user account             |
| DELETE      | `/api/users/:id` | Delete a user account             |

The application also supports configurable API delays to demonstrate asynchronous request handling.

> Verify the backend implementation for the exact request formats, authorization requirements, and behavior of each endpoint.

---

## 📁 Project Structure

```text
mploychek-intern-challenge/
│
├── backend/
│   ├── src/
│   │   └── server.ts
│   ├── data/
│   │   └── users.json
│   ├── package.json
│   └── .env
│
├── src/
│   ├── app/
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   └── dashboard/
│   │   ├── services/
│   │   ├── app-routing.module.ts
│   │   └── app.module.ts
│   ├── assets/
│   ├── environments/
│   └── styles.css
│
├── screenshots/
│   ├── screenshots.jpg
│   ├── screenshots.jpg
│   ├── screenshots.jpg
│   └── screenshots.jpg
│
├── .gitignore
├── angular.json
├── package.json
├── package-lock.json
└── README.md
```

---

## 🔒 Security Considerations

This project is intended as an internship demonstration.

Before production deployment, consider implementing or verifying:

* Secure password hashing.
* Robust authentication and session/token validation.
* Server-side role-based authorization for administrative endpoints.
* Input validation and appropriate error handling.
* Secure environment-variable management.
* HTTPS and appropriate security headers.
* Protection against unauthorized access to user-management operations.

Administrative functionality must be protected by backend authorization checks, not just frontend visibility controls.

---

## 🚀 Future Improvements

* Implement secure password hashing.
* Improve authentication and session management.
* Strengthen server-side authorization and validation.
* Add automated unit and integration tests.
* Deploy the frontend and backend.
* Add pagination and search to user-management tables.
* Improve application monitoring and logging.

---

## 👨‍💻 Developer

**Manoj Sundarrajan**

Computer Science Engineering Graduate | Aspiring Software Developer

* **GitHub:** [@manojmanvy](https://github.com/manojmanvy)
* **Portfolio:** [Visit Portfolio](https://manojmanvy.github.io/manoj_portfolio/)
* **LinkedIn:** [Connect on LinkedIn](https://www.linkedin.com/in/manoj-sundarrajan-756a36346)

---

## 📸 Application Screenshots

### 1. Login Page

![Login Page](screenshots/screenshot(168).png)

<br/>

### 2. General User Dashboard

![General User Dashboard](screenshots/screenshot(169).png)

<br/>

### 3. Administrator Dashboard

![Administrator Dashboard](screenshots/screenshot(165).png)

<br/>

### 4. User Management

![User Management](screenshots/screenshot(167).png)

---

⭐ If you find this project interesting, feel free to explore the repository.
