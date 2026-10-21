package mg.gov.fisc.relance.dto.response;

/**
 * Recommandation d'action générée par le moteur de scoring IA.
 */
public record RecommandationDTO(
        String priorite,    // "URGENTE" | "HAUTE" | "NORMALE"
        String action,
        String motif,
        String delaiSuggere
) {}
