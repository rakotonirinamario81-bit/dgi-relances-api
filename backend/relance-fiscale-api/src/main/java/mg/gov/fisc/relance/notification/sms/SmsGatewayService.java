package mg.gov.fisc.relance.notification.sms;

/**
 * Abstraction du fournisseur SMS. L'implémentation concrète (ex. appel HTTP
 * à un agrégateur SMS local/international) est fournie par SmsSender ;
 * cette interface permet de changer de fournisseur sans toucher au reste
 * du système, et de mocker facilement les tests.
 */
public interface SmsGatewayService {

    /** @return true si l'envoi a réussi, false sinon (jamais d'exception ici : voir SmsSender). */
    ResultatEnvoiSms envoyer(String numeroTelephone, String message);

    record ResultatEnvoiSms(boolean succes, String messageErreur) {
        public static ResultatEnvoiSms ok() {
            return new ResultatEnvoiSms(true, null);
        }
        public static ResultatEnvoiSms echec(String motif) {
            return new ResultatEnvoiSms(false, motif);
        }
    }
}