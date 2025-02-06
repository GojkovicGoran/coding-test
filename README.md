# coding-test
API endpoint that collects products from the PIM system and inserts them in our Shopify store
## Configuration
Create a `.env` file in the root directory with 
Shopify Admin API access tokens for both stores:

SOURCE_STORE_NAME=
SOURCE_ACCESS_TOKEN=

RECEIVER_STORE_NAME=
RECEIVER_ACCESS_TOKEN=
SHOPIFY_API_VERSION=

LOG_LEVEL=debug
NODE_ENV=development
BATCH_SIZE=50
RATE_LIMIT_DELAY=500
MAX_FAILURES=10
PORT=3001
LOG_LEVEL=debug

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

- Product synchronization between Shopify stores
- RESTful API endpoints for sync operations
- Error handling and logging
- Built with Express.js and Axios

src/
  ├── clients/      # API clients
  ├── services/     # Business logic
  ├── routes/       # API routes
  └── app.js        # Application entry point
