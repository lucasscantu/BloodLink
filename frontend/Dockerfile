# Etapa 1: build da aplicação React com Vite
FROM node:20-alpine AS build

# URL da API que o navegador do usuário vai chamar. Como o frontend roda no
# navegador (fora da rede interna do Docker), aponta para a porta do backend
# publicada no host — por padrão http://localhost:3333/api.
ARG VITE_API_URL=http://localhost:3333/api
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: imagem final, só com os arquivos estáticos servidos pelo Nginx
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
