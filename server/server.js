var express = require('express');
var bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

var { mongoose } = require('./db/mongoose');
var { Todo } = require('./models/todo');
var { User } = require('./models/user');

var app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    var todo = new Todo({
        text: req.body.text
    });

    todo.save().then((result) => {
        res.send(result);
    }, (error) => {
        res.status(400).send(error);
    });
});

app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
        res.send(todos);
    }).catch((error) => {
        console.log('Could not fetch todos', error);
        res.status(400).send(error);
    });
});

app.get('/todos/:id', (req, res) => {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {
        console.log('Not valid ID');
        return res.status(404).send();
    }

    Todo.findById(id).then((todo) => {
        if (todo) {
            return res.status(200).send({todo});
        }
        else {
            console.log('Valid but not found');
            return res.status(404).send();
        }
    }).catch((error) => {
        res.status(400).send();
    })

})

app.listen(3000, () => {
    console.log('Started on port 3000');
})

module.exports = { app };