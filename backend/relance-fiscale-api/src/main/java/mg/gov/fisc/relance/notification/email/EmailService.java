package mg.gov.fisc.relance.notification.email;

public interface EmailService {
    ResultatEnvoiEmail envoyer(String destinataire, String objet, String contenuHtml, byte[] piecJointePdf, String nomPieceJointe);

    record ResultatEnvoiEmail(boolean succes, String messageErreur) {
        public static ResultatEnvoiEmail ok() {
            return new ResultatEnvoiEmail(true, null);
        }
        public static ResultatEnvoiEmail echec(String motif) {
            return new ResultatEnvoiEmail(false, motif);
        }
    }
}