import sys
import json
import random
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
import os

# --- Configuration ---
MODEL_FILE = 'fraud_model.pkl'

def generate_dummy_data(num_samples=1000):
    """Generates synthetic credit card transaction data."""
    data = []
    for _ in range(num_samples):
        distance_from_home = random.uniform(0, 1000)
        distance_from_last_transaction = random.uniform(0, 500)
        ratio_to_median_purchase_price = random.uniform(0, 20)
        repeat_retailer = random.choice([0, 1])
        used_chip = random.choice([0, 1])
        used_pin_number = random.choice([0, 1])
        online_order = random.choice([0, 1])
        
        # Simple heuristic for "fraud" to make the model learnable
        # Fraud is likely if: High ratio to median price AND online order AND (no chip OR high distance)
        is_fraud = 0
        if ratio_to_median_purchase_price > 8 and online_order == 1:
            is_fraud = 1
        if distance_from_home > 800 and used_chip == 0:
            is_fraud = 1
            
        # Add some noise
        if random.random() < 0.05:
            is_fraud = 1 - is_fraud

        data.append([
            distance_from_home,
            distance_from_last_transaction,
            ratio_to_median_purchase_price,
            repeat_retailer,
            used_chip,
            used_pin_number,
            online_order,
            is_fraud
        ])
    
    columns = [
        'distance_from_home', 'distance_from_last_transaction', 
        'ratio_to_median_purchase_price', 'repeat_retailer', 
        'used_chip', 'used_pin_number', 'online_order', 'fraud'
    ]
    return pd.DataFrame(data, columns=columns)

def train():
    """Trains the model and saves it to a file."""
    print("Generating synthetic data...")
    df = generate_dummy_data()
    
    X = df.drop('fraud', axis=1)
    y = df['fraud']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Classifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    print(f"Model Accuracy: {accuracy_score(y_test, y_pred):.2f}")
    
    print(f"Saving model to {MODEL_FILE}...")
    joblib.dump(clf, MODEL_FILE)
    print("Training complete.")

def predict(input_data):
    """Loads model and predicts on single input."""
    if not os.path.exists(MODEL_FILE):
        return {"error": "Model not found. Please train first."}
    
    clf = joblib.load(MODEL_FILE)
    
    # input_data is expected to be a list of feature values in correct order
    # Example: [10.5, 2.3, 4.5, 1, 1, 0, 1]
    prediction = clf.predict([input_data])[0]
    probability = clf.predict_proba([input_data])[0][1] # Probability of fraud (class 1)
    
    return {
        "is_fraud": int(prediction),
        "fraud_probability": float(probability),
        "status": "FRAUD DETECTED" if prediction == 1 else "Clean"
    }

if __name__ == "__main__":
    # Check if we are in 'train' mode or 'predict' mode
    if len(sys.argv) > 1 and sys.argv[1] == 'train':
        train()
    elif len(sys.argv) > 1 and sys.argv[1] == 'predict':
        # Parse JSON input from command line argument
        try:
            input_json = json.loads(sys.argv[2])
            features = [
                input_json.get('distance_from_home', 0),
                input_json.get('distance_from_last_transaction', 0),
                input_json.get('ratio_to_median_purchase_price', 0),
                input_json.get('repeat_retailer', 0),
                input_json.get('used_chip', 0),
                input_json.get('used_pin_number', 0),
                input_json.get('online_order', 0)
            ]
            result = predict(features)
            print(json.dumps(result)) # Print JSON to stdout for Node.js to capture
        except Exception as e:
            print(json.dumps({"error": str(e)}))
    else:
        print("Usage: python train_model.py [train|predict] [data_json]")
