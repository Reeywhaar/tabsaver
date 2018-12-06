FROM node:10-alpine AS deps
COPY ./package.json ./package-lock.json /app/
RUN \
	cd /app && \
	npm ci --loglevel error


FROM node:10-alpine as base
RUN apk add --update --no-cache make


FROM base
COPY --from=deps /app /app
WORKDIR /app
ENTRYPOINT ["/bin/ash"]
