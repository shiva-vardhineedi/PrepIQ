# Step 1: Build React app with environment variable
FROM node:18 AS build

# Define the build argument
ARG REACT_APP_API_URL

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# Inject the env variable into the build
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Install dependencies and build the app
RUN npm install
RUN npm run build

# Step 2: Serve with nginx
FROM nginx:alpine

# Copy the build from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Optional: use a custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
