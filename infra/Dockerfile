FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
COPY build/ .
EXPOSE 8080
CMD ["serve", "-s", ".", "-l", "8080"]
