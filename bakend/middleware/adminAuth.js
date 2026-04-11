import jwt from 'jsonwebtoken';

const getAllowedAdminEmails = () => {
    return [
        process.env.ADMIN1_EMAIL,
        process.env.ADMIN2_EMAIL,
        process.env.ADMIN3_EMAIL
    ].filter(Boolean)
}

const adminAuth = (req,res,next) => {
    try {
        const {token} = req.headers;
        if (!token) {
            return res.json({success:false,message:"admin not authorized"})
        }
        const token_decoded = jwt.verify(token,process.env.JWT_SECRET);
        // Only supports structured multi-admin tokens.
        const allowedEmails = getAllowedAdminEmails()
        const isNewAdminToken = token_decoded?.role === 'admin' && allowedEmails.includes(token_decoded?.email)

       if (!isNewAdminToken) {
            return res.json({success:false,message:"admin not authorized"})
        }

        req.adminName = token_decoded?.adminName || token_decoded?.email || 'Admin'
        req.adminEmail = token_decoded?.email || ''

        next();
    } catch (error) {
        console.log(error);
        res.json({success:false, message:error.message})
    }
}

export default adminAuth;