package org.nexasphere.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class AdminEventPublisher {

    private final List<AdminEventHandler> handlers;

    public AdminEventPublisher(List<AdminEventHandler> handlers) {
        this.handlers = handlers;
    }

    public void publish(AdminEvent event) {
        log.debug("Publishing admin event: {}", event.getAction());
        for (AdminEventHandler handler : handlers) {
            try {
                handler.handle(event);
            } catch (Exception e) {
                log.error("Error handling admin event in handler {}: {}", handler.getClass().getSimpleName(), e.getMessage());
            }
        }
    }
}
