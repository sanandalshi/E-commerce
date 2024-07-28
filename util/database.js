const mysql=require('mysql2');
const pool=mysql.createPool({
host:'localhost',
user:'root',
database:'node-complete',
password:'Wj28@krhps'



});
module.exports=pool.promise();