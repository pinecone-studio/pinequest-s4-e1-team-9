FROM oven/bun:1.3.14

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .
RUN bun run build

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["bun", "run", "start"]
