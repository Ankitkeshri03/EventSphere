package com.eventsphere.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.eventsphere.backend.dto.LoginRequest;
import com.eventsphere.backend.dto.LoginResponse;
import com.eventsphere.backend.dto.RegisterRequest;
import com.eventsphere.backend.dto.UserResponse;
import com.eventsphere.backend.entity.Role;
import com.eventsphere.backend.entity.User;
import com.eventsphere.backend.service.JwtService;
import com.eventsphere.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        Role role = Role.valueOf(request.getRole().toUpperCase());

        User user = userService.registerUser(
                request.getName(),
                request.getEmail(),
                request.getPassword(),
                role
        );

        UserResponse response = new UserResponse(
                user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt()
        );

        return ResponseEntity.ok(response);
    }
        @PostMapping("/login")
        public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
            User user = userService.authenticate(request.getEmail(), request.getPassword());

            String token = jwtService.generateToken(user.getEmail(), user.getRole().name());

            LoginResponse response = new LoginResponse(token, user.getEmail(), user.getRole().name());

            return ResponseEntity.ok(response);
        }
}