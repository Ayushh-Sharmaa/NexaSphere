package org.nexasphere.service;

import org.nexasphere.event.AdminLoginEvent;
import org.nexasphere.event.AdminLogoutEvent;
import org.nexasphere.event.AdminEventPublisher;
import org.nexasphere.model.SessionInfo;
import org.nexasphere.model.TokenSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AdminAuthService {

    @Value("${ADMIN_EMAIL:nexasphere@glbajajgroup.org}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD:Admin@123}")
    private String adminPassword;

    private final TokenService tokenService;
    private final AdminEventPublisher publisher;

    public AdminAuthService(TokenService tokenService, AdminEventPublisher publisher) {
        this.tokenService = tokenService;
        this.publisher = publisher;
    }

    public boolean isValidCredentials(String email, String password) {
        return adminEmail.equals(email) && adminPassword.equals(password);
    }

    public TokenSession login(String email, String password) {
        if (!isValidCredentials(email, password)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        TokenSession session = tokenService.createSession(email);

        AdminLoginEvent event = new AdminLoginEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setAdminEmail(email);
        event.setAction("LOGIN");
        event.setTimestamp(LocalDateTime.now());
        publisher.publish(event);

        return session;
    }

    public void logout(String token) {
        Optional<SessionInfo> sessionOpt = tokenService.validate(token);
        if (sessionOpt.isPresent()) {
            SessionInfo info = sessionOpt.get();
            tokenService.revoke(token);

            AdminLogoutEvent event = new AdminLogoutEvent();
            event.setEventId(UUID.randomUUID().toString());
            event.setAdminEmail(info.email());
            event.setAction("LOGOUT");
            event.setTimestamp(LocalDateTime.now());
            publisher.publish(event);
        }
    }
}
