# **Nexus E-Commerce Platform**

This project is a full stack e commerce platform with multiple user roles. Follow the steps below to set up and run the project locally.

---

## **Prerequisites**

Make sure the following are installed on your system:

| Requirement | Version |
| ----- | ----- |
| Node.js | 18 or higher |
| npm | 9 or higher |
| PostgreSQL | 14 or higher |

---

## **Project Setup**

Clone the repository and move into the project folder.

git clone [https://github.com/Ali-Amir-7720/E-Commerce-Platform.git](https://github.com/Ali-Amir-7720/E-Commerce-Platform.git)  
cd E-Commerce-Platform

---

## **Backend Setup**

Move into the backend folder and install dependencies.

cd backend  
npm install

---

## **Frontend Setup**

Move into the frontend folder and install dependencies.

cd frontend  
npm install

---

## **Environment Configuration**

Create a file named .env inside the backend folder and add the following variables.

PORT=3000  
NODE\_ENV=development

DB\_HOST=localhost  
DB\_PORT=5432  
DB\_NAME=ecommerce\_db  
DB\_USER=postgres  
DB\_PASSWORD=your\_password

JWT\_SECRET=any\_random\_string  
JWT\_EXPIRES\_IN=7d

---

## **Database Setup**

1. Open PostgreSQL or pgAdmin  
2. Create a new database

CREATE DATABASE ecommerce\_db;

3. Connect to the database and run schema.sql  
4. Run seed.sql or migrations if available

---

## **Running the Project**

Start the backend server.

cd backend  
node server.js

Expected output

Server running at [http://localhost:3000](http://localhost:3000)

---

Start the frontend development server.

cd frontend  
npm run dev

Expected output

Local server running at [http://localhost:5173](http://localhost:5173)

---

## **Access the Application**

Open the following in your browser:

[http://localhost:5173](http://localhost:5173)

---

## **Notes**

* Make sure PostgreSQL is running before starting the backend  
* Check .env values if database connection fails  
* Backend must run before frontend for API requests to work

