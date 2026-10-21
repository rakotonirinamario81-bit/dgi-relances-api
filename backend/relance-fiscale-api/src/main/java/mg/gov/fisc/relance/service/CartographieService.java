package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.dto.response.ContribuableLocaliteDTO;
import mg.gov.fisc.relance.dto.response.ZoneRisqueDTO;

import java.util.List;

public interface CartographieService {
    List<ZoneRisqueDTO> getZonesRisque();
    List<ContribuableLocaliteDTO> getContribuablesParCommune(String commune);
}
