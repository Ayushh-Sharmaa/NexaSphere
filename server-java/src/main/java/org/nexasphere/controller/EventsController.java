package org.nexasphere.controller;

import jakarta.validation.Valid;
import org.nexasphere.model.entity.EventEntity;
import org.nexasphere.repository.EventRepository;
import org.nexasphere.util.Sanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
public class EventsController {

    private final EventRepository repo;

    public EventsController(EventRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<EventEntity> getAll() {
        return repo.findAll();
    }

    @PostMapping
    public ResponseEntity<EventEntity> create(@Valid @RequestBody EventEntity event) {
        event.setId(null);
        event.setName(Sanitizer.clean(event.getName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(event));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventEntity> update(@PathVariable Long id, @Valid @RequestBody EventEntity event) {
        return repo.findById(id).map(existing -> {
            event.setId(id);
            event.setName(Sanitizer.clean(event.getName()));
            return ResponseEntity.ok(repo.save(event));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
