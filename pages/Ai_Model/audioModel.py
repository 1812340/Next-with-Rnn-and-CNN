import sys
import json
import numpy as np
import librosa
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import load_img, img_to_array

# Load models
audio_model = load_model('C:/Users/Waqas/practicum/Pdiseases.h5')
image_model = load_model("C:/National college/Artificial Intelligence Driven Decision Making (MSCAI1)/tuberculosis.h5")

audio_classes = ["COPD", "Bronchiolitis", "Pneumonia", "URTI", "Healthy"]
image_classes = ['Normal', 'Tuberculosis']  # Adjust based on your image model's classes

def stretch(data, rate):
    return librosa.effects.time_stretch(data, rate=rate)

def gru_diagnosis_detection(audio_path, features=52, stretch_factor=1.2):
    # Load and preprocess the audio
    data_x, sampling_rate = librosa.load(audio_path)
    data_x = stretch(data_x, stretch_factor)

    # Extract MFCC features
    mfcc_features = np.mean(librosa.feature.mfcc(y=data_x, sr=sampling_rate, n_mfcc=features).T, axis=0)
    mfcc_features = mfcc_features.reshape(1, 1, -1)  # Reshape for model input

    # Make prediction
    test_pred = audio_model.predict(mfcc_features)
    
    # Get the predicted class and confidence
    predicted_class_index = np.argmax(test_pred[0])
    predicted_class = audio_classes[predicted_class_index]
    confidence = float(np.max(test_pred[0]) * 100)  # Convert to percentage

    return predicted_class, confidence

def image_diagnosis_detection(image_path):
    # Load and preprocess the image
    img = load_img(image_path, target_size=(150, 150))
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array /= 255.0  # Normalize the image

    # Make prediction
    prediction = image_model.predict(img_array)

    # Get the predicted class and confidence
    predicted_class_index = np.argmax(prediction[0])
    predicted_class = image_classes[predicted_class_index]
    confidence = float(np.max(prediction[0]) * 100)  # Convert to percentage

    return predicted_class, confidence

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <audio_path> <image_path>")
        sys.exit(1)

    audio_path = sys.argv[1]
    image_path = sys.argv[2]

    audio_disease, audio_confidence = gru_diagnosis_detection(audio_path)
    image_disease, image_confidence = image_diagnosis_detection(image_path)
    
    result = {
        "audio_diagnosis": {
            "predicted_disease": audio_disease,
            "confidence": audio_confidence
        },
        "image_diagnosis": {
            "predicted_disease": image_disease,
            "confidence": image_confidence
        }
    }
    
    print(json.dumps(result))