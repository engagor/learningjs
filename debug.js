require('dotenv').config();

class Debug {
    static debugp(msg, depth) {
        if (process.env['VERBOSE'] !== true) {
            return;
        }

        let s = '';
        for (let i = 0; i < depth * 2; i++) {
            s += ' ';
        }
        console.log(s, msg);
    }
}

module.exports = Debug;
