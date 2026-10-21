package mg.gov.fisc.relance.service.impl;

import mg.gov.fisc.relance.dto.response.QuittanceVerificationResponseDTO;
import mg.gov.fisc.relance.dto.response.SituationFiscalePubliqueDTO;
import mg.gov.fisc.relance.entity.Contribuable;
import mg.gov.fisc.relance.entity.DetteFiscale;
import mg.gov.fisc.relance.entity.Paiement;
import mg.gov.fisc.relance.exception.ResourceNotFoundException;
import mg.gov.fisc.relance.report.pdf.PdfReportGenerator;
import mg.gov.fisc.relance.repository.ContribuableRepository;
import mg.gov.fisc.relance.repository.DetteFiscaleRepository;
import mg.gov.fisc.relance.repository.PaiementRepository;
import mg.gov.fisc.relance.service.PortailContribuableService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PortailContribuableServiceImpl implements PortailContribuableService {

    private static final DateTimeFormatter FORMAT_VERIF = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private final PaiementRepository paiementRepository;
    private final ContribuableRepository contribuableRepository;
    private final DetteFiscaleRepository detteFiscaleRepository;
    private final PdfReportGenerator pdfReportGenerator;

    public PortailContribuableServiceImpl(PaiementRepository paiementRepository,
                                          ContribuableRepository contribuableRepository,
                                          DetteFiscaleRepository detteFiscaleRepository,
                                          PdfReportGenerator pdfReportGenerator) {
        this.paiementRepository = paiementRepository;
        this.contribuableRepository = contribuableRepository;
        this.detteFiscaleRepository = detteFiscaleRepository;
        this.pdfReportGenerator = pdfReportGenerator;
    }

    @Override
    public QuittanceVerificationResponseDTO verifierQuittance(String referenceOuId) {
        if (referenceOuId == null || referenceOuId.isBlank()) {
            throw new ResourceNotFoundException("Référence de quittance requise.");
        }

        Long idPaiement = extraireIdDepuisReference(referenceOuId.trim());
        Paiement paiement = paiementRepository.findByIdWithRelations(idPaiement)
                .orElseThrow(() -> new ResourceNotFoundException("Aucune quittance officielle trouvée pour la référence : " + referenceOuId));

        DetteFiscale dette = paiement.getDetteFiscale();
        Contribuable c = dette != null ? dette.getContribuable() : null;

        String nifMasque = "-";
        String nomContribuable = "-";
        String commune = "-";
        if (c != null) {
            nomContribuable = c.getNomAffichage();
            commune = c.getCommune() != null ? c.getCommune() : "Madagascar";
            String nif = c.getNif();
            if (nif != null && nif.length() > 4) {
                nifMasque = nif.substring(0, nif.length() - 4) + "****";
            } else {
                nifMasque = nif != null ? nif : "-";
            }
        }

        return new QuittanceVerificationResponseDTO(
                paiement.getNumeroQuittance(),
                paiement.getDatePaiement(),
                nomContribuable,
                nifMasque,
                commune,
                (dette != null && dette.getImpot() != null) ? dette.getImpot().getLibelle() + " (" + dette.getImpot().getCode() + ")" : "-",
                dette != null ? dette.getPeriodeFiscale() : "-",
                paiement.getMontant(),
                paiement.getModePaiement(),
                paiement.getReference(),
                "CERTIFIÉ CONFORME - DIRECTION GÉNÉRALE DES IMPÔTS",
                true,
                LocalDateTime.now().format(FORMAT_VERIF)
        );
    }

    @Override
    public SituationFiscalePubliqueDTO consulterSituationFiscale(String nif) {
        if (nif == null || nif.isBlank()) {
            throw new ResourceNotFoundException("Le Numéro d'Identification Fiscale (NIF) est obligatoire.");
        }

        Contribuable c = contribuableRepository.findByNif(nif.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Aucun contribuable enregistré sous le NIF : " + nif));

        List<DetteFiscale> dettes = detteFiscaleRepository.findByContribuableId(c.getId());

        int dettesSoldees = 0;
        int dettesEnCours = 0;
        BigDecimal soldeGlobal = BigDecimal.ZERO;

        for (DetteFiscale d : dettes) {
            if (d.estSoldee()) {
                dettesSoldees++;
            } else {
                dettesEnCours++;
                soldeGlobal = soldeGlobal.add(d.getSoldeRestant());
            }
        }

        boolean enRegle = (soldeGlobal.compareTo(BigDecimal.ZERO) <= 0);
        String statut = enRegle ? "EN RÈGLE / QUITUS ACCORDÉ" : "CRÉANCES FISCALES EN INSTANCE DE RÈGLEMENT";
        String codeAttestation = "ATTEST-2026-" + String.format("%06d", Math.abs(c.getNif().hashCode() % 1000000));
        String mentions = "Attestation publique délivrée sous timbre officiel par la Direction Générale des Impôts de Madagascar.";

        return new SituationFiscalePubliqueDTO(
                c.getNif(),
                c.getNomAffichage(),
                c.getCommune() != null ? c.getCommune() : "Madagascar",
                enRegle,
                statut,
                dettesSoldees,
                dettesEnCours,
                soldeGlobal,
                LocalDate.now(),
                codeAttestation,
                mentions
        );
    }

    @Override
    public byte[] genererAttestationSituationPdf(String nif) {
        Contribuable c = contribuableRepository.findByNif(nif.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Contribuable introuvable pour le NIF : " + nif));

        SituationFiscalePubliqueDTO situation = consulterSituationFiscale(nif);
        return pdfReportGenerator.genererAttestationSituationFiscalePdf(c, situation);
    }

    private Long extraireIdDepuisReference(String ref) {
        try {
            // Si c'est juste un nombre: "3"
            return Long.parseLong(ref);
        } catch (NumberFormatException ignored) {
            // Si c'est un format "QUIT-2026-00003" ou "QUIT-2026-3"
            String nettoye = ref.replaceAll("[^0-9]", "");
            if (nettoye.startsWith("2026") && nettoye.length() > 4) {
                return Long.parseLong(nettoye.substring(4));
            } else if (!nettoye.isEmpty()) {
                return Long.parseLong(nettoye);
            }
            throw new ResourceNotFoundException("Format de référence quittance non reconnu : " + ref);
        }
    }
}
