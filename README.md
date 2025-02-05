# coding-test
API endpoint that collects products from the PIM system and inserts them in our Shopify store
## Configuration
Create a `.env` file in the root directory with 
Shopify Admin API access tokens for both stores:

- SHOPIFY_STORE_NAME=???????
- SHOPIFY_ACCESS_TOKEN=???????
- SHOPIFY_API_VERSION=??????
- PORT=???????
- PIM_ACCESS_TOKEN=??????
- RECEIVER_ACCESS_TOKEN=???????
- RECEIVER_STORE_NAME=????????
- LOG_LEVEL=

## Prerequisites
- Node.js (v14 or higher)
- npm
- Shopify Admin API access tokens for both stores

## Installation
```bash
git clone
```bash
npm install
```bash
npm start (node src/app.js)
```bash
npm test

- Once the application is running, you can access at:
http://localhost:PORT/api/sync/products  

## Features
- Product synchronization between Shopify stores
- RESTful API endpoints for sync operations
- Error handling and logging
- Built with Express.js and Axios

## Project Structure
src/
  ├── clients/      # API clients
  ├── services/     # Business logic
  ├── routes/       # API routes
  └── app.js        # Application entry point
