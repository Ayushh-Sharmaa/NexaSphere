import { withDb } from "./db.js";
import logger from "../utils/logger.js";

function parsePostgresArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const content = trimmed.slice(1, -1).trim();
      return content
        ? content.split(",").map((item) => item.trim().replace(/^"|"$/g, ""))
        : [];
    }
  }
  return [];
}
import { getCache, setCache, invalidateCache } from "../config/redis.js";

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    date: row.date_text,
    description: row.description,
    status: row.status,
    icon: row.icon,
    tags: parsePostgresArray(row.tags),
    tags: Array.isArray(row.tags) ? row.tags : (row.tags ?? []),
    restrictedGroups:
      typeof row.restricted_groups === "string"
        ? JSON.parse(row.restricted_groups)
        : (row.restricted_groups ?? []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const eventsRepository = {
  async list({
    page = 1,
    limit = 20,
    status,
    studentGroups = undefined,
    startDate,
    endDate,
    category,
    location,
    search,
  } = {}) {
    // Returns { rows, total } — rows are the current page, total is the full
    // count without LIMIT so callers can build pagination metadata.
    const cacheKey = `events:list:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    return withDb(async (client) => {
      const offset = (page - 1) * limit;

      // Fix: If an empty page is returned (e.g. page out of bounds), fall back to a quick count
      const { rows } = await client.query(
        `select *, count(*) over()::int as total 
         from events 
         order by created_at desc 
         limit $1 offset $2`,
        [limit, offset],
        "select * from events order by created_at desc limit $1 offset $2",
        [limit, offset]
      );

      const total = rows.length > 0 ? rows[0].total : 0;
      return { rows: rows.map(mapRow), total };
      const countResult = await client.query(
        "select count(*)::int as total from events"
      );
      const result = { rows: rows.map(mapRow), total };
      await setCache(cacheKey, result);
      return result;

      try {
        const offset = (page - 1) * limit;

        let query = "select * from events ";
        const params = [];
        let conditions = [];

        if (status) {
          conditions.push(`status = $${params.length + 1}`);
          params.push(status);
        }

        if (category) {
          conditions.push(
            `LOWER(array_to_string(tags, ',')) LIKE LOWER($${params.length + 1})`
          );
          params.push(`%${category}%`);
        }

        if (location) {
          conditions.push(
            `LOWER(description) LIKE LOWER($${params.length + 1})`
          );
          params.push(`%${location}%`);
        }

        if (search) {
          conditions.push(
            `(LOWER(name) LIKE LOWER($${params.length + 1})
      OR LOWER(description) LIKE LOWER($${params.length + 2}))`
          );

          params.push(`%${search}%`);
          params.push(`%${search}%`);
        }

        if (startDate) {
          conditions.push(`date_text >= $${params.length + 1}`);
          params.push(startDate);
        }

        if (endDate) {
          conditions.push(`date_text <= $${params.length + 1}`);
          params.push(endDate);
        }

        if (studentGroups === undefined) {
          // If no groups provided, only show public events
          conditions.push(
            `(restricted_groups IS NULL OR jsonb_array_length(restricted_groups) = 0 OR restricted_groups = '[]'::jsonb)`
          );
        } else {
          // Show public events OR events where restricted_groups overlaps with studentGroups
          const groupArray = studentGroups.length
            ? studentGroups.map((id) => `'${id}'`).join(",")
            : "'-1'"; // -1 to match nothing
          conditions.push(
            `(restricted_groups IS NULL OR jsonb_array_length(restricted_groups) = 0 OR restricted_groups = '[]'::jsonb OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(restricted_groups) AS g WHERE g IN (${groupArray})))`
          );
          conditions.push(
            `(restricted_groups IS NULL OR jsonb_array_length(restricted_groups) = 0 OR restricted_groups = '[]'::jsonb OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(restricted_groups) AS g WHERE g = ANY($${params.length + 1})))`
          );
          params.push(studentGroups.length > 0 ? studentGroups : ["-1"]);
        }

        if (conditions.length > 0) {
          query += " where " + conditions.join(" and ");
        }

        query += ` order by created_at desc limit $${params.length + 1} offset $${params.length + 2}`;
        params.push(limit, offset);

        const { rows } = await client.query(query, params);

        const countQuery =
          "select count(*)::int as total from events " +
          (conditions.length > 0 ? " where " + conditions.join(" and ") : "");
        const countResult = await client.query(countQuery);
        const countParams = params.slice(0, params.length - 2);

        const total = countResult.rows[0]?.total ?? 0;

        await client.query("COMMIT");

        return {
          rows: rows.map(mapRow),
          total,
        };
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    });
  },

  async getById(id) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        "select * from events where id = $1",
        [id]
      );
      if (!rows.length) return null;
      return mapRow(rows[0]);
      if (rows.length > 0) {
        return { rows: rows.map(mapRow), total: rows[0].total };
      }

      // Fallback only if offset yielded zero rows
      const { rows: countRows } = await client.query(
        "select count(*)::int as total from events"
      );
      return { rows: [], total: countRows[0]?.total ?? 0 };
    });
  },

  async create(event) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into events (id, name, short_name, date_text, description, status, icon, tags, restricted_groups, capacity)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         on conflict (id) do update set
           name=excluded.name,
           short_name=excluded.short_name,
           date_text=excluded.date_text,
           description=excluded.description,
           status=excluded.status,
           icon=excluded.icon,
           tags=excluded.tags,
           restricted_groups=excluded.restricted_groups,
           capacity=excluded.capacity,

           updated_at=now()
         returning *`,
        [
          event.id,
          event.name,
          event.shortName,
          event.date,
          event.description,
          event.status,
          event.icon,
          event.tags,
          JSON.stringify(event.restrictedGroups || []),
          event.capacity || null,
        ]
      );
      const mapped = mapRow(rows[0]);
      import("../services/searchIndexer.js")
        .then(({ searchIndexer }) => searchIndexer.indexEvent(mapped))
        .catch((err) =>
          logger.error("Failed to index event in search", {
            err,
            eventId: mapped?.id,
          })
        );
      return mapped;
      await invalidateCache("events:list:*");
      return mapRow(rows[0]);
    });
  },

  async update(id, patch) {
    return withDb(async (client) => {
      const keys = Object.keys(patch);

      // If no valid update fields are provided, skip the DB call and return the current record
      if (keys.length === 0) {
        const { rows } = await client.query(
          "select * from events where id = $1",
          [id]
        );
        return rows.length ? mapRow(rows[0]) : null;
      }

      const fieldMap = {
        name: "name",
        shortName: "short_name",
        date: "date_text",
        description: "description",
        status: "status",
        icon: "icon",
        tags: "tags",
        capacity: "capacity",
      };

      const setClauses = [];
      const values = [id]; // $1 is always the ID for the WHERE clause
      let paramIndex = 2; // Dynamic parameters start at $2

      for (const key of keys) {
        if (fieldMap[key] !== undefined) {
          setClauses.push(`${fieldMap[key]} = $${paramIndex}`);

          // Ensure arrays are passed in a format pg-driver handles natively or as clean nulls
          let val = patch[key];
          if (key === "tags" && Array.isArray(val)) {
            // Converts JS array directly to PG array format if driver needs it,
            // or lets the driver serialize it safely.
            val = val;
          }

          values.push(val);
          paramIndex++;
        }
      }

      setClauses.push(`updated_at = now()`);

      const queryText = `
        update events 
        set ${setClauses.join(", ")} 
        where id = $1 
        returning *`;

      const { rows } = await client.query(queryText, values);
      if (!rows.length) return null;

      await invalidateCache("events:list:*");
      return mapRow(rows[0]);
    });
  },

  async delete(id) {
    return withDb(async (client) => {
      const { rowCount } = await client.query(
        "delete from events where id=$1",
        [id]
      );
      if (rowCount > 0) {
        import("../services/searchIndexer.js")
          .then(({ searchIndexer }) =>
            searchIndexer.deleteDocument("events", id)
          )
          .catch((err) =>
            logger.error("Failed to remove event from search index", {
              err,
              eventId: id,
            })
          );
        await invalidateCache("events:list:*");
        logger.error("Failed to remove event from search index", {
          err,
          eventId: id,
        });
      }
      return rowCount > 0;
    });
  },

  async listAll({
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    category,
    location,
    search,
  } = {}) {
    return withDb(async (client) => {
      const offset = (page - 1) * limit;

      // Single pass query using count(*) over() window function
      let selectClause = "select *, count(*) over()::int as total from events";
      const params = [];
      const conditions = [];

      if (status) {
        conditions.push(`status = $${params.length + 1}`);
        params.push(status);
      }

      if (category) {
        conditions.push(
          `LOWER(array_to_string(tags, ',')) LIKE LOWER($${params.length + 1})`
        );
        params.push(`%${category}%`);
      }

      if (location) {
        conditions.push(`LOWER(description) LIKE LOWER($${params.length + 1})`);
        params.push(`%${location}%`);
      }

      if (search) {
        conditions.push(
          `(LOWER(name) LIKE LOWER($${params.length + 1})
        OR LOWER(description) LIKE LOWER($${params.length + 2}))`
        );
        params.push(`%${search}%`);
        params.push(`%${search}%`);
      }

      if (startDate) {
        conditions.push(`date_text >= $${params.length + 1}`);
        params.push(startDate);
      }

      if (endDate) {
        conditions.push(`date_text <= $${params.length + 1}`);
        params.push(endDate);
      }

      if (conditions.length) {
        selectClause += " WHERE " + conditions.join(" AND ");
      }

      selectClause += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const { rows } = await client.query(selectClause, params);

      if (rows.length > 0) {
        return {
          rows: rows.map(mapRow),
          total: rows[0].total,
        };
      }

      // Fallback count query only if offset was beyond actual table bounds
      let countQuery = "select count(*)::int as total from events";
      const countParams = params.slice(0, params.length - 2);
      if (conditions.length) {
        countQuery += " WHERE " + conditions.join(" AND ");
      }

      const countResult = await client.query(countQuery, countParams);

      return {
        rows: [],
        total: countResult.rows[0]?.total ?? 0,
      };
    });
  },
};
