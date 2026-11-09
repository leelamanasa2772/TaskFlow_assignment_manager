# TaskFlow – Student & Faculty Assignment Management System

A full-stack web application designed to simplify assignment management and communication between students and faculty members.

TaskFlow provides separate dashboards for students and faculty. Faculty members can create and publish assignments for specific departments and sections, while students can view their assigned work and submit completed assignments online in PDF format.

## 🎯 Project Objective

The main objective of TaskFlow is to create a centralized platform where faculty can manage assignments and students can access and submit their academic work easily.

It reduces manual assignment distribution and makes the submission process more organized.

## ✨ Key Features

### 👨‍🏫 Faculty Dashboard

- Faculty login and authentication.
- Create and publish assignments.
- Assign work to specific departments and sections.
- Manage assignment details and deadlines.
- View PDF submissions uploaded by students.
- Track student assignment submissions.

### 👩‍🎓 Student Dashboard

- Student registration and login.
- View assignments published by faculty.
- Automatically access assignments based on department and section.
- View assignment details and deadlines.
- Upload completed assignments in PDF format.
- Submit assignments online.

### 🔐 Authentication

- Separate student and faculty access.
- Secure password handling.
- Role-based dashboard access.
- JWT-based authentication.

## 🔄 Application Workflow

1. Faculty logs into the faculty dashboard.
2. Faculty creates an assignment and selects the department and section.
3. The system makes the assignment available to students matching those details.
4. Students log into their dashboards.
5. Students view their respective assignments.
6. Students complete the work and upload it as a PDF.
7. Faculty views the submitted PDF files.

## 🛠️ Technologies Used

### Frontend

- React.js – Building interactive user interfaces.
- HTML5 – Structuring web pages.
- CSS3 – Styling and responsive layouts.
- JavaScript – Application logic and interactions.
- Vite – Frontend development and build tool.
- React Router – Navigation between application pages.

### Backend

- Node.js – Server-side JavaScript runtime.
- Express.js – Building backend APIs.
- REST API – Communication between frontend and backend.
- JWT – Authentication and authorization.
- bcryptjs – Password hashing.

### Database

- MongoDB – Storing user, assignment, and submission information.
- Mongoose – Managing database models and operations.

## 🏗️ System Architecture

The application follows a full-stack architecture:

**Frontend → Backend API → Database**

- The React frontend provides separate interfaces for students and faculty.
- The Express backend processes requests and applies access rules.
- MongoDB stores application data.
- PDF upload functionality handles student assignment submissions.

## 📂 Project Structure

```text
TASKFLOW/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

*Note: Adjust the folder names above if your actual GitHub repository uses a different structure.*

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/leelamanasa2772/TaskFlow_assignment_manager.git
```

### 2. Navigate to the project

```bash
cd TaskFlow_assignment_manager
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Install backend dependencies

Open another terminal:

```bash
cd backend
npm install
```

### 5. Configure environment variables

Create a `.env` file inside the backend folder.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Add any other environment variables required by your application.

### 6. Start the backend

```bash
npm start
```

Use your configured backend start command if it differs.

### 7. Start the frontend

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## 🚀 Future Enhancements

- Assignment grading and feedback system.
- Automatic deadline reminders.
- Assignment submission history.
- Student performance tracking.
- Faculty feedback and grading dashboard.
- Email and notification integration.

## 🎓 Project Outcome

TaskFlow demonstrates how a full-stack web application can improve academic assignment management through separate student and faculty dashboards, department-based assignment distribution, and online PDF submissions.

The project provides practical experience with frontend development, backend API integration, database management, and authentication.

## 👩‍💻 Developer

**Leela Manasa Gopalam**

- GitHub: [@leelamanasa2772](https://github.com/leelamanasa2772)
- Project: [TaskFlow – Assignment Manager](https://github.com/leelamanasa2772/TaskFlow_assignment_manager)

---

⭐ If you find this project useful, feel free to explore the repository!
