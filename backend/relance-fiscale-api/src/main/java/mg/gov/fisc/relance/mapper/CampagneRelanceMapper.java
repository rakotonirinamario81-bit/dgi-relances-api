package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.request.CampagneRelanceDTO;
import mg.gov.fisc.relance.dto.response.CampagneResponseDTO;
import mg.gov.fisc.relance.entity.*;
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
        Long impotId = c.getImpotCible() != null ? c.getImpotCible().getId() : null;
        String impotCode = c.getImpotCible() != null ? c.getImpotCible().getCode() : null;
        String impotLibelle = c.getImpotCible() != null ? c.getImpotCible().getLibelle() : null;

        Long modeleId = c.getModeleMessage() != null ? c.getModeleMessage().getId() : null;
        String modeleNom = c.getModeleMessage() != null ? c.getModeleMessage().getNom() : null;
        String canal = (c.getModeleMessage() != null && c.getModeleMessage().getCanal() != null)
                ? c.getModeleMessage().getCanal().name() : null;

        String createurNom = c.getCreateur() != null ? c.getCreateur().getNom() : null;

        long envoyees = c.getRelances() != null
                ? c.getRelances().stream().filter(r -> r.getStatutEnvoi() == Relance.StatutEnvoi.ENVOYE).count()
                : 0L;
        long echecs = c.getRelances() != null
                ? c.getRelances().stream().filter(r -> r.getStatutEnvoi() == Relance.StatutEnvoi.ECHEC).count()
                : 0L;
        long total = c.getRelances() != null ? c.getRelances().size() : 0L;
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