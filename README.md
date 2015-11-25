## docker command
docker build -t senzhub/middleware.rabbitmq.type .
docker run -idt --name rabbitmq2type -p HOST_PORT:80 senzhub/middleware.rabbitmq.type


## project desccription
 - rabbitmq.type项目是订阅rabbitmq上的相应类型的channel。接受发送自log.rabbit的Log数据。并将这些Log数据进行渲染，存到senz.datasource.timeline指定数据库中。
 - ./daocloud.yml是daocloud部署时的脚本yaml
 - ./Dockerfile 是docker的dockerfile文件
 - ./server.js里面是一个forever脚本。用来监视项目文件的变化从而重启动服务来使服务生效
 - ./service_router是核心部分，里面分文件夹存储各个类型的数据的渲染（render）方法。具体介绍在./service_router/README.md
 
