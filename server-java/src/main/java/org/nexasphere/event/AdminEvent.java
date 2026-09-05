package org.nexasphere.event;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
public abstract class AdminEvent {
    private String eventId;
    private String adminEmail;
    private LocalDateTime timestamp;
    private String action;
    private Map<String, Object> metadata;
}
