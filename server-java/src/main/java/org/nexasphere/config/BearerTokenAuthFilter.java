package org.nexasphere.config;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.nexasphere.model.SessionInfo;
import org.nexasphere.service.TokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class BearerTokenAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(BearerTokenAuthFilter.class);

    private final TokenService tokenService;

    public BearerTokenAuthFilter(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        tokenService.cleanupExpired();

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = extractBearerToken(header);

        if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            tokenService.validate(token).ifPresentOrElse(sessionInfo -> {
                Authentication auth = toAuthentication(sessionInfo);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }, () -> log.debug("Invalid/expired token for path {}", request.getRequestURI()));
        }

        filterChain.doFilter(request, response);
    }

    private static String extractBearerToken(String header) {
        if (header == null) {
            return null;
        }
        String prefix = "Bearer ";
        if (!header.startsWith(prefix)) {
            return null;
        }
        String token = header.substring(prefix.length()).trim();
        return token.isBlank() ? null : token;
    }

    private static Authentication toAuthentication(SessionInfo info) {
        return new UsernamePasswordAuthenticationToken(
                info.email(),
                null,
                java.util.List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }
}
