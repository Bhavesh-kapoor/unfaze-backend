
const asyncHandler = (requestHandler) => (req, res, next) => {
    console.log("---", req.files)
    return Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
}

export default asyncHandler;
