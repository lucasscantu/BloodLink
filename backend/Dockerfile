FROM node:20-alpine

# node:20-alpine não vem com OpenSSL instalado. Sem isso, o engine do Prisma
# não consegue detectar a versão da libssl (o aviso "Prisma failed to detect
# the libssl/openssl version" que aparece nos logs) e cai para um binário
# incompatível, o que quebra as queries em tempo de execução. Instalar aqui,
# ANTES do `npx prisma generate`, resolve na raiz — tanto no build quanto no
# runtime, já que é a mesma imagem.
RUN apk add --no-cache openssl

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

RUN chmod +x docker-entrypoint.sh

EXPOSE 3333
ENTRYPOINT ["./docker-entrypoint.sh"]
