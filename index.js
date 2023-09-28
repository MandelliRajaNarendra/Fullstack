const express = require('express');
const app = express();
const port = 5040;
var passwordHash = require("password-hash")
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded ({ extended : false}));

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore , Filter} = require('firebase-admin/firestore');

var serviceAccount = require("./data collection.json");


initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
app.set("view engine", "ejs");

app.get('/signup', (req, res) => {
  res.render("signup");
});
app.post("/signuppage", (req, res) => {
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const password = req.body.password;

  const hashedPassword = passwordHash.generate(password);

  db.collection ("data")
  .where(
    Filter.or(
      Filter.where("Email", "==" , req.body.email),
      Filter.where("Name" , "==" , req.body.first_name + last_name)
    )
  )
  .get() 
  .then ((docs) => {
    if (docs.size > 0) {
      res.send("This account is already exists");
    } else {
      db.collection("data") 
      .add ({
        Name: first_name + last_name,
        Email: email,
        Password: hashedPassword,
      })
      .then(() => {
        res.send("Signup is succesfull");
      });
    
    };
  })
})


app.get('/login', (req, res) => {
  res.render("login");
});


app.post('/loginsubmit', (req, res) => {
  const Email = req.body.email;
  const Password = req.body.password;

  db.collection('data')
    .where('Email', '==', Email)
    .get()
    .then((docs) => {
      if (docs.size === 1) {
        const userDoc = docs.docs[0];
        const userData = userDoc.data();

        if (passwordHash.verify(Password, userData.Password)) {
          res.render('home', { userData: userData });
        } else {
          res.send('Login failed');
        }
      } else {
        res.send('This account is already exist ');
      }
    })
    .catch((error) => {
      res.status(500).send('Error logging in: ' + error);
    });
});

app.get('/about', (req, res) => {
  res.render(__dirname + "/views" + "/about.ejs" );
});

app.get('/contact', (req, res) => {
  res.render(__dirname + "/views" + "/contact.ejs");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})