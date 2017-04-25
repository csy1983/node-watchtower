FROM alpine:3.5

LABEL com.docker.compose.service-config="{\"image\":\"csy-mbp:5000/alpine\",\"container_name\":\"private-alpine-for-test\",\"restart\":\"unless-stopped\",\"privileged\":true,\"network_mode\": \"host\",\"command\": \"ping www.yahoo.com\",\"volumes\":[\"/tmp:/tmp\"]}"
