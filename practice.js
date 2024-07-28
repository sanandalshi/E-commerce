let express = require('express');
let bp=require('body-parser');
let p=require('path');
let pug=require('pug');
let app = express();
app.set('view engine','pug');
app.use(bp.urlencoded({ extended: true })); // to parse URL-encoded data
app.use(bp.json());
app.get('/', (req, res, next) => {

   // res.sendFile(p.join(__dirname,'./h.html'));
   res.render(
    'h',{title: 'pug',h1:'hi! my name is sanand alshi!'}
   )
});

app.post('/p', (req, res, next) => {
    const {name,password}=req.body;
    res.send('<h1>THIS IS TITLE PAGE:</h1>');
   

});
app.post('/cart', (req, res, next) => {
    const {name,password}=req.body;
    res.send('<h1>THE NAME OF THE CLIENT IS :'+name+' AND PASSWORD IS : '+password+'</h1>');
  

});
app.use((req,res,next)=>{
    res.status(404).sendFile(p.join(__dirname,'./404.html'));
})

app.listen(8080, () => {
    console.log('Server is running on port 8080');

});
