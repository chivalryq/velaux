ARG BASE_IMAGE

FROM node:16-alpine as ui-builder
ARG VERSION
WORKDIR /app/velaux
ADD . .
ENV VERSION=${VERSION}
RUN apk add --no-cache git && yarn install && yarn build

# Build the manager binary
FROM --platform=${BUILDPLATFORM:-linux/amd64} golang:1.19-alpine@sha256:2381c1e5f8350a901597d633b2e517775eeac7a6682be39225a93b22cfd0f8bb as server-builder
ARG GOPROXY
ENV GOPROXY=${GOPROXY:-https://goproxy.cn}
WORKDIR /workspace
# Copy the Go Modules manifests
COPY go.mod go.mod
COPY go.sum go.sum
# cache deps before building and copying source so that we don't need to re-download as much
# and so that source changes don't invalidate our downloaded layer
RUN go mod download

# Copy the go source for building server
COPY cmd/server/ cmd/server/
COPY pkg/ pkg/

# Build
ARG TARGETARCH
ARG VERSION
ARG GITVERSION

RUN GO111MODULE=on CGO_ENABLED=0 GOOS=linux GOARCH=${TARGETARCH} \
    go build -a -ldflags "-s -w -X github.com/oam-dev/kubevela/version.VelaVersion=${VERSION:-undefined} -X github.com/oam-dev/kubevela/version.GitRevision=${GITVERSION:-undefined}" \
    -o apiserver-${TARGETARCH} cmd/server/main.go

FROM ${BASE_IMAGE:-alpine:3.15@sha256:cf34c62ee8eb3fe8aa24c1fab45d7e9d12768d945c3f5a6fd6a63d901e898479}
# This is required by daemon connecting with cri
RUN apk add --no-cache ca-certificates bash expat openssl-dev

WORKDIR /

ARG TARGETARCH
COPY --from=server-builder /workspace/apiserver-${TARGETARCH} /velaux/server
COPY --from=ui-builder /app/velaux/public /velaux/public
COPY entrypoint.sh /usr/local/bin/

ENTRYPOINT ["entrypoint.sh"]

CMD ["server"]