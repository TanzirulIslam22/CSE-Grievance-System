# Build date: 2026-09-08T14:00 - regex fix
FROM node:20-alpine AS builder
ARG BUILD_ID=20260908-1400
WORKDIR /src
COPY cse-grievance-server ./cse-grievance-server
RUN grep -n "RUET_EMAIL_REGEX" cse-grievance-server/src/validators/auth.js
COPY cse-grievance-client ./cse-grievance-client
RUN cd cse-grievance-server && npm ci
RUN cd cse-grievance-client && npm ci && npm run build

FROM node:20-alpine
WORKDIR /cse-grievance-server
COPY --from=builder /src/cse-grievance-server/package.json ./
COPY --from=builder /src/cse-grievance-server/node_modules ./node_modules
COPY --from=builder /src/cse-grievance-server/src ./src
RUN mkdir -p uploads /cse-grievance-client/dist
COPY --from=builder /src/cse-grievance-client/dist /cse-grievance-client/dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/server.js"]