# We build our DevContainer on MS' Typescript-Node Devcontainer
# This gives us lots of standard stuff, and lets us layer a few custom things on top, like the Emscripten compiler

# --------------------------------------------------------------------
# BEGIN Standard MS Devcontainer for Typescript-Node 

# See here for image contents: https://github.com/microsoft/vscode-dev-containers/tree/v0.155.1/containers/typescript-node/.devcontainer/base.Dockerfile
# [Choice] Node.js version: 14, 12, 10
ARG VARIANT="22-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:1-${VARIANT}

# [Optional] Uncomment if you want to install an additional version of node using nvm
# ARG EXTRA_NODE_VERSION=10
# RUN su node -c "source /usr/local/share/nvm/nvm.sh && nvm install ${EXTRA_NODE_VERSION}"

# [Optional] Uncomment if you want to install more global node packages
# RUN su node -c "npm install -g <your-package-list -here>"

# END Standard MS Devcontainer for Typescript-Node 
# --------------------------------------------------------------------

# --------------------------------------------------------------------
# BEGIN EMSDK 
# Install EMSDK to /emsdk just like the EMSDK Dockerfile: https://github.com/emscripten-core/emsdk/blob/master/docker/Dockerfile
ENV EMSDK /emsdk
# We pin the EMSDK version rather than 'latest' so that everyone is using the same compiler version
ENV EMSCRIPTEN_VERSION 4.0.5

RUN git clone https://github.com/emscripten-core/emsdk.git $EMSDK

RUN echo "## Install Emscripten" \
    && cd ${EMSDK} \
    && ./emsdk install ${EMSCRIPTEN_VERSION} \
    && echo "## Done"

# Copied directly from https://github.com/emscripten-core/emsdk/blob/master/docker/Dockerfile
RUN cd ${EMSDK} \
    && echo "## Generate standard configuration" \
    && ./emsdk activate ${EMSCRIPTEN_VERSION} \
    && chmod 777 ${EMSDK}/upstream/emscripten \
    && chmod -R 777 ${EMSDK}/upstream/emscripten/cache \
    && echo "int main() { return 0; }" > hello.c \
    && ${EMSDK}/upstream/emscripten/emcc -c hello.c \
    && cat ${EMSDK}/upstream/emscripten/cache/sanity.txt \
    && echo "## Done"

ENV PATH $EMSDK:$EMSDK/upstream/emscripten/:$PATH

# Cleanup Emscripten installation and strip some symbols
# Copied directly from https://github.com/emscripten-core/emsdk/blob/master/docker/Dockerfile
RUN echo "## Aggressive optimization: Remove debug symbols" \
    && cd ${EMSDK} && . ./emsdk_env.sh \
    # Remove debugging symbols from embedded node (extra 7MB)
    && strip -s `which node` \
    # Tests consume ~80MB disc space
    && rm -fr ${EMSDK}/upstream/emscripten/tests \
    # Fastcomp is not supported
    && rm -fr ${EMSDK}/upstream/fastcomp \
    # strip out symbols from clang (~extra 50MB disc space)
    && find ${EMSDK}/upstream/bin -type f -exec strip -s {} + || true \
    && echo "## Done"

RUN echo ". /emsdk/emsdk_env.sh" >> /etc/bash.bashrc
# We must set the EM_NODE_JS environment variable for a somewhat silly reason
# We run our build scripts with `npm run`, which sets the NODE environment variable as it runs.
# The EMSDK picks up on that environment variable and gives a deprecation warning: warning: honoring legacy environment variable `NODE`.  Please switch to using `EM_NODE_JS` instead`
# So, we are going to put this environment variable here explicitly to avoid the deprecation warning.
RUN echo 'export EM_NODE_JS="$EMSDK_NODE"' >> /etc/bash.bashrc

# END EMSDK
# --------------------------------------------------------------------

# Install wget, gnupg, and sha3sum
RUN apt-get update \
    && apt-get install -y wget gnupg libdigest-sha3-perl \
    && rm -rf /var/lib/apt/lists/*