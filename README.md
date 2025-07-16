# Exercise Tracker API

A RESTful API to track users and their exercise logs. Built with Node.js, Express, MongoDB (via Mongoose), and includes security, rate-limiting, and logging middleware.

## Features

- Create a new user
- Add exercises for a user
- Get all users
- Get a user's exercise log with optional filtering (`from`, `to`, `limit`)
- Secure with Helmet and rate limiter
- Logs with Morgan