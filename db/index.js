require('dotenv').config();

const mongoose = require('mongoose');

class Database {
    constructor(parameters) {
        this._connect();
    }

    _connect() {
        mongoose
            .connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
            .then(() => {
                console.log('Database connection successful');
            })
            .catch((err) => {
                console.error(err);
                console.log('Database connection error');
            });
    }
}

module.exports = new Database();
