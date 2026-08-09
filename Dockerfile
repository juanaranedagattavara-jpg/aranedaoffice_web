FROM nginx:alpine

# Copia el sitio estático al directorio que sirve nginx
COPY . /usr/share/nginx/html

# nginx escucha en el puerto 80 por defecto
EXPOSE 80
