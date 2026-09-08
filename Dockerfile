FROM node:20-alpine AS deps
WORKDIR /src
COPY cse-grievance-server/package.json cse-grievance-server/package-lock.json* ./cse-grievance-server/
RUN cd cse-grievance-server && npm ci
COPY cse-grievance-client/package.json cse-grievance-client/package-lock.json* ./cse-grievance-client/
RUN cd cse-grievance-client && npm ci

FROM deps AS build
COPY cse-grievance-server/src ./cse-grievance-server/src
COPY cse-grievance-client/src ./cse-grievance-client/src
COPY cse-grievance-client/index.html cse-grievance-client/vite.config.* cse-grievance-client/tailwind.config.* cse-grievance-client/postcss.config.* ./cse-grievance-client/
RUN cd cse-grievance-client && npm run build

FROM node:20-alpine
WORKDIR /cse-grievance-server
COPY --from=deps /src/cse-grievance-server/node_modules ./node_modules
COPY --from=build /src/cse-grievance-server/src ./src
RUN mkdir -p uploads /cse-grievance-client/dist
COPY --from=build /src/cse-grievance-client/dist /cse-grievance-client/dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/server.js"]