FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

ARG GITLEAKS_VERSION=8.30.1

USER root

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl ripgrep \
    && rm -rf /var/lib/apt/lists/*

# Install the repository's secret-scanning CLI from its signed release checksum
# manifest. Codespaces currently uses x64, with arm64 kept for portability.
RUN set -eux; \
    case "$(dpkg --print-architecture)" in \
        amd64) gitleaks_arch=x64 ;; \
        arm64) gitleaks_arch=arm64 ;; \
        *) echo "Unsupported architecture: $(dpkg --print-architecture)" >&2; exit 1 ;; \
    esac; \
    archive="gitleaks_${GITLEAKS_VERSION}_linux_${gitleaks_arch}.tar.gz"; \
    release_url="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}"; \
    curl --fail --location --silent --show-error --output "/tmp/${archive}" "${release_url}/${archive}"; \
    curl --fail --location --silent --show-error --output /tmp/gitleaks_checksums.txt "${release_url}/gitleaks_${GITLEAKS_VERSION}_checksums.txt"; \
    cd /tmp; grep "  ${archive}$" gitleaks_checksums.txt | sha256sum --check --strict --status; \
    tar --extract --gzip --file "/tmp/${archive}" --directory /usr/local/bin gitleaks; \
    chmod 0755 /usr/local/bin/gitleaks; \
    rm -f "/tmp/${archive}" /tmp/gitleaks_checksums.txt

USER vscode
