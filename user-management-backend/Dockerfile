# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package*.json ./

# Install production dependencies
# Using npm ci --only=production for cleaner installs if package-lock.json is present and up-to-date
# If you encounter issues with `npm ci`, you can fall back to `npm install --only=production`
RUN npm ci --only=production

# Bundle app source
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
# Make sure this matches the port your application listens on, defined by process.env.PORT or default in main.ts
EXPOSE 3000

# Define environment variable for the port (optional, can be overridden)
ENV PORT 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]
