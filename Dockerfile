# Define node version for all stages
FROM node:10.15.1-alpine as node

FROM node as build

COPY . /
RUN apk add --update yarn
RUN yarn install

RUN mkdir -p dist/dsdl
RUN mv node_modules /dist
RUN mv src /dist/

FROM node

COPY --from=build  --chown=node:node  /dist /
WORKDIR dsdl

# No need to run as root!
USER node

ENTRYPOINT ["node", "/src/cli/dsdl.js"]