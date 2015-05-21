FROM richarvey/nginx-nodejs

RUN rm -rf /usr/share/nginx/html/*
ADD . /usr/share/nginx/html/

WORKDIR /usr/share/nginx/html/

npm install

CMD["/usr/local/bin/supervisord","-n"]




