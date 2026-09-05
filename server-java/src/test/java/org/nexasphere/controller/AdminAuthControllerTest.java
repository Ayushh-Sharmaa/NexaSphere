package org.nexasphere.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testLoginFlow() throws Exception {
        // POST /login correct creds -> 200 + token in body
        String loginJson = "{\"email\": \"nexasphere@glbajajgroup.org\", \"password\": \"Admin@123\"}";
        String response = mockMvc.perform(post("/api/admin/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value("nexasphere@glbajajgroup.org"))
                .andReturn().getResponse().getContentAsString();

        // Extract token manually to avoid JsonPath dependency if not present, though it usually is
        String token = response.split("\"token\":\"")[1].split("\"")[0];

        // GET /me valid token -> 200 + email
        mockMvc.perform(get("/api/admin/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("nexasphere@glbajajgroup.org"));

        // POST /logout valid token -> 200 + { "ok": true }
        mockMvc.perform(post("/api/admin/logout")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));

        // GET /me after logout -> 401
        mockMvc.perform(get("/api/admin/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testLoginWrongCreds() throws Exception {
        String loginJson = "{\"email\": \"wrong@email.com\", \"password\": \"wrongpass\"}";
        mockMvc.perform(post("/api/admin/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testMeNoToken() throws Exception {
        mockMvc.perform(get("/api/admin/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testLoginRateLimiting() throws Exception {
        String loginJson = "{\"email\": \"nexasphere@glbajajgroup.org\", \"password\": \"wrongpass\"}";
        
        // First 10 attempts should be allowed (burst capacity)
        for (int i = 0; i < 10; i++) {
            mockMvc.perform(post("/api/admin/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(loginJson)
                    .with(request -> {
                        request.setRemoteAddr("192.168.1.1"); // Set a fixed IP for testing
                        return request;
                    }))
                    .andExpect(status().isUnauthorized());
        }

        // 11th attempt should be throttled
        mockMvc.perform(post("/api/admin/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson)
                .with(request -> {
                    request.setRemoteAddr("192.168.1.1");
                    return request;
                }))
                .andExpect(status().isTooManyRequests());
    }
}
