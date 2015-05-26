FROM richarvey/nginx-nodejs

RUN rm -rf /usr/share/nginx/html/*
ADD . /usr/share/nginx/html/
RUN chmod 777 -R /usr/share/nginx/html/
WORKDIR /usr/share/nginx/html/


RUN npm install -g forever

RUN npm install

CMD ["/usr/local/bin/supervisord","-n"]




