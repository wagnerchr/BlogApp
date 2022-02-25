// Para guardar rotas de admin
const express = require('express')
const router = express.Router()

// Helper
    const {eAdmin} = require('../helpers/eAdmin')

// Carregando Mongoose
    const mongoose = require('mongoose')
    // Models
        require("../models/Categoria")
        const Categoria = mongoose.model("categorias")
        require("../models/Postagem")
        const Postagem = mongoose.model("postagens")

router.get('/', eAdmin, (req, res) => {
    res.render("admin/index")
})

router.get('/posts', eAdmin, (req, res) => {
    res.send("Rota de Posts")
})

router.get('/categorias', eAdmin, (req, res) => {

    Categoria.find().lean().sort({date: 'desc'}).then((categorias) => { 
        res.render("admin/categorias", {categorias: categorias})
    }).catch((err) => {
        req.flash("error_msg", "Houve um erro ao listar as categorias")
        res.redirect("/admin")
    })    
})

router.get('/categorias/add', eAdmin, (req, res) => {
    res.render("admin/addcategorias")
})

router.post('/categorias/nova', eAdmin, (req, res) => {
    // Validação de Formulário
        var erros = []
    // Campo Nome
        if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
            erros.push({texto: "Nome inválido"})
        }
        if(req.body.nome.length < 2) {
            erros.push({texto: "Nome da Categoria muito pequeno"})
        }
    // Campo Slug
        if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
            erros.push({texto: "Slug inválido"})
        }

        if(erros.length > 0) {
            res.render("admin/addcategorias", {erros: erros})
        } else {

            const novaCategoria = {
                // Campos de addcategorias
                nome: req.body.nome,
                slug: req.body.slug
            }
        
            new Categoria(novaCategoria).save().then(()=> {
                req.flash("success_msg", "Categoria criada com sucesso!")
               res.redirect("/admin/categorias")
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao salvar a categoria, tente novamente")
                res.redirect("/admin")
            })
        }
})

router.get("/categorias/edit/:id", eAdmin, (req, res) => {
    // Para os campos já estarem preenchidos no edit
        Categoria.findOne({_id:req.params.id}).lean().then((categoria) => {
            res.render("admin/editcategorias", {categoria: categoria})
        }).catch((err) => {
            req.flash("error_msg", "Está categoria não existe")
            res.redirect("/admin/categorias")
        })
})

router.post("/categorias/edit", eAdmin, (req, res) => {
    Categoria.findOne({ _id: req.body.id }).then((categoria) => {

    // Validando a Edição
        let erros = []

        if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
            erros.push({ texto: "Nome invalido" })
        }
        if (!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
            erros.push({ texto: "Slug invalido" })
        }
        if (req.body.nome.length < 2) {
            erros.push({ texto: "Nome da categoria muito pequeno" })
        }


        if (erros.length > 0) {
            Categoria.findOne({_id:req.body.id }).lean().then((categoria) => {
                res.render("admin/editcategorias", {categoria: categoria})
            }).catch((err) => {
                req.flash("error_msg", "Erro ao pegar os dados")
                res.redirect("admin/categorias")
            })
            
        } else {

    // Editando categoria
            categoria.nome = req.body.nome
            categoria.slug = req.body.slug

            categoria.save().then(() => {
                req.flash("success_msg", "Categoria editada com sucesso!")
                res.redirect("/admin/categorias")
            }).catch((err) => {
                req.flash("error_msg", "Erro ao salvar a edição da categoria")
                res.redirect("admin/categorias")
            })
        }
    }).catch((err) => {
        req.flash("error_msg", "Erro ao editar a categoria")
        req.redirect("/admin/categorias")
    })
})

router.post("/categorias/deletar", eAdmin, (req, res) => {
    Categoria.deleteOne({_id: req.body.id}).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso!")
        res.redirect("/admin/categorias")
    }).catch((err) => {
        req.flash("error_msg", "Falha ao deletar a categoria")
        res.redirect("/admin/categorias")
    })
})

// Postagens

    router.get("/postagens", eAdmin, (req, res) => {
        
        Postagem.find().lean().populate("categoria").sort({date:"desc"}).then((postagens) => {
            res.render("admin/postagens", {postagens: postagens})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao listar as postagens")
            res.redirect("/admin")
        })
    })

    router.get("/postagens/add", eAdmin, (req, res) => {
        Categoria.find().lean().then((categorias) => {
            res.render("admin/addpostagens", {categorias: categorias})
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao carregar o formulário")
            res.redirect("/admin/postagens")
        })
    })

    router.post("/postagens/nova", eAdmin, (req, res) => {
        var erros = []

        if(req.body.categoria == "0"){
            erros.push({texto: "Categoria inválida, registre uma categoria"})
        }

        if(erros.length > 0) {
            res.render("admin/addpostagem")
        }else {
            const novaPostagem = {
                titulo: req.body.titulo,
                slug: req.body.slug,
                descricao: req.body.descricao,
                conteudo: req.body.conteudo,
                categoria: req.body.categoria
            }

            new Postagem(novaPostagem).save().then(() =>{
                req.flash("success_msg", "Postagem criada com sucesso!")
                res.redirect("/admin/postagens")
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao criar a postagem")
                res.redirect("/admin/postagens")
            })
        }
    })

    router.get("/postagens/edit/:id", eAdmin, (req, res) => {
        Postagem.findOne({_id: req.params.id}).lean().then((postagem) => {
        // Buscando as Categorias
            Categoria.find().lean().then((categorias) => {

                res.render("admin/editpostagens", {categorias: categorias, postagem: postagem})


            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao listar as categorias")
                res.redirect("/admin/postagens")
            })

        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao carregar o formulário de edição")
            res.redirect("/admin/postagens")
        })
    })

    router.post("/postagem/edit", eAdmin, (req, res) => {

        Postagem.findOne({_id:req.body.id}).then((postagem) => {
            postagem.titulo = req.body.titulo,
            postagem.slug = req.body.slug,
            postagem.descricao = req.body.descricao,
            postagem.conteudo = req.body.conteudo,
            postagem.categoria = req.body.categoria

            postagem.save().then(() => {
                req.flash("success_msg", "Postagem editada com sucesso!")
                res.redirect("/admin/postagens")
            }).catch((err) => {
                req.flash("error_msg", "Houve um erro ao salvar a edição da postagem")
                res.redirect("/admin/postagens")
            })
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao salvar a edição")
            res.redirect("/admin/postagens")
        })
    })

    router.get("/postagens/deletar/:id", eAdmin, (req, res) => {
        Postagem.remove({_id: req.params.id}).then(() => {
            req.flash("success_msg", "Postagem deletada com sucesso!")
            res.redirect("/admin/postagens")
        }).catch((err) => {
            req.flash("error_msg", "Houve um erro ao deletar a postagem")
            res.redirect("/admin/postagens")
        })
    })
// Exportando
module.exports = router