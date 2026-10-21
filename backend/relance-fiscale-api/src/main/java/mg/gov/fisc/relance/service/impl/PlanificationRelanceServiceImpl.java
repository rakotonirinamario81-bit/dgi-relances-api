package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.entity.*;
import mg.gov.fisc.relance.repository.ParametreRelanceRepository;
import mg.gov.fisc.relance.service.PlanificationRelanceService;
import mg.gov.fisc.relance.utils.ConstantesMetier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class PlanificationRelanceServiceImpl implements PlanificationRelanceService {

    private final ParametreRelanceRepository parametreRelanceRepository;

    public PlanificationRelanceServiceImpl(ParametreRelanceRepository parametreRelanceRepository) {
        this.parametreRelanceRepository = parametreRelanceRepository;
    }

    @Override
    public NiveauRelance determinerNiveauCible(DetteFiscale dette) {
        long joursDeRetard = dette.getJoursDeRetard();
        long joursAvantEcheance = dette.getJoursAvantEcheance();

        NiveauRelance niveauAtteint = null;
        for (NiveauRelance niveau : NiveauRelance.values()) {
            int seuil = obtenirSeuilConfigure(niveau);
            boolean seuilFranchi = (niveau == NiveauRelance.NIVEAU_0_PREVENTIF)
                    ? (joursAvantEcheance <= ConstantesMetier.JOURS_FENETRE_PREVENTIVE && joursAvantEcheance >= 0)
                    : joursDeRetard >= seuil;
            if (seuilFranchi) {
                niveauAtteint = niveau;
            }
        }
        return niveauAtteint;
    }

    @Override
    public CanalNotification determinerCanalPourNiveau(NiveauRelance niveau) {
        return switch (niveau) {
            case NIVEAU_0_PREVENTIF, NIVEAU_1_AMIABLE -> CanalNotification.SMS;
            case NIVEAU_2_INTERMEDIAIRE -> CanalNotification.SMS_ET_EMAIL;
            case NIVEAU_3_OFFICIEL, NIVEAU_4_FORCE -> CanalNotification.EMAIL;
        };
    }

    @Override
    public int obtenirSeuilConfigure(NiveauRelance niveau) {
        Optional<ParametreRelance> parametre = parametreRelanceRepository.findByNiveauRelance(niveau);
        return parametre.filter(ParametreRelance::isActif)
                .map(ParametreRelance::getSeuilJours)
                .orElse(niveau.getSeuilJoursParDefaut());
    }
}