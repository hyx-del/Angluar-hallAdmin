# compile
FROM registry.cn-beijing.aliyuncs.com/jiayu-tech/module:admin AS builder
LABEL stage="build"
COPY . /apps
RUN cd /apps \
 && tar zxf /node_modules.tar.gz -C ./ \
 && npm config set registry https://registry.npm.taobao.org \
 && npm config set sass-binary-site http://npm.taobao.org/mirrors/node-sass \
 && npm install \
 && node --max_old_space_size=4096 node_modules/.bin/ng build --prod --build-optimizer=false \
 && tar zxf /uieditor.tar.gz -C ./dist/assets

# build-image
FROM yilutech/nginx
COPY --from=builder /apps/dist /apps/
