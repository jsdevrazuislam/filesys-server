#!/bin/sh

# Exit on error
set -e

echo "Running prisma migrate deploy..."
npx prisma migrate deploy

echo "Starting the application..."
npm run start
