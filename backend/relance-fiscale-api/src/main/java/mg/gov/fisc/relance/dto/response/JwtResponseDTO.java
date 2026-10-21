package mg.gov.fisc.relance.dto.response;

import java.util.List;

public record JwtResponseDTO(
        String token,
        String type,
        Long id,
        String email,
        String nomComplet,
        List<String> roles
) {
    public JwtResponseDTO(String token, Long id, String email, String nomComplet, List<String> roles) {
        this(token, "Bearer", id, email, nomComplet, roles);
    }
}