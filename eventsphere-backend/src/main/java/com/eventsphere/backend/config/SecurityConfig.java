// It's the central rulebook for how HTTP security behaves in your whole app. Two things it defines:

// passwordEncoder() bean — registers BCryptPasswordEncoder as the app-wide password hashing strategy. Anywhere you hash a password at registration or check one at login (e.g. in your UserService/AuthController), Spring injects this same bean, so hashing is consistent everywhere.

// securityFilterChain() bean — this is the actual security policy:

// csrf().disable() — turns off CSRF protection (appropriate here since this is a stateless JWT API, not a cookie/session-based server-rendered app).
// authorizeHttpRequests(...) — the access rules: /auth/** (login/register) is open to everyone; every other route requires an authenticated request.
// addFilterBefore(jwtAuthFilter, ...) — this is the line that actually plugs your JwtAuthFilter into Spring's filter chain, placing it before Spring's built-in username/password filter so JWT auth is checked first.

package com.eventsphere.backend.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.eventsphere.backend.security.JwtAuthFilter;
@EnableMethodSecurity
@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // Comma-separated list of allowed browser origins. Defaults to local dev, so
    // nothing changes locally; production sets CORS_ALLOWED_ORIGINS (Spring maps
    // that env var onto this property) to add the deployed frontend.
    // Without the deployed origin listed here the browser blocks every request,
    // and the frontend looks broken even though the backend is healthy.
    @Value("${cors.allowed-origins:http://localhost:*}")
    private String allowedOrigins;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // .trim() matters: "a,b" and "a, b" are both natural to type into a
        // dashboard env field, but an untrimmed " b" matches no origin at all
        // and fails silently as a CORS block.
        configuration.setAllowedOriginPatterns(
                Arrays.stream(allowedOrigins.split(","))
                        .map(String::trim)
                        .filter(origin -> !origin.isEmpty())
                        .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
    // CORS preflights are already short-circuited by CorsFilter before these
    // rules run, so this is belt-and-braces: it also covers a bare OPTIONS
    // request that omits Access-Control-Request-Method and therefore isn't
    // recognised as a preflight.
    .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
    .requestMatchers("/auth/**").permitAll()
    .requestMatchers(org.springframework.http.HttpMethod.GET, "/events/**").permitAll()
    .requestMatchers("/ws/**").permitAll()
    .requestMatchers("/error").permitAll()
    .anyRequest().authenticated()
)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}