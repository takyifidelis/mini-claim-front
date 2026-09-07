FROM nginx:alpine 

WORKDIR /app

COPY ./dist/claim-front-new/browser /usr/share/nginx/html

RUN echo "=== Nginx html directory contents ===" && \
    ls -la /usr/share/nginx/html && \
    echo "====================================="


COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN echo "=== Nginx config ===" && \
    cat /etc/nginx/conf.d/default.conf && \
    echo "==================="

EXPOSE 4200

# Start nginx
CMD ["nginx", "-g", "daemon off;"]