const request = require('supertest');
const expect = require('expect');
var mongoose = require('mongoose');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');

var idList = [];
const todos = [
    {
        text: "First todo message",
        _id: mongoose.Types.ObjectId('4edd40c86762e0fb12000003')
    },
    {
        text: "Second todo message",
        _id: mongoose.Types.ObjectId('4edd40c86762e0fb12000004')
    }
];

before((done) => {
    Todo.insertMany(todos, function (res) {
        // console.log(res);
    });
    done();
});

beforeEach((done) => {
    idList.forEach((id) => {
        Todo.findByIdAndRemove(id, () => { });
    });
    done();
});

describe('POST /todos', () => {
    it('Should create a new todo', function(done) {
        this.timeout(15000);
        var text = 'This is testing a new todo';

        request(app)
            .post('/todos')
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
                idList.push(res.body._id);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find({ text: text }).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((err) => {
                    done(err);
                });
            });
    });

    it('Should not create a new todo', (done) => {
        request(app)
            .post('/todos')
            .send({ text: '   ' })
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                done();
            })
    })
});

describe('GET /todos', () => {
    it('Should fetch all todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res) => {
                // console.log(res.body);
                // expect(res.body).to({text:"First todo message"});
            })
            .end(done);
    })
});


describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
            .get('/todos/4edd40c86762e0fb12000003')
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe('First todo message');
            })
            .end(done);
    });

    it('should return 404 if todo not found', (done) => {
        request(app)
            .get('/todos/4edd40c86762e0fb12000009')
            .expect(404)
            .end(done);
    });

    it('should return 404 for non object ids', (done) => {
        request(app)
            .get('/todos/1234')
            .expect(404)
            .end(done);
    });
});

after((done) => {
    todos.forEach((item) => {
        Todo.findOneAndRemove({ text: item.text }, function (result) { });
    })
    done();
});

