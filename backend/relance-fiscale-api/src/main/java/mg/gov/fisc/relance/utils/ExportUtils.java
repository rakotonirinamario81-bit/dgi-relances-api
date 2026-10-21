package mg.gov.fisc.relance.utils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class ExportUtils {

    private ExportUtils() {}

    private static final DateTimeFormatter HORODATAGE = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    /** Nom de fichier d'export horodaté, ex. "dettes-fiscales-20260821-093000.xlsx". */
    public static String genererNomFichier(String prefixe, String extension) {
        String horodatage = LocalDateTime.now().format(HORODATAGE);
        return prefixe + "-" + horodatage + "." + extension;
    }

    public static String nettoyerPourNomFichier(String texte) {
        return texte == null ? "export" : texte.replaceAll("[^a-zA-Z0-9-_]", "-").toLowerCase();
    }
}