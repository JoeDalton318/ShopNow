FROM node:18

WORKDIR /app

# Copie le package.json + lock pour installer les dépendances
COPY package*.json ./

RUN npm install

# Copie tout le reste du projet
COPY . .

EXPOSE 3000
# Lance le serveur React
CMD ["npm", "start"]

