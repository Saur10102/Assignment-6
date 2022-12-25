const express = require('express')
const router = express.Router()
const { userRegister, verifyMail, login, forgetPassword, changePassword, cartDatabase, thank, cartMenu, store, minusPrice, plusPrice } = require('../controllers/use.js')
const seceret = "assd123assd123321"
const oneDay = 1000 * 60 * 60 * 24;
const sessions = require('express-session');
const { RouterProvider } = require('react-router-dom');

router.use(sessions({
    secret: seceret,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))
//routes
router.get("/", (req, res) => {
    res.render("user")
})
router.get("/register", (req, res) => {
    res.render("register")
})
router.get("/login", (req, res) => {
    res.render("login", { succMsg: '', errMsg: '' })
})
router.get('/passwordchange', (req, res) => {
    res.render('changePassword')
})
router.get('/payment', (req, res) => {
    res.render('payment');
})
router.get('/verify', verifyMail)

router.get('/forget', (req, res) => {
    res.render('forget')
})
router.get('/thank', (req, res) => {
    res.render('thank');
})
router.get('/cartMenu', cartMenu);
// router.get('/store', store);


router.get('/store', store);

router.get('/minus/:id', minusPrice)
router.get('/plus/:id', plusPrice)


router.post('/postRegistrationData', userRegister)
router.post('/postLoginData', login)
router.post('/forgetPassword', forgetPassword)
router.post('/postChangePassword', changePassword)
router.post('/postCartData', cartDatabase)



module.exports = router;