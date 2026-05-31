#!/bin/bash

echo "Killing old processes on ports 3000 and 5173..."
lsof -i :3000 -t | xargs -r kill -9 2>/dev/null || true
lsof -i :5173 -t | xargs -r kill -9 2>/dev/null || true

echo "Clearing Vite dependency cache..."
rm -rf apps/frontend/node_modules/.vite 2>/dev/null || true

echo "Starting backend server..."
cd apps/backend
pnpm run dev &
cd ../..

echo "Starting frontend server (with --force clean)..."
cd apps/frontend
pnpm run dev -- --force &
cd ../..

echo "Servers are starting in the background!"
