const obj=require('./product');
const db=require('../util/database');
function findimagebyid(id) {
   return db.execute('select imageURL from products where id= ?' [this.id]);
         
         }

         module.exports=findimagebyid;