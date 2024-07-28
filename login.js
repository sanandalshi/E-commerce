let express=require('express');
let route=express.Router();
let p=require('path');
let isauth=require('./midleware/isauth');
const bcrypt=require('bcryptjs');
let db=require('./util/database');
const flash = require('connect-flash');
const crypto=require('crypto');
const d = require('./models/cart');
require('dotenv').config();
const {check, validationResult}=require('express-validator');
const nodemailer = require('nodemailer');
function removeTrailingSlash(str) {
    return str.replace(/\/$/, '');
}
const paypal=require('paypal-rest-sdk');


paypal.configure({
    'mode':"sandbox",
    'client_id':"AfJGBZNC7KDT9iK46PEXqARVygVj4fUnc1ZO0TxCDbvC1PnoP4MyBg-XglNCUc_W3EOO2fOR9byayZpf",
    'client_secret':"ELnKsOjCpmAQC4boGaHzP0AIneV4L5QkMwCbOD0OdysOTuTxFWOsjTxrWmVt9OIPSAJPe3Bx-VFeSJxH"
});
let transport = nodemailer.createTransport({
    service:"gmail",
     port: 465,
     secure: true,
     auth: {
     user:"sanand.alshi@gmail.com",
       pass: "dpba pvwk psue eelk"
     }
   });

route.get('/login',(req,res)=>{
 
res.render('auth',{message:req.flash('error'),err:req.flash('err')});
});


route.post('/loogin',[check('email').isEmail().withMessage('the email is invalid!'),check('password','Invalid password!').isLength({min:5}).isAlphanumeric()] ,async (req, res) => {
    const { email, password } = req.body;
let error=validationResult(req);
if(!error.isEmpty()){
    let ans=error.array()[0].msg;
    req.flash('err',ans);
    res.status(422).redirect('/login');
    return;
}
    try {
        const [rows] = await db.execute('SELECT * FROM user2 WHERE email = ?', [email]);

        let ans = false;
        
        for (let row of rows) {
            let match = await bcrypt.compare(password, row.password);
            if (row.email === email && match) {
                ans = true;
                break;
            }
        }

        if (ans) {
            req.session.loggedin = true;
            res.redirect('/');
        } else {
           req.flash('error','invalid email or password!');
           res.redirect('./login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('<h1>Server Error</h1>');
    }
});

route.use('/reset',(req,res,next)=>{
let message=req.flash('error');

res.render('reset',{message});
});


route.use('/resetpass/:token', async (req, res, next) => {
    let token = req.params.token;

  
        const [rows] = await db.execute('SELECT * FROM user2 WHERE reset_token = ? AND reset_token_expires > ?', [token, new Date()]);
        let email="abc.alshi@gmail.com";
        rows.forEach(row=>{
            if(row.reset_token==token&&row.reset_token_expires > new Date()){
                email=row.email;
            };
        });
        if (rows.length === 0) {
            // Token is invalid or expired
            req.flash('error', 'Invalid or expired token');
            return res.redirect('/');
        } else {
           
           console.log(email);
            return res.render('karoab', { token ,email});
        }
   
});

route.post('/password',async(req,res)=>{
    let email=removeTrailingSlash(req.body.email);
    let npass= await bcrypt.hash(req.body.password,12);
    // console.log(email);
    // console.log(npass);
    await db.execute('UPDATE user2 SET password = ? WHERE email = ?', [npass, email])
    .then(result=>{
    console.log('ho gaya!');
res.redirect('/');
  }).catch(err=>{
    console.log(err);
  })



})

route.post('/reset-auth', async(req,res)=>{
    let email=req.body.email;
    
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000); 
await db.execute('select *from user2').then(([rows,feild])=>{
    let ans=false;
    rows.forEach  (row=>{
        if(row.email==email){
            ans=true;
        }
    });
if(ans==true){
    db.execute('UPDATE user2 SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [token, expires, email]);
    res.redirect('/');
    transport.sendMail({
        to:email,
        from:"sanand.alshi@gmail.com",
        subject:"RESET-PASSWORD",
        html:`<p>YOU AREQUESTED FOR CHANGING THE PASSWORD</P>
        <P>PLEASE CLICK ON THE LINK <a href="http://localhost:8080/resetpass/${token}">CHANGE-PASSWORD</a>TO CHANGE THE PASSWORD</p>
        `
    });
}
else{
    req.flash('error','the user does not exists');
    res.redirect('/reset');
}






})




});

route.post('/splice',(req,res,next)=>{
let id=req.body.id;
let ans=-1;
for(let i=0;i<d.arr.length;i++){
    if(d.arr[i].id==id){
        if(d.arr[i].quan>1){
        d.arr[i].quan--;res.redirect('/cartarray');return;}else{
            d.arr.splice(1,i);
            res.redirect('/cartarray');
            return;
        }
        break;
    }
}


});


route.post('/pay',async(req,res,next)=>{
    try {
        const total = parseInt(req.body.amount);
console.log(total);
        // Validate total
        if (isNaN(total) || total <= 0) {
            return res.status(400).json({ error: 'Invalid total amount' });
        }

        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "http://localhost:8080/success",
                "cancel_url": "http://localhost:8080/cancel"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "Book",
                        "sku": "001",
                        "price": total, // Ensure two decimal places
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": total // Ensure two decimal places
                },
                "description": "Thanks for paying with us"
            }]
        };

        // Promisify paypal.payment.create
        const createPayment = () => {
            return new Promise((resolve, reject) => {
                paypal.payment.create(create_payment_json, (error, payment) => {
                    if (error) {
                        return reject(error);
                    } 
                    return resolve(payment);
                });
            });
        };

     
        const payment = await createPayment();

        const approvalUrl = payment.links.find(link => link.rel === 'approval_url');

        if (approvalUrl) {
            return res.redirect(approvalUrl.href);
        } else {
            return res.status(500).json({ error: 'Approval URL not found' });
        }
        
    } catch (error) {
        console.error('Error creating PayPal payment:', error);
        return res.status(500).json({ error: 'An error occurred while processing your payment' });
    }
});
















module.exports=route;