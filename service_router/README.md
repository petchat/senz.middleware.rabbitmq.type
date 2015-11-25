## service router的各个类型数据
 - 每次从rabbitmq订阅消息进行渲染和存储过程中会出现异常导致timeline里的数据结构存储失败。这时会将失败的从rabbitmq订阅来的消息缓存在node-cache中（当时为了方便，不同
   的Log类型的数据用不同的node-cache实例，所以就复制了多份node-cache文件夹，并改名为location-cache等。这部分需要优化）。
 - 未来架构将改为将消息缓存在redis中。然后定时从redis拿失败的object来请求底层服务。
      - 新架构注意问题：
         - 渲染过程封装为一个函数Func，在refinedLog的aftersavehook中先触发该函数，
         - 如果失败，则将失败object放到redis中，定时从refinedLog中拿出object。然后重新放到Func中走一遍。
 - 每个文件夹基本结构
      - init.js 
         - 功能1：注册指定的channel，生成queue，监听指定queue上的信息，如果有则将信息传到回调函数中。
         - 定时器：将node-cache中的失败的object定时拿出来再进行请求。
      - do_task.js  
         - location，motions和sounds的是拿相应的Log的objectId来请求leancloud来获取整个object。其他的直接就是拿的object进行操作
         - 检验一下这个id是否已经请求过多次，如果是，则丢弃，如果不是，则retries加1
         - 需要请求底层服务的，则会在这一部将请求进行封装然后发送到指定服务url
             - location的api doc在 trello API docs的parserhub上或者poiprob卡上
             - motion在 https://trello.com/c/g5R5GBdZ
             - sounds不用了目前。
         - 请求完服务后的，或者不请求的数据会进行一些解析和重封装，然后把数据发送到leancloud的timeline中指定的Class中。
            
      - config.json leancloud的appid，appkey和指定class等一些基本配置
      - lib/
         - ./http_wrapper.js service request和leancloud request的封装
         - ./lean_type.js leancloud的Class封装
     
 - ./rabbit_lib 是rabbitmq的subscriber的配置部分
 - ./data_trans 是predictedMotion和calendar类型数据的直接转移
 - ./locations 是转换为baidu坐标的经纬度信息的渲染部分，poiprob服务提供该经纬度是否在家或者公司附近，附近的poi列表，poitype的概率分布等信息。
 - ./motions 部分是转换ACC加速度传感器的数据变为用户motion状态信息。
 - ./service_post是将前端传来的ios或者android的applist转换为用户的属性信息或者爱好信息
 - ./sounds是声音部分。音频转为用户所处的场景信息。目前不用
 - ./utils 是部分工具
      - coordinate_trans.js是经纬度转换
      - logger.js是日志部分
      - url_generator包括各个子服务的url信息
 
     