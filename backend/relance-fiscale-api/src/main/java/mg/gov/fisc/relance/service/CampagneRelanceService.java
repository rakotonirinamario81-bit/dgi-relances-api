package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.request.CampagneRelanceDTO;
import mg.gov.fisc.relance.dto.response.EstimationCiblageDTO;
import mg.gov.fisc.relance.entity.CampagneRelance;

import java.time.LocalDate;
import java.util.List;

public interface CampagneRelanceService {

    CampagneRelance creer(CampagneRelance campagne);

    CampagneRelance creerDepuisDto(CampagneRelanceDTO dto, Long createurId);

    /** Exécute immédiatement le ciblage + envoi pour une campagne (déclenchement manuel ou auto). */
    CampagneRelance lancer(Long campagneId);

    List<CampagneRelance> demarrerCampagnesEligibles(LocalDate aujourdHui);

    List<CampagneRelance> cloturerCampagnesExpirees(LocalDate aujourdHui);

    CampagneRelance obtenirParId(Long id);

    List<CampagneRelance> listerToutes();

    EstimationCiblageDTO estimerCiblage(Long impotId, String periode, Integer joursRetardMin, String niveauRisque);

    void initialiserCampagnesDemonstration(Long createurId);
}