export const authorization = (req, res, next) => {
  if (!req.signedCookies.token) {
    return res
      .status(403)
      .json({ success: false, msg: "order confirmation failed" });
  }
  next();
};
