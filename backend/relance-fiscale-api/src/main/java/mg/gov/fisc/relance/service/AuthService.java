package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.request.LoginRequestDTO;
import mg.gov.fisc.relance.dto.response.JwtResponseDTO;

public interface AuthService {
    JwtResponseDTO authentifier(LoginRequestDTO requete, String adresseIp);
}