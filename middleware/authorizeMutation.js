const authorizeMutation = (req, res, next) => {
    return req.app.locals.requireAuth(req, res, next);
};

module.exports = authorizeMutation;
