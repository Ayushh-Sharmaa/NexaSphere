package org.nexasphere.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.nexasphere.model.TokenSession;
import org.nexasphere.service.AdminAuthService;
import org.nexasphere.service.LoginRateLimitService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {

    private final AdminAuthService adminAuthService;
    private final LoginRateLimitService rateLimitService;

    public AdminController(AdminAuthService adminAuthService, LoginRateLimitService rateLimitService) {
        this.adminAuthService = adminAuthService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        String clientIp = getClientIp(servletRequest);
        if (!rateLimitService.tryConsume(clientIp)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts. Please try again later.");
        }
        TokenSession session = adminAuthService.login(request.email().trim(), request.password());
        return new LoginResponse(session.token(), session.sessionInfo().email());
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    @PostMapping("/logout")
    public Map<String, Boolean> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            adminAuthService.logout(token);
        }
        return Collections.singletonMap("ok", true);
    }

    @GetMapping("/me")
    public Map<String, String> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return Collections.singletonMap("email", auth.getName());
    }

    @GetMapping("/ping")
    public Map<String, String> ping() {
        return Collections.singletonMap("status", "ok");
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {
    }

    public record LoginResponse(String token, String email) {
    }
}
