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
    },
    {
        text: "Third todo message",
        _id: mongoose.Types.ObjectId('4edd40c86762e0fb12000005'),
        completed: true,
        completedAt: 123445678
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
    it('Should create a new todo', function (done) {
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

describe('DELETE /todos/:id', () => {
    it('should remove a todo', (done) => {
        var id = '4edd40c86762e0fb12000004';
        request(app)
            .delete(`/todos/${id}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe('Second todo message');
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(id).then((todo) => {
                    expect(todo).toBeNull();
                    done();
                }).catch((error) => {
                    done(error);
                })
            });
    });

    it('should return 404 if todo not found', (done) => {
        request(app)
            .delete('/todos/5b446fe4496ba24be01e508c')
            .expect(404)
            .end(done);
    });

    it('should return 404 if object id is invalid', (done) => {
        request(app)
            .delete('/todos/12345abc')
            .expect(404)
            .end(done);
    });
});

describe('PATCH /todos/id', () => {
    it('should update the todo', (done) => {
        var id = '4edd40c86762e0fb12000003';
        var newText = 'New text after the patch';
        request(app)
            .patch(`/todos/${id}`)
            .send({ text: newText, completed: true })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(newText)
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(id).then((todo) => {
                    expect(todo.text).toBe(newText);
                    expect(todo.completed).toBe(true);
                    expect(todo.completedAt).toBeGreaterThan(0);
                    done();
                }).catch((err) => {
                    done(err);
                });

            });


    });

    it('should clear completedAt when todo is not completed', (done) => {
        var id = '4edd40c86762e0fb12000005';
        var newText = 'After the update';
        request(app)
            .patch(`/todos/${id}`)
            .send({ text: newText })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe(newText);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(id).then((todo) => {
                    expect(todo.text).toBe(newText);
                    expect(todo.completed).toBe(false);
                    expect(todo.completedAt).toBeNull();
                    done();
                }).catch((err) => {
                    done(err);
                });
            });
    });
});

after((done) => {
    todos.forEach((item) => {
        Todo.findByIdAndRemove(item._id, function (result) { });
    })
    done();
});

