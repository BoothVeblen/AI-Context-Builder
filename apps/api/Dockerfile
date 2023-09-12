FROM 326596634873.dkr.ecr.us-east-2.amazonaws.com/withcontext-backend:base 

WORKDIR /app
COPY . /app

EXPOSE 8000

CMD ["gunicorn", "-w", "8", "-k", "uvicorn.workers.UvicornWorker", "app:app", "--bind", "0.0.0.0:8000"]
