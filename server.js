const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 3000;

// Dummy users
const users = {
    yasser: 'debihi28',
    said: 'mohamed2003'
};

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check "stay logged in" cookie
app.use((req, res, next) => {
    if (!req.session.username && req.cookies['stay-logged-in']) {
        try {
            const decoded = Buffer.from(req.cookies['stay-logged-in'], 'base64').toString();
            const [username, hashedPassword] = decoded.split(':');

            if (users[username]) {
                const realHashed = crypto.createHash('md5').update(users[username]).digest('hex');
                if (hashedPassword === realHashed) {
                    req.session.username = username;
                }
            }
        } catch (err) {
            console.error("Invalid cookie format");
        }
    }
    next();
});


app.get('/', (req, res) => {
    if (req.session.username) {
        res.render('home', { username: req.session.username });
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

app.post('/login', (req, res) => {
    const { username, password, remember } = req.body;
    if (users[username] && users[username] === password) {
        req.session.username = username;

        if (remember) {
            const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
            const rawCookie = `${username}:${hashedPassword}`;
            const cookieValue = Buffer.from(rawCookie).toString('base64');
            res.cookie('stay-logged-in', cookieValue, { httpOnly: true });
        }

        res.redirect('/');
    } else {
        res.render('login', { error: '  إسم المستخدم أو كلمة المرور غير صحيحة ' });
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('stay-logged-in');
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
