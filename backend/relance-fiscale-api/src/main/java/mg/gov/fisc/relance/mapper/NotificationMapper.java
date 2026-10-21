package mg.gov.fisc.relance.mapper;

import mg.gov.fisc.relance.entity.Notification;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class NotificationMapper {

    public Map<String, Object> versDto(Notification n) {
        return Map.of(
                "id", n.getId(),
                "type", n.getType(),
                "contenu", n.getContenu(),
                "lue", n.isLue(),
                "dateCreation", n.getDateCreation()
        );
    }
}