FROM 326596634873.dkr.ecr.us-east-2.amazonaws.com/withcontext-backend:base 

WORKDIR /app
COPY . /app

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
