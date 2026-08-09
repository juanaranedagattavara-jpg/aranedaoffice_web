FROM nginx:alpine

# Config con URLs limpias (sin extension .html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia el sitio estático al directorio que sirve nginx
COPY . /usr/share/nginx/html

# nginx escucha en el puerto 80 por defecto
EXPOSE 80
