# senz-log-hook
# lots of modules

#docker command
docker build -t senzhub/middleware.rabbitmq.type .
docker run -idt --name rabbitmq2type -p HOST_PORT:80 senzhub/middleware.rabbitmq.type
