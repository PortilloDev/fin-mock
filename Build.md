# Construir imágenes manualmente

Ejemplo backend dev:

´´´
docker build -t iportillo81/backend-dev:1.0 ./backend/dev
´´´
Frontend:
´´´
docker build -t iportillo81/frontend-dev:1.0 ./frontend/dev
´´´

# Subir imagen al registry

````
docker login
docker push iportillo81/backend-dev:1.0
docker push iportillo81/frontend-dev:1.0
````
