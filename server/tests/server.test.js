const request = require('supertest');
const expect = require('expect');
var mongoose = require('mongoose');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');
const { User } = require('./../models/user');
const { todos, populateTodos, users, populateUsers } = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
    it('Should create a new todo', function (done) {
        this.timeout(15000);
        var text = 'This is testing a new todo';

        request(app)
            .post('/todos')
            .set('x-auth', users[0].tokens[0].token)
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);

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
            .set('x-auth', users[0].tokens[0].token)
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
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    })
});


describe('GET /todos/:id', () => {
    it('should return todo doc', (done) => {
        request(app)
            .get('/todos/4edd40c86762e0fb12000003')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe('First todo message');
            })
            .end(done);
    });

    it('should not return todo doc for different user', (done) => {
        request(app)
            .get('/todos/4edd40c86762e0fb12000004')
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 if todo not found', (done) => {
        request(app)
            .get('/todos/4edd40c86762e0fb12000009')
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 for non object ids', (done) => {
        request(app)
            .get('/todos/1234')
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe('DELETE /todos/:id', () => {
    it('should remove a todo', (done) => {
        var id = '4edd40c86762e0fb12000004';
        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo.text).toBe('Second todo message');
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(id).then((todo) => {
                    expect(todo).toBeFalsy();
                    done();
                }).catch((error) => {
                    done(error);
                })
            });
    });

    it('should not remove a todo user does not own', (done) => {
        var id = '4edd40c86762e0fb12000004';
        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end((err) => {
                if (err) {
                    return done(err);
                }

                Todo.findById(id).then((todo) => {
                    expect(todo).toBeTruthy();
                    done();
                }).catch((error) => {
                    done(error);
                })
            });
    });

    it('should return 404 if todo not found', (done) => {
        request(app)
            .delete('/todos/5b446fe4496ba24be01e508c')
            .set('x-auth', users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it('should return 404 if object id is invalid', (done) => {
        request(app)
            .delete('/todos/12345abc')
            .set('x-auth', users[0].tokens[0].token)
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
            .set('x-auth', users[0].tokens[0].token)
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

    it('should not update the todo for different user', (done) => {
        var id = '4edd40c86762e0fb12000003';
        var newText = 'New text after the patch';
        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[1].tokens[0].token)
            .send({ text: newText, completed: true })
            .expect(404)
           .end(done);
    });

    it('should clear completedAt when todo is not completed', (done) => {
        var id = '4edd40c86762e0fb12000005';
        var newText = 'After the update';
        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', users[0].tokens[0].token)
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
                    expect(todo.completedAt).toBeFalsy();
                    done();
                }).catch((err) => {
                    done(err);
                });
            });
    });
});

describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((result) => {
                expect(result.body._id).toBe(users[0]._id.toHexString());
                expect(result.body.email).toBe(users[0].email);
            })
            .end(done);
    });

    it('should return a 401 when not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((result) => {
                expect(result.body).toEqual({})
            })
            .end(done);
    });
});

describe('POST /users', () => {
    it('should create a new user', (done) => {
        var email = 'niek_post@niek.nl';
        var password = 'something';
        request(app)
            .post('/users')
            .send({ email, password })
            .expect(200)
            .expect((res) => {
                expect(res.body.email).toBe('niek_post@niek.nl');
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body._id).toBeTruthy();
            })
            .end((error) => {
                if (error) {
                    return done(error);
                }

                User.findOne({ email }).then((user) => {
                    expect(user.email).toBe(email);
                    expect(user.password).not.toBe(password);
                    done();
                }).catch((error) => {
                    done(error);
                })
            });
    });

    it('should return validation error for wrong email', (done) => {
        var email = 'niek.niek.nl';
        var password = 'sjfkej1243j!';

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(400)
            .end(done);
    });

    it('should return validation error for short password', (done) => {
        var email = 'someone@me.nl';
        var password = '1';

        request(app)
            .post('/users')
            .send({ email, password })
            .expect(400)
            .end(done);
    });

    it('should return validation error for user in use', (done) => {
        request(app)
            .post('/users')
            .send({
                email: users[0].email,
                password: 'somepasshere@#!'
            })
            .expect(400)
            .end(done);
    })
});

describe('POST /users/login', () => {
    it('should login and return auth token', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: users[1].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body.email).toBe(users[1].email);
                expect(res.body._id).toBeTruthy();
            })
            .end((error, res) => {
                if (error) {
                    return done(error);
                }

                User.findById(users[1]._id).then((user) => {
                    // expect(user.tokens[1]).toHaveProperty('access', 'auth');
                    // expect(user.tokens[1]).toHaveProperty('token', res.headers['x-auth']);
                    expect(user.toObject().tokens[1]).toMatchObject({
                        'access':'auth',
                        'token': res.headers['x-auth']
                    })
                    done();
                }).catch((error) => {
                    done(error);
                })
            });
    });

    it('should reject an invalid login', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[0].email,
                password: 'blablsldkj2348j'
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeFalsy();
            })
            .end((error, res) => {
                if (error) {
                    return done(error);
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(1);
                    done();
                }).catch((error) => {
                    done(error);
                })
            });
    });
});

describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((error) => {
                if (error) {
                    return done(error);
                }
                User.findById(users[0]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch((error) => {
                    done(error);
                })
            });
    });
});
