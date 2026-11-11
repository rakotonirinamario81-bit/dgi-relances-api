package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.request.CampagneRelanceDTO;
import mg.gov.fisc.relance.dto.response.CampagneResponseDTO;
import mg.gov.fisc.relance.entity.*;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Component;

@Component
public class CampagneRelanceMapper {

    public CampagneRelance versEntite(CampagneRelanceDTO dto, Impot impotCible, ModeleMessage modele, Utilisateur createur) {
        CampagneRelance campagne = new CampagneRelance();
        campagne.setNom(dto.nom());
        campagne.setDescription(dto.description());
        campagne.setImpotCible(impotCible);
        campagne.setPeriodeFiscaleCible(dto.periodeFiscaleCible());
        campagne.setJoursRetardMin(dto.joursRetardMin());
        campagne.setNiveauRisqueCible(dto.niveauRisqueCible() != null && !dto.niveauRisqueCible().isBlank()
                ? NiveauRisque.valueOf(dto.niveauRisqueCible()) : null);
        campagne.setModeleMessage(modele);
        campagne.setDateDebut(dto.dateDebut());
        campagne.setDateFin(dto.dateFin());
        campagne.setCreateur(createur);
        return campagne;
    }

    public CampagneResponseDTO versDto(CampagneRelance c) {
        if (c == null) {
            return null;
        }

        Long impotId = null;
        String impotCode = null;
        String impotLibelle = null;
        try {
            if (c.getImpotCible() != null) {
                impotId = c.getImpotCible().getId();
                impotCode = c.getImpotCible().getCode();
                impotLibelle = c.getImpotCible().getLibelle();
            }
        } catch (Exception ignored) {}

        Long modeleId = null;
        String modeleNom = null;
        String canal = null;
        try {
            if (c.getModeleMessage() != null) {
                modeleId = c.getModeleMessage().getId();
                modeleNom = c.getModeleMessage().getNom();
                if (c.getModeleMessage().getCanal() != null) {
                    canal = c.getModeleMessage().getCanal().name();
                }
            }
        } catch (Exception ignored) {}

        String createurNom = null;
        try {
            if (c.getCreateur() != null) {
                createurNom = c.getCreateur().getNom();
            }
        } catch (Exception ignored) {}

        long envoyees = 0L;
        long echecs = 0L;
        long total = 0L;
        try {
            if (c.getRelances() != null && Hibernate.isInitialized(c.getRelances())) {
                envoyees = c.getRelances().stream().filter(r -> r.getStatutEnvoi() == Relance.StatutEnvoi.ENVOYE).count();
                echecs = c.getRelances().stream().filter(r -> r.getStatutEnvoi() == Relance.StatutEnvoi.ECHEC).count();
                total = c.getRelances().size();
            }
        } catch (Exception ignored) {}
        double taux = total > 0 ? (envoyees * 100.0) / total : 0.0;

        return new CampagneResponseDTO(
                c.getId(),
                c.getNom(),
                c.getDescription(),
                impotId,
                impotCode,
                impotLibelle,
                c.getPeriodeFiscaleCible(),
                c.getJoursRetardMin(),
                c.getNiveauRisqueCible() != null ? c.getNiveauRisqueCible().name() : null,
                modeleId,
                modeleNom,
                canal,
                c.getDateDebut(),
                c.getDateFin(),
                c.getStatut() != null ? c.getStatut().name() : null,
                createurNom,
                c.getDateCreation(),
                envoyees,
                echecs,
                total,
                Math.round(taux * 10.0) / 10.0
        );
    }
}
