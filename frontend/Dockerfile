# Use an official Node runtime as the base image
FROM node:20-alpine AS build-stage

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies and ts-node
RUN npm install --verbose && \
    npm install --save-dev ts-node

# Copy project files and folders to the current working directory
COPY . .

# Build app for production with minification
RUN npm run build

# Use nginx as the production server
FROM nginx:alpine AS production-stage

# Copy the nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy the built app to nginx's serve folder
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]