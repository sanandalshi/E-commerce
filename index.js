const express = require('express');
const crypto=require('crypto');
const fs=require('fs');
const pdfkit=require('pdfkit');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const nodemailer = require('nodemailer');
const flash = require('connect-flash');
const exphbs = require('express-handlebars');
const { check, validationResult } = require('express-validator');
const multer = require('multer');
require('dotenv').config();
const paypal=require('paypal-rest-sdk');
const b = require('./models/product');
const c = require('./models/function');
const d = require('./models/cart');
const db = require('./util/database');
const isauth = require('./midleware/isauth');
const login = require('./login');

const app = express();

// Setup Handlebars
const hbs = exphbs.create({ extname: '.handlebars', defaultLayout: false });
app.engine('handlebars', hbs.engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const filestore = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
  }
});
app.use(multer({ storage: filestore }).single('image'));


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname,'images')));

const options = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Wj28@krhps',
  database: 'node-complete'
};
const sessionStore = new MySQLStore(options);


app.use(session({
  key: 'session_cookie_name',
  secret: 'your-secret-key',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 300000 }
}));

app.use(flash());
app.use(login);

const ITEMS=5;
let transport = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: "sanand.alshi@gmail.com",
    pass: "dpba pvwk psue eelk"
  }
});

app.get('/', (req, res) => {
  let session = req.session.loggedin;
  res.render('h', { session });
});

app.post('/p', (req, res) => {
  const { name, password } = req.body;
  let obj = {
    name: name,
    title: 'title page',
    body: 'bookshop near you!'
  };
  res.render('practise', obj);
});

app.post('/carti', isauth, (req, res) => {
  const { name, password } = req.body;
  res.send(`<h1>THE NAME OF THE CLIENT IS: ${name} AND PASSWORD IS: ${password}</h1>`);
});

app.post('/buy', isauth, (req, res) => {
  let image = req.body.image;
  let title = req.body.title;
  res.send(`<h1>${title}</h1> <img src="${image}" alt="${title}"/>`);
});


app.get('/home', (req, res, next) => {
  
   let page = parseInt(req.query.page, 10) || 1; 
   const ITEMS = 4; 
 
   console.log('Requested Page:', page);
 
   if (req.session.loggedin) {
     console.log('hai!');
   } else {
     console.log('nahi hai!');
   }
 
   let session = req.session.loggedin;
 
   
   const offset = (page - 1) * ITEMS;

   console.log('offest hai->:', offset); 
   console.log('Items per Page:', ITEMS); 
   const query = `SELECT * FROM products LIMIT ${ITEMS} OFFSET ${offset}`;
   
   db.execute(query)
     .then(([rows, fields]) => {
       let products = rows.map(row => ({
         yo: true,
         title: row.title,
         id: row.id,
         image: row.imageURL,
         price: row.price
       }));
 
       // Render the home page with the fetched products and session info
       res.render('home', { products, session });
     })
     .catch(err => {
       console.error('Database Error:', err); // Detailed error logging
       res.status(500).send('Internal Server Error');
     });
});

app.get('/addproduct', isauth, (req, res) => {
  res.render('add', { mess: req.flash('mess') });
});

app.post('/adding', [
  check('id').isNumeric().withMessage('ADD valid id!'),
  check('title').isLength({ min: 3 }).withMessage("enter valid title!"),check('price').isNumeric().withMessage('Enter valid prices!')
], (req, res) => {
  let idi = req.body.id.toString();
  let ts = req.body.title.toString();
  let price=req.body.price.toString();
  let is = req.file;
  if (!is) {
    req.flash('mess', 'No file uploaded');
    res.status(422).redirect('/addproduct');
    return;
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    let e = errors.array()[0].msg;
    req.flash('mess', e);
    res.status(422).redirect('/addproduct');
    return;
  }
let url=is.path;
  db.execute('INSERT INTO products (id, title, imageURL,price) VALUES (?, ?, ?,?)', [idi, ts, url,price])
    .then(result => {
      res.redirect('/');
    })
    .catch(err => {
      console.log("Error:", err);
      res.status(500).send('Internal Server Error');
    });
});

app.post('/product/:id/:title', (req, res) => {
  let object = {
    id: req.params.id,
    title: req.params.title,
    image: req.body.image,
  };
  res.render('datail', object);
});
let m=0;
app.post('/cart', isauth, (req, res) => {
  let a = req.body.id;
  let b = req.body.title;
  let c = req.body.image;
  let e=req.body.quan;
  let price=req.body.price;
 
  d.arr.push({ id: a, title: b, image: c,quan: e,price:price});
 
  });

app.get('/cartarray', (req, res) => {
  res.render('cart', {d});
});




app.post('/order',(req,res)=>{
  const id = crypto.randomBytes(20).toString('hex');
  let total=req.body.total;
 const ans = d.arr.map(a => ({
  id: a.id,
  title: a.title,
  image: a.image,
  quan: a.quan,
  
}));
res.render('order', { ans ,id,total});
});

app.get('/order/:orderid/:total',(req,res)=>{
const total=req.params.total
const id = req.params.orderid;
const invoiceName = 'invoice-' + id + '.pdf';


res.setHeader('Content-Type', 'application/pdf');
res.setHeader(
  'Content-Disposition',
  'inline; filename="' + invoiceName + '"'
);

const doc = new pdfkit();
doc.pipe(res);

let date=new Date();
doc.fontSize(10).text(date);
doc.fontSize(26).text('Invoice',{underline:true});
doc.text('-----------------------------------------');
doc.text('Your Order:');
d.arr.forEach(a=>{
  doc.text(a.title + '->'+ a.quan);
})
doc.text('total amount = ₹'+total);
doc.text('thank you for buying from bookshop!');
doc.end();



})








app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.status(500).send('Failed to destroy session');
    }
    res.redirect('/');
  });
});

app.get('/signin', (req, res) => {
  let done = req.flash('done');
  let signine = req.flash('signerror');
  res.render('signin', { done, signine });
});

app.post('/valid', [
  check('email').isEmail().withMessage('Please enter valid email!')
    .custom(value => {
      return db.execute('select * from user2 where email= ?', [value])
        .then(([rows]) => {
          if (rows.length > 0) {
            return Promise.reject('The user already exists');
          }
        });
    }),
  check('password').isLength({ min: 5 }).withMessage('The password should contain at least 5 characters').isAlphanumeric(),
  check('cpassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('The passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  let email = req.body.email;
  let pass = req.body.password;
  let cpassword = req.body.cpassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let inval = errors.array()[0].msg;
    req.flash('signerror', inval);
    res.status(422).redirect('/signin');
    console.log('Validation error:', errors.array());
    return;
  }

  let hashedPassword = await bcrypt.hash(pass, 12);

  db.execute('INSERT INTO user2 (email, password) VALUES (?, ?)', [email, hashedPassword])
    .then(result => {
      req.flash('done', 'An email has been sent to your email!');
      res.redirect('/signin');
      transport.sendMail({
        to: email,
        from: 'shopbook@gmail.com',
        subject: 'Signup Successful',
        html: '<h1>You have successfully signed up! Welcome to Book Shop</h1>'
      }).then(result => { console.log('The email is sent!'); }).catch(err => { console.log(err); });
    })
    .catch(err => {
      res.status(500).send('Internal Server Error');
    });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Server is running on http://localhost:8080');
});
