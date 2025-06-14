# Use official Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Install necessary packages (git, curl, unzip, watchman for file watching)
RUN apt-get update && \
    apt-get install -y git curl unzip watchman && \
    rm -rf /var/lib/apt/lists/*

# Install Expo CLI globally
RUN npm install -g expo-cli

# Copy package files first (for better cache layer)
COPY package*.json ./

# Install node dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose ports required by Expo
EXPOSE 8081 19000 19001 19002

# Set environment variable for external access
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Start the Expo development server
CMD ["npm", "run", "start"]
