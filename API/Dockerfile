# Use AWS Lambda Node.js 20 base image
FROM public.ecr.aws/lambda/nodejs:20

# Run in production mode
ENV NODE_ENV=production

# Lambda task root
WORKDIR ${LAMBDA_TASK_ROOT}

# Install only production deps first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the rest of the backend source
COPY . .

# Default handler: lambda.js exports handler()
CMD ["lambda.handler"]
