package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.Paiement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface PaiementService {
    Paiement enregistrer(Long detteFiscaleId, BigDecimal montant, String modePaiement, String reference, Long agentId);
    Paiement enregistrer(Long detteFiscaleId, BigDecimal montant, String modePaiement, String reference, LocalDate datePaiement, Long agentId);
    Paiement obtenirParId(Long id);
    List<Paiement> listerParDette(Long detteFiscaleId);
    List<Paiement> listerTous();
    byte[] genererQuittancePdf(Long paiementId);
    void envoyerConfirmationPaiement(Long paiementId);
}
