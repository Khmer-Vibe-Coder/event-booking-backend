
# backend
FROM node:20.18.3

WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install dependencies in container
RUN npm install

RUN npm install -g nodemon

# Now copy the rest of the code
COPY . .

EXPOSE 4000

CMD ["npm","start"]
