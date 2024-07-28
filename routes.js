const b=require('./models/product');
const c=require('./models/function');
const d=require('./models/cart');
const db=require('./util/database');
const login=require('./login');
const express = require('express');
const p = require('path');
const app = express.Router();
// const exphbs = require('express-handlebars');
// const { redirect } = require('statuses');
// const hbs = exphbs.create({
//   extname: '.handlebars',  
//   defaultLayout: false     
// });

app.use(login);
// app.engine('handlebars', hbs.engine);
// app.set('view engine', 'handlebars');


// app.set('views', p.join(__dirname, 'views'));


app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res, next) => {
    // Serve the HTML file
    res.sendFile(p.join(__dirname, 'h.html'));
});

app.post('/p', (req, res, next) => {
    const { name, password } = req.body;
   let obj={
    name:name,
    title:'title page',
    body:'bookshop near you!',

   }
   res.render('practise',obj);
});

app.post('/carti', (req, res, next) => {
    const { name, password } = req.body;
    res.send(`<h1>THE NAME OF THE CLIENT IS: ${name} AND PASSWORD IS: ${password}</h1>`);
});

app.post('/buy',(req,res)=>{
  let image = req.body.image;  
  let title = req.body.title;  
  
  res.send(`<h1>${title}</h1> <img src="${image}" alt="${title}"/>`);
  
   
});

app.post('/home', (req, res, next) => {
 console.log(req.get('Cookie').split('=')[1])
  
    db.execute('select * from products')
      .then(([rows, fields]) => {
        // Create an array of product objects to send to the template
        let products = rows.map(row => ({
          yo: true,
          title: row.title,  // Accessing the properties of the row object
          id: row.id,
          image: row.imageURL
        }));
  
        // Render the 'home' template with the products array
        res.render('home', { products });
      })
      .catch(err => {
        // Handle any errors from the database query
        console.error(err);
        res.status(500).send('Internal Server Error');
      });
  });
  
  
// rows.forEach(row => {
//     console.log(row.title);
//   });
app.post('/addproduct',(req,res)=>{
   
    res.sendFile(p.join(__dirname,'add.html'));
})
app.post('/adding', (req, res) => {
    
    let idi=req.body.id.toString();
   let ts=req.body.title.toString();
   let is=req.body.image;

   db.execute('INSERT INTO products (id, title, imageURL) VALUES (?, ?, ?)', [idi, ts, is]).then(result=>{console.log('ho gaya!')}).catch(err=>{console.log("err")});
    res.send('the product has been added');
});

app.post('/product/:id/:title',(req,res)=>{
   let object={
id:req.params.id,
title:req.params.title,
image:req.body.image,
   };

res.render('datail',object);


})

app.post('/cart',(req,res)=>{

let a=req.body.id;
let b=req.body.title;
let c=req.body.image;
d.arr.push({id:a,title:b,image:c});

console.log('id :'+a+'title:'+b);
})
app.get('/cartarray',(req,res)=>{
console.log(d.arr);

res.render('cart',d);


})



app.use((req, res, next) => {
    res.status(404).sendFile(p.join(__dirname, '404.html'));
});
module.exports=app;




