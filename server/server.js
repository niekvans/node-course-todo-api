var env = process.env.NODE_ENV || 'development';
const nodeEnvFIle = require('node-env-file');

if (env === 'development') {
    nodeEnvFIle(__dirname + '/../config/.env_dev');
} else if (env === 'test') {
    nodeEnvFIle(__dirname + './../config/.env_test');
} else if (env === 'production') {
    nodeEnvFIle(__dirname + './../config/.env_prd');
}

var express = require('express');
var bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');
const _ = require('lodash');

var { mongoose } = require('./db/mongoose');
var { Todo } = require('./models/todo');
var { User } = require('./models/user');
var { authenticate } = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
    var todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });

    todo.save().then((result) => {
        res.send(result);
    }, (error) => {
        res.status(400).send(error);
    });
});

app.get('/todos', authenticate, (req, res) => {
    Todo.find({ _creator: req.user._id })
        .then((todos) => {
            res.send({ todos });
        }).catch((error) => {
            // console.log('Could not fetch todos', error);
            res.status(400).send(error);
        });
});

app.get('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {
        // console.log('Not valid ID');
        return res.status(404).send();
    }

    Todo.findOne({ _id: id, _creator: req.user._id })
        .then((todo) => {
            if (todo) {
                return res.status(200).send({ todo });
            }
            else {
                // console.log('Valid but not found');
                return res.status(404).send();
            }
        }).catch((error) => {
            res.status(400).send();
        });

});

app.delete('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Todo.findOneAndRemove({ _id: id, _creator: req.user._id })
        .then((todo) => {
            if (todo) {
                return res.status(200).send({ todo });
            }
            else {
                return res.status(404).send();
            }
        })
        .catch((error) => {
            res.status(400).send();
        });
});

app.patch('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
    var body = _.pick(req.body, ['text', 'completed']);

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    }
    else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findOneAndUpdate({ _id: id, _creator: req.user._id }, { $set: body }, { new: true })
        .then((todo) => {
            if (!todo) {
                return res.status(404).send();
            }
            res.send({ todo });
        })
        .catch((error) => {
            res.status(400).send();
        })
});

app.post('/users', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);
    var user = new User(body);

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        res.header('x-auth', token).send(user);
    })
        .catch((error) => {
            // console.log(error);
            res.status(400).send(error);
        })
});



app.get('/users/me', authenticate, (req, res) => {

    res.send(req.user);

});

app.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password)
        .then((user) => {
            return user.generateAuthToken().then((token) => {
                res.header('x-auth', token).send(user);
            });
            res.send(user);
        })
        .catch((error) => {
            res.status(400).send();
        });
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token)
        .then(() => {
            res.send();
        })
        .catch((error) => {
            res.status(400).send();
        });
});

app.listen(port, () => {
    console.log(`Started on port ${port}`);
});

module.exports = { app };