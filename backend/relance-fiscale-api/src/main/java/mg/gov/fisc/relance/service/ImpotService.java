package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.Impot;

import java.util.List;

public interface ImpotService {
    Impot creer(Impot impot);
    List<Impot> listerActifs();
}