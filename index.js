import express from "express";
import path from "path"
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

mongoose.connect("mongodb://127.0.0.1:27017", {
  dbName: "backend",
}).then(()=> {console.log("Database Connected")})
.catch((e)=>{console.log(e)})


const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema)

const app = express();


app.use(express.static(path.join(path.resolve(), "public")))
app.use(express.urlencoded({extended: true}))

app.use(cookieParser());

app.set("view engine", "ejs");


const isAuthenticated = async (req, res, next) => {
  const {token} = req.cookies;

  if (token){
    const decoded = jwt.verify(token, "dhsbhncjcjdj")

    req.user = await User.findById(decoded._id);

    next();
  } else {
    res.redirect("/login");
  }

}

app.get("/", isAuthenticated, (req, res) => {
  
  res.render("logout", {name: req.user.name})
  
})

app.get("/login", (req, res) => {

  res.render("login")
  
})




app.get("/register", (req, res) => {

  res.render("register")
  
})

app.post("/login", async (req, res)=> {
  const {email, password} = req.body;

  let user = await User.findOne({email});

  if (!user){
    res.redirect("/register");
  } if (user){
    if (user.password !== password){
      console.log("Password is incorrect");
      res.render("login", {email, message: "Password is incorrect!"});
    } else {
      console.log("Logged in successfully");
      const token = jwt.sign({_id: user._id}, "dhsbhncjcjdj");

      res.cookie("token",token, {
        httpOnly: true, expires: new Date(Date.now()+60*1000)
  });
  res.redirect("/");

}
}
})

app.post("/register", async (req, res)=> {

  const {email, name, password} = req.body;

  let user = await User.findOne({email})

  if (user){
    return res.redirect("/login");
  }
  user = await User.create({
    name,
    email,
    password
  });

  const token = jwt.sign({_id: user._id}, "dhsbhncjcjdj");

  res.cookie("token",token, {
    httpOnly: true, expires: new Date(Date.now()+60*1000)
  });

  res.redirect("/")
})

app.get("/logout", (req, res)=> {
  res.cookie("token", null, {
    httpOnly: true, expires: new Date(Date.now())
  });

  res.redirect("/")
})







app.listen(5000, () => {
  console.log("Server running on port 5000.")
})