# Use the official Node.js image as the base image
FROM node:20


RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  fonts-freefont-ttf \
  libglib2.0-0 \
  libnss3 \
  libgdk-pixbuf2.0-0 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libxss1 \
  libasound2 \
  libx11-xcb1 \
  x11-utils \
  xvfb \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Build the application
RUN npm run build

# Run Prisma generate to set up the database client
RUN npx prisma generate

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]
