import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";
import { v2 as cloudinary } from 'cloudinary'
import path from 'path'
import nodemailer from 'nodemailer'

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

const tempEmailDomains = [
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
    'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.net',
    'guerrillamail.org', 'spam4.me', 'trashmail.com', 'trashmail.me', 'trashmail.net',
    'dispostable.com', 'mailnull.com', 'spamgourmet.com', 'trashmail.at',
    'tempr.email', 'discard.email', 'spambox.us', 'maildrop.cc',
    'mintemail.com', 'spamfree24.org', 'mailnew.com', 'tempinbox.com',
    'throwam.com', 'fakeinbox.com', 'mailscrap.com', 'spamherelots.com',
    'getairmail.com', 'filzmail.com', 'mailexpire.com', 'spamex.com',
    'tempmail.net', 'emailondeck.com', '10minutemail.com', '10minutemail.net',
    'temp-mail.org', 'mohmal.com', 'mailtemp.net', 'getnada.com',
    'tempail.com', 'spamgourmet.net'
]

const generateVerificationCode = () => `${Math.floor(100000 + Math.random() * 900000)}`

const sendVerificationEmail = async (email, name, code) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('EMAIL_USER or EMAIL_PASS is missing. Skipping verification email send.')
        return
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })

    await transporter.sendMail({
        from: `"BLOOP Fashion" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify your BLOOP account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
                <h2 style="margin-bottom: 8px;">Welcome to BLOOP, ${name || 'there'}!</h2>
                <p style="color: #444; line-height: 1.5;">Use this verification code to activate your account:</p>
                <div style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 16px 0;">${code}</div>
                <p style="color: #666; font-size: 13px;">This code expires in 10 minutes.</p>
            </div>
        `
    })
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }
        if (user.provider && user.provider !== 'manual') {
            return res.json({ success: false, message: `Please login with ${user.provider}` })
        }
        if (!user.isVerified) {
            return res.json({
                success: false,
                requiresVerification: true,
                message: 'Please verify your email before login.'
            })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (isMatch) {
            const token = createToken(user._id)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const exists = await userModel.findOne({ email })
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        const emailDomain = email.split('@')[1].toLowerCase()
        if (tempEmailDomains.includes(emailDomain)) {
            return res.json({ success: false, message: "Temporary or disposable emails are not allowed." })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password (min 8 characters)" })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const verificationCode = generateVerificationCode()
        const verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            provider: 'manual',
            isVerified: false,
            verificationCode,
            verificationCodeExpiresAt
        })

        await newUser.save()
        await sendVerificationEmail(email, name, verificationCode)

        res.json({
            success: true,
            requiresVerification: true,
            message: 'Verification code sent to your email.'
        })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const verifyEmailCode = async (req, res) => {
    try {
        const { email, code } = req.body
        if (!email || !code) {
            return res.json({ success: false, message: 'Email and code are required' })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        if (user.isVerified) {
            const token = createToken(user._id)
            return res.json({ success: true, token, message: 'Already verified' })
        }

        if (!user.verificationCode || !user.verificationCodeExpiresAt) {
            return res.json({ success: false, message: 'No verification code found. Please resend code.' })
        }

        if (new Date(user.verificationCodeExpiresAt).getTime() < Date.now()) {
            return res.json({ success: false, message: 'Verification code expired. Please resend code.' })
        }

        if (String(user.verificationCode) !== String(code).trim()) {
            return res.json({ success: false, message: 'Invalid verification code' })
        }

        user.isVerified = true
        user.verificationCode = ''
        user.verificationCodeExpiresAt = null
        await user.save()

        const token = createToken(user._id)
        return res.json({ success: true, token, message: 'Email verified successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.json({ success: false, message: 'Email is required' })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }

        if (user.provider !== 'manual') {
            return res.json({ success: false, message: `Please login with ${user.provider}` })
        }

        if (user.isVerified) {
            return res.json({ success: false, message: 'This email is already verified' })
        }

        const verificationCode = generateVerificationCode()
        user.verificationCode = verificationCode
        user.verificationCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
        await user.save()

        await sendVerificationEmail(user.email, user.name, verificationCode)
        return res.json({ success: true, message: 'Verification code resent successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const adminAccounts = [
            {
                name: process.env.ADMIN1_NAME || 'Admin1',
                email: process.env.ADMIN1_EMAIL,
                password: process.env.ADMIN1_PASSWORD
            },
            {
                name: process.env.ADMIN2_NAME || 'Admin2',
                email: process.env.ADMIN2_EMAIL,
                password: process.env.ADMIN2_PASSWORD
            },
            {
                name: process.env.ADMIN3_NAME || 'Admin3',
                email: process.env.ADMIN3_EMAIL,
                password: process.env.ADMIN3_PASSWORD
            }
        ].filter((admin) => admin.email && admin.password)

        const matchedAdmin = adminAccounts.find((admin) => admin.email === email && admin.password === password)

        if (!matchedAdmin) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const token = jwt.sign(
            { role: 'admin', email: matchedAdmin.email, adminName: matchedAdmin.name },
            process.env.JWT_SECRET
        );
        res.json({ success: true, token, adminName: matchedAdmin.name })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const socialLogin = async (req, res) => {
    try {
        const { name, email, avatar, uid, provider } = req.body;
        let user = await userModel.findOne({ email })
        if (!user) {
            user = new userModel({ name, email, password: uid, avatar, provider, isVerified: true })
            await user.save()
        } else {
            await userModel.findByIdAndUpdate(user._id, { avatar, provider, isVerified: true })
        }
        const token = createToken(user._id)
        res.json({ success: true, token })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const user = await userModel.findById(userId).select('-password')
        if (!user) {
            return res.json({ success: false, message: 'User not found' })
        }
        res.json({ success: true, user })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const updateProfile = async (req, res) => {
    try {
        const { userId, name, address } = req.body
        await userModel.findByIdAndUpdate(userId, { name, address })
        res.json({ success: true, message: 'Profile updated' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const changePassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body
        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })
        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) return res.json({ success: false, message: 'Current password is incorrect' })
        const salt = await bcrypt.genSalt(10)
        const hashed = await bcrypt.hash(newPassword, salt)
        await userModel.findByIdAndUpdate(userId, { password: hashed })
        res.json({ success: true, message: 'Password changed' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const uploadAvatar = async (req, res) => {
    try {
        const { userId, avatarBase64 } = req.body
        if (!avatarBase64) {
            return res.json({ success: false, message: 'No image provided' })
        }
        const result = await cloudinary.uploader.upload(avatarBase64, {
            resource_type: 'image',
            folder: 'bloop/avatars'
        })
        await userModel.findByIdAndUpdate(userId, { avatar: result.secure_url })
        res.json({ success: true, avatar: result.secure_url })
    } catch (error) {
        console.log('Avatar upload error:', error)
        res.json({ success: false, message: error.message })
    }
}

const uploadAvatarFile = async (req, res) => {
    try {
        const userId = req.body?.userId || req.userId
        const file = req.file

        if (!userId) {
            return res.json({ success: false, message: 'User not found' })
        }

        if (!file) {
            return res.json({ success: false, message: 'No avatar file uploaded' })
        }

        const avatarPath = path.posix.join('/uploads', file.filename)
        await userModel.findByIdAndUpdate(userId, { avatar: avatarPath })

        res.json({ success: true, avatar: avatarPath, path: avatarPath })
    } catch (error) {
        console.log('Avatar file upload error:', error)
        res.json({ success: false, message: error.message })
    }
}

const deleteAddress = async (req, res) => {
    try {
        const { userId } = req.body
        await userModel.findByIdAndUpdate(userId, {
            address: { street: '', city: '', state: '', zipcode: '', country: '', phone: '' }
        })
        res.json({ success: true, message: 'Address deleted' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const deleteAccount = async (req, res) => {
    try {
        const { userId, password } = req.body
        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })
        if (user.provider === 'manual') {
            if (!password) return res.json({ success: false, message: 'Password required' })
            const isMatch = await bcrypt.compare(password, user.password)
            if (!isMatch) return res.json({ success: false, message: 'Incorrect password' })
        }
        await userModel.findByIdAndDelete(userId)
        res.json({ success: true, message: 'Account deleted' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const addShippingAddress = async (req, res) => {
    try {
        const { userId, label = 'Home', street = '', city = '', state = '', zipcode = '', country = '', phone = '' } = req.body
        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })

        const address = { label, street, city, state, zipcode, country, phone }
        user.addresses = [...(user.addresses || []), address].slice(-10)
        await user.save()
        res.json({ success: true, addresses: user.addresses })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const listShippingAddresses = async (req, res) => {
    try {
        const { userId } = req.body
        const user = await userModel.findById(userId).select('addresses')
        if (!user) return res.json({ success: false, message: 'User not found' })
        res.json({ success: true, addresses: user.addresses || [] })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const removeShippingAddress = async (req, res) => {
    try {
        const { userId, index } = req.body
        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })

        const idx = Number(index)
        if (!Number.isInteger(idx) || idx < 0 || idx >= (user.addresses || []).length) {
            return res.json({ success: false, message: 'Invalid address index' })
        }

        user.addresses.splice(idx, 1)
        await user.save()
        res.json({ success: true, addresses: user.addresses || [] })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const savePaymentMethod = async (req, res) => {
    try {
        const { userId, type = 'card', provider = 'stripe', last4 = '', brand = '', holderName = '', isDefault = false } = req.body
        if (!last4) {
            return res.json({ success: false, message: 'Payment method last4 is required' })
        }

        const user = await userModel.findById(userId)
        if (!user) return res.json({ success: false, message: 'User not found' })

        let methods = user.savedPaymentMethods || []
        if (isDefault) {
            methods = methods.map((item) => ({ ...item.toObject?.() || item, isDefault: false }))
        }

        methods.push({ type, provider, last4, brand, holderName, isDefault })
        user.savedPaymentMethods = methods.slice(-5)
        await user.save()

        res.json({ success: true, paymentMethods: user.savedPaymentMethods })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const listPaymentMethods = async (req, res) => {
    try {
        const { userId } = req.body
        const user = await userModel.findById(userId).select('savedPaymentMethods')
        if (!user) return res.json({ success: false, message: 'User not found' })
        res.json({ success: true, paymentMethods: user.savedPaymentMethods || [] })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const updatePreferences = async (req, res) => {
    try {
        const { userId, preferredCurrency, preferredLanguage, preferredRegion } = req.body
        const update = {}
        if (preferredCurrency) update.preferredCurrency = preferredCurrency
        if (preferredLanguage) update.preferredLanguage = preferredLanguage
        if (preferredRegion) update.preferredRegion = preferredRegion

        await userModel.findByIdAndUpdate(userId, update)
        res.json({ success: true, message: 'Preferences updated' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginUser, registerUser, adminLogin, socialLogin,
    verifyEmailCode, resendVerificationCode,
    getUserProfile, updateProfile, changePassword,
    uploadAvatar, uploadAvatarFile, deleteAddress, deleteAccount
    , addShippingAddress, listShippingAddresses, removeShippingAddress,
    savePaymentMethod, listPaymentMethods, updatePreferences
}