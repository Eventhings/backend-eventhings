FROM node:lts-alpine

#ENV PNPM
ENV PNPM_HOME=/usr/local/pnpm-global
ENV PATH=$PNPM_HOME/bin:$PATH

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile
COPY . /app/
ENV PORT 8081

CMD ["pnpm", "run", "start"]
