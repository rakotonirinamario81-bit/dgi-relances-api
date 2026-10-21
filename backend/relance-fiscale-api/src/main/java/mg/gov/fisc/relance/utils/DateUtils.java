package mg.gov.fisc.relance.utils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public final class DateUtils {

    private DateUtils() {}

    public static final DateTimeFormatter FORMAT_DATE_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final DateTimeFormatter FORMAT_DATETIME_FR = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public static String formaterDate(LocalDate date) {
        return date != null ? date.format(FORMAT_DATE_FR) : "-";
    }

    public static String formaterDateHeure(LocalDateTime dateTime) {
        return dateTime != null ? dateTime.format(FORMAT_DATETIME_FR) : "-";
    }

    public static long joursEntre(LocalDate debut, LocalDate fin) {
        return ChronoUnit.DAYS.between(debut, fin);
    }

    public static boolean estDansLeFutur(LocalDate date) {
        return date != null && date.isAfter(LocalDate.now());
    }

    /** Première et dernière date du mois courant, utile pour les statistiques d'évolution mensuelle. */
    public static LocalDate premierJourDuMois(LocalDate date) {
        return date.withDayOfMonth(1);
    }

    public static LocalDate dernierJourDuMois(LocalDate date) {
        return date.withDayOfMonth(date.lengthOfMonth());
    }
}