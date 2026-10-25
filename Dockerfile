# --- Local ---
# Stage 1: Build
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm run build

# Stage 2: Run
FROM node:22-slim
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --ignore-scripts

# Configuramos el puerto y el host para Hugging Face
EXPOSE 8080
ENV PORT=8080

# Define the command to run the HTTP server for IBM Code Engine
CMD ["node", "dist/entrypoints/server-http.js"]

# --- Hugging Face --- 
# Stage 1: Build
# FROM node:22-slim AS builder
# WORKDIR /app
# COPY package.json pnpm-lock.yaml ./
# COPY tsconfig.json ./
# COPY src ./src
# RUN npm install -g pnpm
# RUN pnpm install
# RUN pnpm run build

# # Stage 2: Run
# FROM node:22-slim
# WORKDIR /app
# RUN npm install -g pnpm
# COPY --from=builder /app/dist ./dist
# COPY package.json pnpm-lock.yaml ./
# RUN pnpm install --prod --ignore-scripts

# # Configuramos el puerto y el host para Hugging Face
# EXPOSE 7860
# ENV PORT=7860

# # Comando de inicio corregido
# CMD ["node", "dist/entrypoints/server-http.js", "--port", "7860", "--host", "0.0.0.0"]