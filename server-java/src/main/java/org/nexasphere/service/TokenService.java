package org.nexasphere.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.nexasphere.model.SessionInfo;
import org.nexasphere.model.TokenSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private static final Logger log = LoggerFactory.getLogger(TokenService.class);

    private static final Duration SESSION_TTL = Duration.ofHours(8);

    private final ConcurrentHashMap<String, SessionInfo> sessions = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public TokenSession createSession(String email) {
        Instant now = Instant.now();
        String token = generateToken();
        SessionInfo sessionInfo = new SessionInfo(token, email, now, now.plus(SESSION_TTL));
        sessions.put(token, sessionInfo);
        return new TokenSession(token, sessionInfo);
    }

    public Optional<SessionInfo> validate(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }

        Instant now = Instant.now();
        SessionInfo info = sessions.get(token);
        if (info == null) {
            return Optional.empty();
        }

        if (info.isExpired(now)) {
            sessions.remove(token);
            return Optional.empty();
        }

        return Optional.of(info);
    }

    public void revoke(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        sessions.remove(token);
    }

    @Scheduled(fixedRate = 30 * 60 * 1000) // 30 minutes
    public void scheduledCleanup() {
        int removed = cleanupExpired();
        if (removed > 0) {
            log.info("Scheduled cleanup removed {} expired sessions", removed);
        }
    }

    public int cleanupExpired() {
        Instant now = Instant.now();
        int before = sessions.size();
        sessions.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
        int removed = before - sessions.size();
        if (removed > 0) {
            log.debug("Removed {} expired sessions", removed);
        }
        return removed;
    }

    private String generateToken() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return toHex(bytes);
    }

    private static String toHex(byte[] bytes) {
        char[] hex = new char[bytes.length * 2];
        final char[] alphabet = "0123456789abcdef".toCharArray();
        for (int i = 0; i < bytes.length; i++) {
            int v = bytes[i] & 0xFF;
            hex[i * 2] = alphabet[v >>> 4];
            hex[i * 2 + 1] = alphabet[v & 0x0F];
        }
        return new String(hex);
    }
}
