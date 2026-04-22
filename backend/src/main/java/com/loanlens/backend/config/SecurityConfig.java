// ============================================================
// FILE 8 OF 8 — Item 5: JWT Auth
// LOCATION: /Users/parth/IdeaProjects/LoanLens/backend/src/main/java/com/loanlens/backend/config/SecurityConfig.java
// ACTION: REPLACE existing file
// CHANGES:
//   1. Added PasswordEncoder bean (BCrypt)
//   2. Added JwtFilter into the filter chain
//   3. /api/auth/** is public, all other routes require authentication
//   4. Stateless session (JWT — no cookies/sessions)
// ============================================================

package com.loanlens.backend.config;

import com.loanlens.backend.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()       // login + register are public
                .requestMatchers("/actuator/**").permitAll()       // health check is public
                .anyRequest().authenticated()                      // everything else needs JWT
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}