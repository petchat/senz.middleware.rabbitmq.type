FROM google/nodejs-runtime
ADD install.sh /app
WORKDIR /app
RUN bash install.sh



