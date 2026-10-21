package mg.gov.fisc.relance.entity;

/**
 * Cycle de vie d'une dette fiscale.
 * Transitions attendues :
 * A_PAYER -> EN_RETARD -> EN_RELANCE -> EN_PROCEDURE_RECOUVREMENT -> CLOTURE
 * A_PAYER / EN_RETARD / EN_RELANCE -> PAYE -> CLOTURE (si paiement intégral)
 */
public enum StatutDette {
    A_PAYER,
    PAYE,
    EN_RETARD,
    EN_RELANCE,
    EN_PROCEDURE_RECOUVREMENT,
    CLOTURE
}