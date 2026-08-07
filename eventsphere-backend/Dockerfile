# ---- Stage 1: Build ----
# Full JDK + Maven. Only needed to compile; none of this reaches the final image.
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# pom.xml is copied on its own, before src, so that Docker can cache the
# dependency download. Source changes then invalidate only the layers below
# this point, instead of re-downloading every dependency on each build.
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests

# ---- Stage 2: Run ----
# JRE only - no compiler, no Maven, no build cache. Everything above is
# discarded; only what is explicitly COPY --from=build survives.
FROM eclipse-temurin:17-jre

WORKDIR /app

# Run as a non-root user. If the app is ever compromised, the attacker lands
# as an unprivileged account rather than root inside the container.
RUN useradd --system --create-home --shell /usr/sbin/nologin spring
USER spring

# The single build artefact, renamed so the ENTRYPOINT below is version-agnostic.
COPY --from=build /app/target/*.jar app.jar

# Documentation only: it records the port for humans and tooling, and does not
# actually publish anything. Publishing still requires -p / compose `ports`.
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
