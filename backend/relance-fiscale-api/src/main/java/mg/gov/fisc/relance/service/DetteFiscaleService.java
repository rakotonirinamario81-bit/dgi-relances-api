package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.DetteFiscale;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface DetteFiscaleService {

    DetteFiscale creer(DetteFiscale detteFiscale);

    DetteFiscale obtenirParId(Long id);

    List<DetteFiscale> listerParContribuable(Long contribuableId);

    List<DetteFiscale> listerToutes();

    /**
     * Met à jour les champs modifiables d'une dette (impôt, période, montant, date d'échéance).
     * Le contribuable associé ne change jamais.
     */
    DetteFiscale modifier(Long id, Long impotId, String periodeFiscale, BigDecimal montantDu, LocalDate dateEcheance);

    /** Supprime une dette fiscale (uniquement si non engagée dans une procédure de recouvrement). */
    void supprimer(Long id);

    /** Réévalue statut + niveau de risque de toutes les dettes non soldées. Appelé par le scheduler. */
    List<DetteFiscale> recalculerToutesLesDettesActives();

    /** Enregistre un paiement (partiel ou total), met à jour le statut, journalise l'action. */
    DetteFiscale enregistrerPaiement(Long detteFiscaleId, BigDecimal montant, String modePaiement, String reference);

    /** Clôture manuelle d'un dossier (ex. décision administrative, créance irrécouvrable). */
    DetteFiscale cloturer(Long detteFiscaleId, String motif);
}