Actúa como un asistente de código experto en Node.js y Docker. Tienes un proyecto que actualmente arrancaba el MCP Server por stdin/stdout con `StdioServerTransport` y un Dockerfile incompleto. Tu tarea es:

1. **Reescribir** el punto de entrada (`src/index.ts`) para:
   - Usar `HttpServerTransport` de la SDK de MCP.
   - Montar un servidor Express que exponga un endpoint SSE en `/events`.
   - Leer el puerto de la variable de entorno `PORT` (con `.env`).
   - Imprimir en consola `MCP SSE server listening at http://localhost:<PORT>/events`.

2. **Crear** un `Dockerfile` de dos etapas:
   - Etapa **builder** basada en `node:lts-alpine` que:
     - Establezca `WORKDIR /app`.
     - Copie `package.json`, lockfile y `tsconfig.json`.
     - Copie la carpeta `src/`.
     - Instale dependencias y compile (`npm run build`).
   - Etapa **final** basada en `node:lts-alpine` que:
     - Establezca `WORKDIR /app`.
     - Copie `dist/`, `package.json` y `.env`.
     - Instale solo dependencias de producción.
     - Exponga el puerto `${PORT}` (por defecto `3000`).
     - Use `CMD ["node", "dist/index.js"]`.

3. **Incluir** comentarios breves en el Dockerfile para cada sección.

4. **Al final**, añade un bloque de instrucciones de usuario:
   ```bash
   # Build
   docker build -t mcp-sse .

   # Run
   docker run -d --name=mcp-sse -p ${PORT}:$PORT mcp-sse

   # Expose with ngrok
   ngrok http $PORT
