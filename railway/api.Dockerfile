FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY apps/api/pyproject.toml ./apps/api/pyproject.toml
RUN pip install "fastapi==0.142.2" "uvicorn[standard]>=0.35,<1.0" "PyJWT[crypto]==2.10.1" "httpx==0.28.1"
COPY apps/api/app ./apps/api/app
WORKDIR /app/apps/api
EXPOSE 8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
