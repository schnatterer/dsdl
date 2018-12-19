# Define node version for all stages
FROM node:10.14.2-alpine as node

FROM node as build

ADD . /
RUN apk add --update yarn \
    && yarn install

FROM node

ADD src /dsdl
COPY --from=build /node_modules /node_modules

ENTRYPOINT ["node", "/dsdl/cli/dsdl.js"]