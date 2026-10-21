package mg.gov.fisc.relance.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import mg.gov.fisc.relance.dto.request.LoginRequestDTO;
import mg.gov.fisc.relance.dto.response.JwtResponseDTO;
import mg.gov.fisc.relance.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponseDTO> login(@Valid @RequestBody LoginRequestDTO requete,
                                                HttpServletRequest request) {
        JwtResponseDTO reponse = authService.authentifier(requete, request.getRemoteAddr());
        return ResponseEntity.ok(reponse);
    }
}