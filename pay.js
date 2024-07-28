const paypal=require('paypal-rest-sdk');
const{PAYPAL_MODE,PAYPAL_CLIENT_KEY,PAYPAL_SECRET_KEY}=file.env;
paypal.configure({
    'mode':PAYPAL_MODE,
    'client_id':PAYPAL_CLIENT_KEY,
    'client_secret':PAYPAL_SECRET_KEY
})
