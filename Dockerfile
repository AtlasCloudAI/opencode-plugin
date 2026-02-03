FROM ubuntu:24.04

# Install Node.js and basic tools
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    jq \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Install OpenCode
RUN curl -fsSL https://opencode.ai/install | bash
ENV PATH="/root/.local/bin:$PATH"

# Set up working directory
WORKDIR /plugin

# Copy plugin source
COPY . .

# Build plugin only (no auto-setup - user will configure manually)
RUN npm install && npm run build

# Default to bash
CMD ["bash"]
