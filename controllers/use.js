//require
const proModel = require('../models/User')
const storeModel = require('../models/product')
const cartModel = require('../models/cart')

const bcrypt = require('bcrypt')
const saltValue = 10
const nodemailer = require('nodemailer')
const dotenv = require('dotenv').config()

// send verification mail
const sendVerificationMail = async (name, email, id) => {
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            auth: {
                user: process.env.email,
                pass: process.env.pass
            }
        })

        const mailOptions = {
            from: process.env.email,
            to: email,
            subject: "Verification Mail",
            // template:'mail'
            html: `<h4>Hello ${name},&nbsp;&nbsp; Please click here <a href="${process.env.connUrl}/user/verify?_id=${id}">Verify</a></h4>`
        }
        //sending mail
        transporter.sendMail(mailOptions, function (err, info) {
            if (err) console.log(err);
            else console.log("Email send Sucessfully", info.response)
        })

    } catch (error) {
        console.log(error)
    }
}
// verify mail function
const verifyMail = async (req, res) => {
    try {
        //updating status to 1
        const verified = await proModel.updateOne({ _id: req.query._id }, { $set: { status: 1 } })
        if (verified) {
            res.render("verifiedMail")
        }
        else {
            console.log("mail not verified")
        }

    } catch (error) {
        console.log(error)

    }
}

//bcrypting password
const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, saltValue)
        return passwordHash

    } catch (error) {
        console.log(error)
    }
}

// user registration
let userRegister = async (req, res, filename) => {
    try {
        let { name, email, mobile, address, password, status } = req.body;
        let name1 = /[a-zA-Z]{6}\s?[0-9]{3}\s?$/;
        let email1 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        let pass1 = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,24}$/;
        let address1 = /[a-zA-Z]{0,30}$/;
        let mobile1 = /^[789]\d{9}$/;
        let mobileErr;
        let addressErr;
        let nameErr;
        let emailErr;
        let passErr;
        if (name1.test(name) && email1.test(email)
            && pass1.test(password) && mobile1.test(mobile) && address1.test(address)) {
            //calling securePassword function to bcrypt
            const spassword = await securePassword(req.body.password)
            const bodyData = new proModel({
                name: name,
                email: email,
                mobile: mobile,
                address: address,
                password: spassword,
                status: status
            });
            let user = new proModel(bodyData)

            //saving data into database
            const userData = await user.save()
            if (userData) {
                //sending verification mail
                sendVerificationMail(req.body.name, req.body.email, userData._id)
                res.render('register', { succMsg: "Verification Mail sent" })
            }
            else {
                res.render('register', { errMsg: "Registration failed !" })

            }
        }
        else {
            if (!name1.test(name)) {
                nameErr = '*First 6 digits are alphabets and 3 next are numbers   ';
            }
            if (!email1.test(email)) {
                emailErr = '*Email address is not valid';
            }
            if (!pass1.test(password)) {
                passErr = '*Password between 8 to 24 characters which contain at least one  uppercase,lowercase'
            }
            if (!mobile1.test(mobile)) {
                mobileErr = '*Mobile No. is not valid'
            }
            if (!address1.test(address)) {
                addressErr = '*Address is not valid (use only letters max 30)'
            }
            res.render('register', { nameErr: nameErr, emailErr: emailErr, mobileErr: mobileErr, addressErr: addressErr, passErr: passErr, })
        }
    }
    catch (err) {
        if (err) throw err
    }
}

//user login
const login = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        //finding data using email
        const userData = await proModel.findOne({ email: email });

        if (userData) {

            // comparing input password with database password
            const passwordCheck = await bcrypt.compare(password, userData.password);
            if (passwordCheck) {

                if (userData.status == 0) {
                    res.render('login', { errMsg: "Verifivation of account is pending" })
                } else {
                    session = req.session;
                    session.email = email;
                    session.customerId = userData._id

                    storeModel.find({}, async (err, data) => {
                        if (err) { res.send("Something went wrong in all product") }
                        session.data = data.map(data => data.toJSON())
                        const cart_qty = await cartModel.find({ customerId: req.session.customerId }, { quantity: 1 })
                        const qty = cart_qty.length;
                        res.render('store', { productdata: req.session.data, email: req.session.email, customerId: req.session.customerId, cart: qty })

                    })
                    // return res.render('store',{email:req.session.email});
                }
            } else {
                res.render('login', { errMsg: "Email and password is incorrect! " })
            }
        } else {
            res.render('login', { errMsg: "Email and password is incorrect! " })
        }

    } catch (error) {
        console.log(error.errMsg);
    }
}


