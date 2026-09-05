package org.nexasphere.event.handler;

import lombok.extern.slf4j.Slf4j;
import org.nexasphere.event.AdminEvent;
import org.nexasphere.event.AdminEventHandler;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ConsoleEventHandler implements AdminEventHandler {

    @Override
    public void handle(AdminEvent event) {
        log.info("Admin Event [{}] - User: {}, Action: {}, Time: {}",
                event.getEventId(),
                event.getAdminEmail(),
                event.getAction(),
                event.getTimestamp());
    }
}
