package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.dto.request.ImpotDTO;
import mg.gov.fisc.relance.entity.Impot;
import org.springframework.stereotype.Component;

@Component
public class ImpotMapper {

    public Impot versEntite(ImpotDTO dto) {
        Impot impot = new Impot();
        impot.setCode(dto.code());
        impot.setLibelle(dto.libelle());
        impot.setTaux(dto.taux());
        impot.setPeriodicite(Impot.Periodicite.valueOf(dto.periodicite()));
        return impot;
    }
}