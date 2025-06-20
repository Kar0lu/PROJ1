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
 
# Copy app
COPY --chown=appuser:appuser . .

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

USER appuser

# Fix for Windows
RUN chmod +x /app/init_db.py && \
    find /app -type f -name "init_db.py" -exec sed -i 's/\r$//' {} +

WORKDIR /app
 
# Expose port for server
EXPOSE 8080
 
# Run the server
CMD ["gunicorn", "server:app", "--workers", "4", "--bind", "0.0.0.0:8080", "--access-logfile", "'-'", "--error-logfile", "'-'"]