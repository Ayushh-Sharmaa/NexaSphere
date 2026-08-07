import { formsService } from "../services/formsService.js";

const ALLOWED_FORM_TYPES = new Set(["membership", "recruitment", "core_team"]);

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      if (e && e.message === "Invalid form submission" && e.details) {
        return res.status(400).json({
          error: e.message,
          issues: e.details,
        });
      }

      console.error("[wrapAsync error]", e);

      return res.status(500).json({
        error: "Internal server error",
      });
    });
}

export function makeHandleForm(formType) {
  return wrapAsync(async (req, res) => {
    const result = await formsService.handleForm(formType, req.body || {});
    return res.json(result);
  });
}

export const handleFormByParam = wrapAsync(async (req, res) => {
  const formType = req.params?.formType;

  if (!ALLOWED_FORM_TYPES.has(formType)) {
    return res.status(400).json({
      error: "Invalid form type",
    });
  }

  const result = await formsService.handleForm(formType, req.body || {});
  return res.json(result);
});
