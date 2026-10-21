package mg.gov.fisc.relance.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import mg.gov.fisc.relance.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtUtils {

    private static final Logger log = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${relance.jwt.secret}")
    private String jwtSecret;

    @Value("${relance.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String genererToken(UserDetailsImpl userDetails) {
        List<String> roles = userDetails.getAuthorities().stream()
                .map(Object::toString)
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("userId", userDetails.getId())
                .claim("roles", roles)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String extraireEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public Long extraireUserId(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    public boolean estTokenValide(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("Token JWT expiré : {}", e.getMessage());
        } catch (MalformedJwtException | UnsupportedJwtException | SecurityException e) {
            log.warn("Token JWT invalide : {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("Token JWT vide ou nul : {}", e.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}