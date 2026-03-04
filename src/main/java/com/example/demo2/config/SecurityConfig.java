package com.example.demo2.config;

import com.example.demo2.security.CustomOAuth2UserService;
import com.example.demo2.security.JwtAuthenticationFilter;
import com.example.demo2.security.JwtTokenProvider;
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

        private final JwtAuthenticationFilter jwtAuthenticationFilter;
        private final CustomOAuth2UserService customOAuth2UserService;
        private final JwtTokenProvider jwtTokenProvider;

        public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter,
                        CustomOAuth2UserService customOAuth2UserService,
                        JwtTokenProvider jwtTokenProvider) {
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
                this.customOAuth2UserService = customOAuth2UserService;
                this.jwtTokenProvider = jwtTokenProvider;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .dispatcherTypeMatchers(jakarta.servlet.DispatcherType.FORWARD,
                                                                jakarta.servlet.DispatcherType.ERROR)
                                                .permitAll()
                                                .requestMatchers(
                                                                "/",
                                                                "/login",
                                                                "/login2",
                                                                "/init-data",
                                                                "/auth/login",
                                                                "/auth/logout",
                                                                "/auth/me",
                                                                "/oauth2/**",
                                                                "/login/oauth2/code/instagram",
                                                                "/style.css",
                                                                "/script.js",
                                                                "/static/**",
                                                                "/v3/api-docs/**",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html",
                                                                "/api/**")
                                                .permitAll()
                                                .anyRequest().authenticated())
                                .oauth2Login(oauth -> oauth
                                                .loginPage("/login2")
                                                .userInfoEndpoint(userInfo -> userInfo
                                                                .userService(customOAuth2UserService))
                                                .successHandler((request, response, authentication) -> {
                                                        String username = authentication.getName();
                                                        String token = jwtTokenProvider.createToken(username);

                                                        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie(
                                                                        "token", token);
                                                        cookie.setHttpOnly(true);
                                                        cookie.setSecure(false);
                                                        cookie.setPath("/");
                                                        cookie.setMaxAge(3600);
                                                        response.addCookie(cookie);

                                                        response.sendRedirect("/login2");
                                                }))
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }
}
