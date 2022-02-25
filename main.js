// Carregando módulos
    const express = require('express')
    const exphbs = require('express-handlebars')
    const bodyParser = require('body-parser')
    const app = express()
    const mongoose = require("mongoose")
    
    const session = require("express-session")
    const flash = require("connect-flash")

    const path = require('path')
    const admin = require("./routes/admin")
    const usuarios = require("./routes/usuario")

    require("./models/Postagem")
    require("./models/Categoria")
    const Postagem = mongoose.model("postagens")
    const Categoria = mongoose.model("categorias")
    const passport = require('passport')
    require("./config/auth")(passport)

// Configurações
    // Sessão
        app.use(session({
            secret: "123456",
            resave: true,
            saveUninitialized: true
        }))

        app.use(passport.initialize())
        app.use(passport.session())
        app.use(flash())
    // Middleware
        app.use((req, res, next) => {
        // Variáveis globais :
            res.locals.success_msg = req.flash("success_msg") 
            res.locals.error_msg = req.flash("error_msg")
            res.locals.error = req.flash("error")
            // Armazenando dados do usuário logado
            res.locals.user = req.user || null;
            next()
        })
    // Body Parser
        app.use(bodyParser.urlencoded({extended: false}))
        app.use(bodyParser.json())
            // talvez mude o bodyParser para express
    // HandleBars
        const hbs = exphbs.create({
            defaultLayout:'main'
        })
            app.engine('handlebars', hbs.engine)
            app.set('view engine', 'handlebars')
    // Mongoose
        mongoose.Promise = global.Promise
        mongoose.connect("mongodb://localhost/blogapp").then(() => {
            console.log("Conectado ao Mongo!")
        }).catch((err) => {
            console.log("Erro ao se Conectar..." + err)
        })
    

    // Public 
        app.use(express.static(path.join(__dirname + "/public")))
        
        app.use((req, res, next) => {
            console.log("Middleware aqui.")
            next()
        })
// Rotas
    app.get('/', (req, res) => {
        Postagem.find().populate("categoria").lean().sort({data: "desc"}).then((postagens) => {
            res.render("index", {postagens: postagens})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/404")
        })
    })

    app.get("/404", (req, res) => {
        res.send("Erro 404")
    })

    // Carregando postagem completa pelo botão
    app.get("/postagem/:slug", (req, res) => {
        
        const slug = req.params.slug

        Postagem.findOne({slug}).then((postagem) => {
            if(postagem) {
                const post = {
                    titulo: postagem.titulo,
                    data: postagem.data,
                    conteudo: postagem.conteudo
                }
                res.render("postagem/index", post)
            }else {
                req.flash("error_msg", "Esta postagem não existe")
                res.redirect("/")
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/")
        })
    })

    app.get("/categorias", (req, res) => {
        Categoria.find().lean().then((categorias) => {
            res.render("categorias/index", {categorias: categorias})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao listar as categorias")
            res.redirect("/")
        })
    })

    app.get("/categorias/:slug", (req, res) => {
        Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
            if(categoria) {

                Postagem.find({categoria:  categoria._id}).lean().then((postagens) => {
                    res.render("categorias/postagens", {postagens: postagens, categoria: categoria})
                }).catch((err) => {
                    req.flash("error_msg", "Houve um erro ao listar os posts")
                })
            }else {
                req.flash("error_msg", "Esta categoria não existe")
                res.redirect("/")
            }
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao carregar esta categoria")
            res.redirect("/")
        })
    })

    app.use('/admin', admin)
    app.use('/usuarios', usuarios)

//Outros
    const PORT = 8081
    app.listen(PORT, () => {
        console.log("Servidor Rodando!")
    })