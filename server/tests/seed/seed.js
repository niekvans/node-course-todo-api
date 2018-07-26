const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { User } = require('./../../models/user');
const { Todo } = require('./../../models/todo');

const userOneId = mongoose.Types.ObjectId();
const userTwoId = mongoose.Types.ObjectId();

const users = [
    {
        _id: userOneId,
        email: 'niek@niek.nl',
        password: 'userOnePass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({ _id: userOneId, access: 'auth' },'abc123').toString()
        }]
    },
    {
        _id: userTwoId,
        email: 'niek2@niek.nl',
        password: 'userTwoPass'
    }
]

const todos = [
    {
        text: "First todo message",
        _id: mongoose.Types.ObjectId('4edd40c86762e0fb12000003')
    },
    {
        text: "Second todo message",
        _id: mongoose.Types.ObjectId('4edd40c86762e0fb12000004')
    },
    {
        text: "Third todo message",
        _id: mongoose.Types.ObjectId('4edd40c86762e0fb12000005'),
        completed: true,
        completedAt: 123445678
    }
];

const populateTodos = function (done) {
    this.timeout(10000);
    Todo.remove({}).then(() => {
        return Todo.insertMany(todos)
    }).then(() => {
        done()
    });
};

const populateUsers = function(done){
    this.timeout(10000);
    User.remove({}).then(()=>{
        users.forEach((user)=>{
            new User(user).save();
        });

        return Promise.all(users);
    }).then(()=>{
        done();
    });
};

module.exports = { todos, populateTodos, users, populateUsers };