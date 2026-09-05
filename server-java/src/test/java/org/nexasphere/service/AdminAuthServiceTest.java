package org.nexasphere.service;

import org.junit.jupiter.api.Test;
import org.nexasphere.model.TokenSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AdminAuthServiceTest {

    @Autowired
    private AdminAuthService adminAuthService;

    @Test
    void testLoginCorrectCredentials() {
        TokenSession session = adminAuthService.login("nexasphere@glbajajgroup.org", "Admin@123");
        assertNotNull(session.token());
        assertEquals(48, session.token().length());
        assertTrue(session.token().matches("^[0-9a-f]{48}$"));
    }

    @Test
    void testLoginWrongCredentials() {
        assertThrows(ResponseStatusException.class, () -> 
            adminAuthService.login("wrong@email.com", "wrongpass")
        );
    }
}
