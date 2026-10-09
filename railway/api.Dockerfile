FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 ALLPHA_BLENDER_BINARY=/usr/bin/blender
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends blender && rm -rf /var/lib/apt/lists/*
COPY apps/api/pyproject.toml ./apps/api/pyproject.toml
RUN pip install "fastapi==0.142.2" "uvicorn[standard]>=0.35,<1.0" "PyJWT[crypto]==2.10.1" "httpx==0.28.1"
COPY apps/api/app ./apps/api/app
COPY scripts/theme-rebuild/blender_process_glb.py ./scripts/theme-rebuild/blender_process_glb.py
WORKDIR /app/apps/api
EXPOSE 8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
