const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 1. Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'API is running', model: 'RandomForest v1.0' });
});

// 2. Training Endpoint (Optional: Trigger retraining remotely)
app.post('/train', (req, res) => {
    const pythonProcess = spawn('python3', ['train_model.py', 'train']);
    
    pythonProcess.stdout.on('data', (data) => {
        console.log(`Training: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        if (code === 0) {
            res.json({ message: "Model training completed successfully." });
        } else {
            res.status(500).json({ error: "Training failed." });
        }
    });
});

// 3. Prediction Endpoint
app.post('/predict', (req, res) => {
    // Expecting JSON: { distance_from_home: 12.5, ... }
    const transactionData = req.body;

    // Validate input (Basic check)
    if (!transactionData) {
        return res.status(400).json({ error: "No transaction data provided" });
    }

    // Spawn Python process to predict
    // We pass the JSON data as a string argument to the script
    const pythonProcess = spawn('python', [
        'train_model.py', 
        'predict', 
        JSON.stringify(transactionData)
    ]);

    let dataString = '';

    // Collect data from script stdout
    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        try {
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (e) {
            console.error("Failed to parse Python output", dataString);
            res.status(500).json({ error: "Error processing prediction", details: dataString });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Ensure 'train_model.py' is in the same directory.`);
});
