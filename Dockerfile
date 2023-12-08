# Use an official Node.js image
FROM node:18.17.0

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml to the working directory
COPY package.json pnpm-lock.yaml /app/

# Enabling corepack & Install dependencies
RUN corepack enable
RUN pnpm install

# Copy src folder the rest of the application
COPY . /app

# Expose the port your app runs on
EXPOSE 3000

# Start the application in dev mode
CMD ["pnpm", "run", "start"]
