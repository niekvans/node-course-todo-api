const MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, client) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server');
    }
    console.log('Connected to MongoDB server');
    const db = client.db('TodoApp');
    // const users = client.db('Users');

    db.collection('Todos').insertOne({
        text: 'Something to do',
        completed: false
    }, (err, result) => {
        if (err) {
            return console.log('Unable to insert todo', err);
        }
        console.log(JSON.stringify(result.ops, undefined, 2));
    });

    db.collection('Users').insertOne({
        name: 'Niek van Staveren',
        age: 31,
        location: 'Malmö, Sweden'
    }, (err, result) => {
        if (err) {
            return console.log('Unable to inser User', err);
        }
        console.log(JSON.stringify(result.ops));
    });

    client.close();
});