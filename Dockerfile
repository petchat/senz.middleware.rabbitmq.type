FROM richarvey/nginx-nodejs

RUN rm -rf /usr/share/nginx/html/*
ADD . /user/share/nginx/html/

WORKDIR /user/share/nginx/html/
RUN bash install.sh





