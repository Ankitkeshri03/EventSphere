// Create a token (generateToken)
// Read data out of a token (extractEmail, extractClaim)
// Check if a token is legitimate (isTokenValid, isTokenExpired)
package com.eventsphere.backend.security;

import java.io.IOException;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.eventsphere.backend.service.JwtService;

import io.jsonwebtoken.JwtException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        // Every read below parses the token, and jjwt throws on an expired,
        // malformed or badly-signed one. Uncaught, that escaped the filter and
        // surfaced as a 500 -- so a routine session expiry looked to the client
        // like the server had broken. Catching it here leaves the request simply
        // unauthenticated and lets Spring Security reject it normally.
        try {
            String email = jwtService.extractEmail(token); //// who is this?

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.isTokenValid(token, email))  { //// is it genuine and not expired?

                    String role = jwtService.extractRole(token); // what's their role?
                    var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

                    var authToken = new UsernamePasswordAuthenticationToken(
                            email, null, authorities
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (JwtException | IllegalArgumentException ex) {
            // Debug, not error: an expired token is normal traffic, not a fault.
            // Logging it at ERROR filled the logs with stack traces every time a
            // stale browser tab polled.
            logger.debug("Ignoring unusable JWT: " + ex.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}