# Storage Management System - Backend

This is a technical task for Kodevio Limited.

A backend API for managing storage, files, folders, notes, images, and PDFs. Built with Node.js, Express, TypeScript, and MongoDB.

## What It Does

- User signup and login with JWT tokens
- Upload and manage files (images and PDFs)
- Organize files in folders
- Create and manage notes
- Track storage usage
- Password reset via email
- Request validation and error handling

## What You Need

- Node.js installed
- MongoDB database running

## How to Run

1. Clone the repo:
   ```
   git clone <repository-url>
   cd "Storage Management System"
   ```

2. Install packages:
   ```
   npm install
   ```

3. Create a `.env` file in the root folder and add these variables:
   ```
   NODE_ENV=development
   PORT=3000
   APP_NAME=Storage Management System
   
   MONGODB_URI=your_mongodb_connection_string
   
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your_refresh_token_secret
   JWT_REFRESH_EXPIRE=30d
   
   BCRYPT_SALT_ROUNDS=10
   
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./public/uploads
   
   LOG_LEVEL=info
   
   SMTP_HOST=your_smtp_host
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   SMTP_FROM=your_email_address
   ```

4. Start the server:
   ```
   npm start
   ```

   Or for development (auto-reloads on changes):
   ```
   npm run dev
   ```

The server runs on port 3000 by default (or whatever you set in PORT).

## API Documentation

A Postman collection is available with all API endpoints. Import the `postman.json` file into Postman to test the API.

## Folder Structure



## Tech Stack

- Node.js and Express for the server
- TypeScript for type safety
- MongoDB with Mongoose for database
- JWT for authentication
- bcryptjs for password hashing
- Zod for validation
- Multer for file uploads
- Winston for logging
- Nodemailer for emails


## Security

- JWT tokens for auth
- Passwords are hashed
- Rate limiting to prevent abuse
- Input validation on all requests
- File size limits
- CORS protection

## Logging

Logs are saved in the `logs/` folder:
- combined.log - Everything
- error.log - Just errors
- exceptions.log - Uncaught errors
- rejections.log - Promise rejections