const cartDatabase = async (req, res) => {
    try {

        const productId = req.body.id
        const customerId = req.session.customerId
        const price = req.body.price
        const quantity = req.body.quantity
        const name = req.body.name
        const image = req.body.image
        console.log(name);

        await cartModel.findOne({ productId: productId }, (err, data) => {
            console.log("cData :->" + data)
            if (!data) {
                const cartData = ({
                    customerId: customerId,
                    productId: productId,
                    price: price,
                    totalprice: totalprice + price,
                    quantity: quantity,
                    name: name,
                    image: image
                })
                let cart = new cartModel(cartData)
                const cartInfo = cart.save()
                if (cartInfo) console.log("cart data saved")

                res.render('store', { productdata: req.session.data, email: req.session.email, succMsg: "Product is sucessfully added in cart" })
            }
            else {
                res.render('store', { productdata: req.session.data, email: req.session.email, errMsg: "Product is already added in cart" })
            }

        });

    } catch (error) {
        console.log(error)
    }
}

const cartMenu = async (req, res) => {
    try {
        const customerId = req.session.customerId
        await cartModel.find({ customerId: customerId }, (err, data) => {
            if (err) res.send("Something went wrong in cart")
            session = req.session;
            UserCartData = data.map(data => data.toJSON())
            const qty = UserCartData.length;
            session.UserCartData = UserCartData

            //console.log(price);
            res.render('cart', { UserCartData: req.session.UserCartData, email: req.session.email, cart: qty, })
        })

    } catch (error) {
        console.log(error)
    }
}

// const store = ((req, res) => {
//     res.redirect("/user/store", { productdata: req.session.data, email: req.session.email });
// }
// )


const plusPrice = async (req, res) => {
    productId = req.params.id
    customerId = req.session.customerId
    const data = await cartModel.updateOne({ productId: productId, customerId: customerId }, { $inc: { quantity: 1 } })
    res.redirect('/user/cartMenu')
    console.log(data)
}

const minusPrice = async (req, res) => {
    productId = req.params.id
    customerId = req.session.customerId
    const data = await cartModel.updateOne({ productId: productId, customerId: customerId }, { $inc: { quantity: -1 } })
    res.redirect('/user/cartMenu')
    console.log(data)
}

const store = (req, res) => {
    session = req.session;
    console.log(session);
    // session.email = email;
    // session.customerId = userData._id

    storeModel.find({}, async (err, data) => {
        if (err) { res.send("Something went wrong in all product") }
        session.data = data.map(data => data.toJSON())
        const cart_qty = await cartModel.find({ customerId: req.session.customerId }, { quantity: 1 })
        const qty = cart_qty.length;
        res.render('store', { productdata: req.session.data, cart: qty, email: req.session.email })

    });
}

// forget password logic
const forgetPassword = async (req, res) => {
    try {
        let userEmail = req.body.email
        let user = await proModel.findOne({ email: userEmail });
        if (user) {
            let transporter = nodemailer.createTransport({
                service: "gmail",
                port: 587,
                secure: false,
                auth: {
                    user: process.env.email,
                    pass: process.env.pass
                }
            })
            const mailOptions = {
                from: process.env.email,
                to: userEmail,
                subject: "forget Password Mail",
                // template:'mail'
                html: `<h4>Hello ${user.name},&nbsp;&nbsp; Please click here to change your password <a href="${process.env.connUrl}/user/passwordchange?id=${user._id}">change password</a></h4>`
            }
            transporter.sendMail(mailOptions, function (err, info) {
                if (err) console.log(err);
                else {
                    console.log("Email send Sucessfully", info.response)
                    res.render('forget', { succMsg: "Change password link is send to your registered mail" })
                }
            })
        }
        else {
            res.render('forget', { errMsg: "Please fill Email Properly !!!" })
        }

    } catch (error) {
        console.log(error)
    }
}

//change password logic
const changePassword = async (req, res) => {
    try {
        let userEmail = req.body.email
        //finding data
        let user = await proModel.findOne({ email: userEmail });
        if (user) {
            let pass1 = req.body.pass1
            let pass2 = req.body.pass2
            if (pass1 == pass2) {
                const secure_password = await securePassword(pass2);

                const updatePass = await proModel.updateOne({ email: userEmail }, { $set: { password: secure_password } })
                res.render('login', { succMsg: "Password Changed Successfully" })
            }
            else {
                res.redirect(changePassword, { errMsg: "Both Passwords do not match. Please Enter Correctly" })
            }
        }
        else {
            res.redirect(changePassword, { errMsg: "User not found" })
        }
    } catch (error) {
        console.log(error)
    }
}

//exports
module.exports = {
    userRegister,
    verifyMail,
    login,
    forgetPassword,
    changePassword,
    cartDatabase,
    cartMenu,
    minusPrice,
    plusPrice,
    store

}