export const timeZoneMiddleware = (req, res, next) => {
  // Check for time zone in headers or body, otherwise fallback
  const clientTimeZone = req.headers["x-timezone"] || req.body.timeZone;
  const timeZone =
    clientTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  req.timeZone = timeZone;
  next();
};
