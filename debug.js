class Debug {
    static debugp(msg, depth) {
        let s = '';
        for (let i = 0; i < depth * 2; i++) {
            s += ' ';
        }
        console.log(s, msg);
    }
}

module.exports = Debug;