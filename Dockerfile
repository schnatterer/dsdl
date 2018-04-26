FROM node:9.5.0-alpine

ADD src/pstd.js /
ADD node_modules /node_modules

ENTRYPOINT ["node", "/pstd.js"]