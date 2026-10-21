package mg.gov.fisc.relance.utils;

public final class StringUtils {

    private StringUtils() {}

    public static String capitaliser(String texte) {
        if (texte == null || texte.isBlank()) return texte;
        return texte.substring(0, 1).toUpperCase() + texte.substring(1).toLowerCase();
    }

    /** Masque un numéro de téléphone pour affichage/log (ex. 034 12 345 67 -> 034 ** *** 67). */
    public static String masquerTelephone(String telephone) {
        if (telephone == null || telephone.length() < 6) return telephone;
        String debut = telephone.substring(0, 3);
        String fin = telephone.substring(telephone.length() - 2);
        return debut + " ****** " + fin;
    }

    public static String normaliserNif(String nif) {
        return nif == null ? null : nif.replaceAll("[^0-9A-Za-z]", "").toUpperCase();
    }

    public static boolean estVideOuNul(String texte) {
        return texte == null || texte.isBlank();
    }
}