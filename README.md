# Ziver App - MVP v1.0

![Ziver Logo](https://via.placeholder.com/150/00E676/0D0D0D?text=ZIVER)

Welcome to the official repository for the Ziver App MVP. This project is the foundational step towards building a pioneering multi-blockchain platform designed to revolutionize user engagement through reward-based incentives and decentralized finance (DeFi), delivered as a Telegram Mini App (TMA).

## 📖 Project Overview

This initial version (MVP) focuses on delivering the core user experience: a simple and engaging way for users to join the ecosystem, earn points, and establish their on-chain reputation through our simplified Social Capital Score.

## ✨ Core Features (MVP)

* **User Authentication:** Secure user registration and login functionality.
* **Mining Hub:** A central dashboard where users can initiate "mining" sessions to earn Ziv Points (ZP).
* **Daily Streak:** A mechanism to reward users for consecutive daily engagement.
* **Social Capital Score (Simplified):** A points-based system that rewards users for various in-app activities:
    * Daily Login: 1-10 points
    * Mining Click: 5-15 points
    * Task Completion: 1-8 points (Placeholder)
    * Successful Referrals: 10-20 points (Placeholder)
* **Task & Referral Placeholders:** UI elements and backend routes outlined for future implementation.

## 🛠️ Technology Stack

This project is built with a modern, scalable, and efficient technology stack:

* **Frontend:** [React.js](https://reactjs.org/)
* **Backend:** [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/)
* **Database:** [PostgreSQL](https://www.postgresql.org/)

## 📂 Project Structure

The project is organized into a monorepo structure with two main directories: `client` for the frontend and `server` for the backend.

ziver-app/
├── client/              # Frontend React Code
├── server/              # Backend Node.js/Express Code
└── README.md

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

### Prerequisites

Make sure you have the following software installed on your machine:
* [Node.js](https://nodejs.org/en/download/) (which includes npm)
* [PostgreSQL](https://www.postgresql.org/download/)

### ⚙️ Backend Setup (`server/`)

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Install NPM packages:**
    ```bash
    npm install
    ```
3.  **Create an environment file:**
    Create a file named `.env` in the `server/` directory and add the following variables. This file stores sensitive information like your database connection string.

    ```
    # .env
    DATABASE_URL="postgresql://<YOUR_DB_USER>:<YOUR_DB_PASSWORD>@localhost:5432/<YOUR_DB_NAME>"
    PORT=5000
    JWT_SECRET="<YOUR_VERY_SECRET_JWT_KEY>"
    ```

4.  **Set up the PostgreSQL database:**
    Make sure your PostgreSQL server is running and you have created a database with the name you specified in the `.env` file.

5.  **Run the server:**
    ```bash
    npm run dev
    ```
    The backend server should now be running on `http://localhost:5000`.

### 🖥️ Frontend Setup (`client/`)

1.  **Navigate to the client directory (from the root):**
    ```bash
    cd client
    ```
2.  **Install NPM packages:**
    ```bash
    npm install
    ```
3.  **Run the client:**
    ```bash
    npm start
    ```
    The React development server will start, and you can view the application in your browser, typically at `http://localhost:3000`.

## 📝 API Endpoints

The following API endpoints will be developed for the MVP:

### Authentication
* `POST /api/auth/register` - Register a new user.
* `POST /api/auth/login` - Log in an existing user.

### User Data
* `GET /api/user/me` - Get the logged-in user's profile data (ZP balance, score, etc.).
* `POST /api/user/activity` - Log a user activity to update their Social Capital Score.

### Mining
* `POST /api/mining/claim` - Claim ZP from a mining session.

---
_This README is a living document and will be updated as the project evolves._