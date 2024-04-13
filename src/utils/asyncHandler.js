const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next).catch((err) => console.log("Errror : ", err)))
    }
}

export { asyncHandler }

/*
this is using try catch approach 
const asyncHandler = (fn) => async (req, res, next)=>{
     try {
        await(fn(req, res, next))
     } catch (error) {
            res.status(err.code || 500).json({
                success : false, 
                message : err.message || 'Internal Server Error'
            })
     }
}

*/