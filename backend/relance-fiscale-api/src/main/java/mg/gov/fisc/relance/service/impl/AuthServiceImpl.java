package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.request.LoginRequestDTO;
import mg.gov.fisc.relance.dto.response.JwtResponseDTO;
import mg.gov.fisc.relance.entity.JournalSysteme;
import mg.gov.fisc.relance.entity.Utilisateur;
import mg.gov.fisc.relance.repository.JournalSystemeRepository;
import mg.gov.fisc.relance.repository.UtilisateurRepository;
import mg.gov.fisc.relance.security.UserDetailsImpl;
import mg.gov.fisc.relance.security.jwt.JwtUtils;
import mg.gov.fisc.relance.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/** Authentification JWT (règle 11). Journalise chaque tentative, réussie ou non. */
@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UtilisateurRepository utilisateurRepository;
    private final JournalSystemeRepository journalSystemeRepository;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           JwtUtils jwtUtils,
                           UtilisateurRepository utilisateurRepository,
                           JournalSystemeRepository journalSystemeRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
        this.utilisateurRepository = utilisateurRepository;
        this.journalSystemeRepository = journalSystemeRepository;
    }

    @Override
    @Transactional
    public JwtResponseDTO authentifier(LoginRequestDTO requete, String adresseIp) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(requete.email(), requete.motDePasse()));

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            String token = jwtUtils.genererToken(userDetails);

            Utilisateur utilisateur = userDetails.getUtilisateur();
            utilisateur.setDerniereConnexion(LocalDateTime.now());
            utilisateurRepository.save(utilisateur);

            journaliserConnexion(JournalSysteme.Niveau.INFO,
                    "Connexion réussie : " + requete.email(), adresseIp);

            return new JwtResponseDTO(
                    token,
                    utilisateur.getId(),
                    utilisateur.getEmail(),
                    utilisateur.getNomComplet(),
                    userDetails.getAuthorities().stream().map(Object::toString).toList()
            );
        } catch (BadCredentialsException e) {
            journaliserConnexion(JournalSysteme.Niveau.WARN,
                    "Échec de connexion (identifiants invalides) : " + requete.email(), adresseIp);
            throw e;
        }
    }

    private void journaliserConnexion(JournalSysteme.Niveau niveau, String message, String adresseIp) {
        JournalSysteme journal = new JournalSysteme();
        journal.setNiveau(niveau);
        journal.setMessage(message);
        journal.setSource("AuthService.authentifier");
        journal.setAdresseIp(adresseIp);
        journalSystemeRepository.save(journal);
    }
}