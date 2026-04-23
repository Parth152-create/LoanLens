package com.loanlens.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.loanlens.backend.model.User;
import com.loanlens.backend.repository.UserRepository;
import com.loanlens.backend.security.JwtFilter;
import com.loanlens.backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = AuthController.class,
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = JwtFilter.class
    )
)
@AutoConfigureMockMvc(addFilters = false)  // 🔥 THIS FIXES YOUR ISSUE
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private JwtUtil jwtUtil;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = new User();
        existingUser.setUsername("admin");
        existingUser.setPassword("$2a$10$hashedpassword");
        existingUser.setRole("ROLE_ADMIN");
    }

    // ── LOGIN ─────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login — valid credentials returns token + roles")
    void login_validCredentials_returnsTokenAndRoles() throws Exception {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("admin123", existingUser.getPassword())).thenReturn(true);
        when(jwtUtil.generateToken("admin")).thenReturn("mock.jwt.token");

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "username", "admin",
                    "password", "admin123"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("mock.jwt.token"))
            .andExpect(jsonPath("$.username").value("admin"))
            .andExpect(jsonPath("$.roles[0]").value("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("POST /api/auth/login — wrong password returns 401")
    void login_wrongPassword_returns401() throws Exception {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("wrongpass", existingUser.getPassword())).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "username", "admin",
                    "password", "wrongpass"
                ))))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("POST /api/auth/login — unknown user returns 401")
    void login_unknownUser_returns401() throws Exception {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "username", "unknown",
                    "password", "anypass"
                ))))
            .andExpect(status().isUnauthorized());
    }

    // ── REGISTER ─────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/register — new user returns 201 with token")
    void register_newUser_returns201() throws Exception {
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("$2a$10$hashed");
        when(jwtUtil.generateToken("newuser")).thenReturn("new.jwt.token");
        when(userRepository.save(any(User.class))).thenReturn(new User());

        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "username", "newuser",
                    "password", "password123"
                ))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").value("new.jwt.token"))
            .andExpect(jsonPath("$.username").value("newuser"))
            .andExpect(jsonPath("$.roles[0]").value("ROLE_USER"));
    }

    @Test
    @DisplayName("POST /api/auth/register — duplicate username returns 409")
    void register_duplicateUsername_returns409() throws Exception {
        when(userRepository.existsByUsername("admin")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "username", "admin",
                    "password", "password123"
                ))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("POST /api/auth/register — blank username returns 400")
    void register_blankUsername_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "username", "",
                    "password", "password123"
                ))))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register — blank password returns 400")
    void register_blankPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of(
                    "username", "newuser",
                    "password", ""
                ))))
            .andExpect(status().isBadRequest());
    }
}