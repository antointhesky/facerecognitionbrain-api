# SmartBrain Server

## Description
SmartBrain Server is the backend API for the SmartBrain face detection application. It handles user authentication, stores user data, and communicates with the Clarifai API to process images and detect faces. Built with Node.js, Express, and PostgreSQL, it provides a secure and efficient backend to support the SmartBrain client.

### Installation
1. Clone the Repository: git clone https://github.com/antointhesky/facerecognitionbrain-api.git
2. Navigate to the Server Directory: cd facerecognitionbrain-api
3. Install Dependencies: npm install

### Set Up the Database
1. Ensure you have PostgreSQL installed and running.
2. Create a new PostgreSQL database (e.g., smartbrain_db).
3. Update the database connection settings in the .env file:  
DB_HOST=localhost  
DB_USER=your_username  
DB_PASSWORD=your_password  
DB_NAME=smartbrain_db  

### Run Locally
Start the Server: npm start
