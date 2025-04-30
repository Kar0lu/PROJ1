FROM python:3.10-slim AS builder
 
# Create the app directory
RUN mkdir /app
 
# Set the working directory inside the container
WORKDIR /app
 
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
RUN pip install --upgrade pip

# copy and install dependencies
COPY requirements.txt  /app/
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.10-slim

RUN apt-get update && \
    apt-get install -y curl ssh rsync && \
    rm -rf /var/lib/apt/lists/*

# add appuser
RUN useradd -m -r appuser && \
   mkdir /app && \
   chown -R appuser /app

COPY --from=builder /usr/local/lib/python3.10/site-packages/ /usr/local/lib/python3.10/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

WORKDIR /app
 
# Copy the Django project to the container
COPY --chown=appuser:appuser . .

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

USER appuser

WORKDIR /app
 
# Expose the Django port
EXPOSE 8080
 
# Run Django’s development server
CMD ["waitress-serve", "--call", "server:create_app"]