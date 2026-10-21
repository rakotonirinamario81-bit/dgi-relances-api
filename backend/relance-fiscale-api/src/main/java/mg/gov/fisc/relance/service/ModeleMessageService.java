package mg.gov.fisc.relance.service;

import mg.gov.fisc.relance.entity.CanalNotification;
import mg.gov.fisc.relance.entity.ModeleMessage;

import java.util.List;

public interface ModeleMessageService {
    ModeleMessage creer(ModeleMessage modele);
    List<ModeleMessage> listerParCanal(CanalNotification canal);
}