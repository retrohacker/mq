FROM nodesource/node

ADD package.json package.json
RUN npm install
ADD . .

CMD ["node","examples/get.js"]
