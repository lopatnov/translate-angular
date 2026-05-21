FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
# Copy only server-side node_modules needed at runtime (grpc-js etc.)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 4000
ENV PORT=4000
ENV TRANSLATE_GRPC_URL=localhost:5100

CMD ["node", "dist/translate-angular/server/server.mjs"]
