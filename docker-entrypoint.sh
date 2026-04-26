#!/bin/sh

# Start Node.js backend if server storage is enabled
if [ "$ENABLE_SERVER_STORAGE" = "true" ]; then
    echo "Starting NoxFlow backend server..."
    cd /app/packages/fossflow-backend
    npm install --production
    node server.js &
    echo "Backend server started"
else
    echo "Server storage disabled, backend not started"
fi

# Start collaboration server
if [ "$ENABLE_COLLAB" != "false" ]; then
    echo "Starting NoxFlow collaboration server..."
    cd /app/packages/noxflow-collab-server
    npm install --production
    npx tsx src/index.ts &
    echo "Collaboration server started on port ${COLLAB_PORT:-3002}"
else
    echo "Collaboration disabled, collab server not started"
fi

# Start nginx

# Configure HTTP Basic Auth
touch /etc/nginx/.htpasswd
if [ -n "$HTTP_AUTH_USER" ] && [ -n "$HTTP_AUTH_PASSWORD" ]; then
    echo "Setup HTTP Basic Auth..."
    echo "$HTTP_AUTH_USER:$(printf '%s' "$HTTP_AUTH_PASSWORD" | openssl passwd -bcrypt -stdin)" > /etc/nginx/.htpasswd
    sed -i 's/AUTH_BASIC_SETTING/"Restricted"/g' /etc/nginx/http.d/default.conf
else
    echo "No (optional) HTTP Basic Auth configured"
    sed -i 's/AUTH_BASIC_SETTING/off/g' /etc/nginx/http.d/default.conf
fi
echo "Starting nginx..."
nginx -g "daemon off;"