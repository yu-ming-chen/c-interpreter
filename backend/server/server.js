require('ts-node').register();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs')
const app = express();
app.use(cors());

const { execute } = require('../interpreter/cinterpreter.ts');

var storage = multer.diskStorage(
    {
        destination: './uploads',
        filename: function ( req, file, cb ) {
            cb( null, file.originalname);
        }
    }
);
    
const upload = multer({ storage: storage });

app.post('/execute', upload.single('file'), (req, res) => {
    const code = fs.readFileSync('./uploads/main.c', 'utf8')
    // Create a buffer to capture console output
    let logBuffer = '';
    const logToBuffer = (message) => {
        logBuffer += message + '\n';
    };

    // Redirect console output to the buffer
    const originalLog = console.log;
    console.log = logToBuffer;
    
    // Execute the code and capture the result
    let result = null;
    try {
        result = execute(code);
    } catch (e) {
        console.log = originalLog;
        res.send({ result, consoleOutput: logBuffer, error: e.message });
        return
    }
    
    // Restore the original console log function
    console.log = originalLog;
    
    // Send the result and console output as the response
    res.send({ result: result, consoleOutput: logBuffer, error: null});
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
