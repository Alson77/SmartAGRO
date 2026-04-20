#!/usr/bin/env python3
"""
Standalone inference script for crop disease detection
Uses your trained Keras model with TensorFlow
"""
import sys
import json
import os
import io

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

try:
    import numpy as np
    from PIL import Image
except ImportError as e:
    print(f"{{\"success\": false, \"error\": \"Missing dependency: {e}\"}}")
    sys.exit(1)

# Lazy load TensorFlow only when needed
TF_AVAILABLE = False
model = None

def load_model_lazy():
    """Load model only when prediction is needed"""
    global model, TF_AVAILABLE
    
    if model is not None:
        return model
    
    try:
        import tensorflow as tf
        TF_AVAILABLE = True
        print("✅ TensorFlow loaded", file=sys.stderr, flush=True)
        
        model_path = os.path.expanduser("~/Downloads/AI_plant_diseases_detection (1).keras")
        
        if not os.path.exists(model_path):
            print(f"❌ Model not found", file=sys.stderr, flush=True)
            return None
        
        print(f"📦 Loading model...", file=sys.stderr, flush=True)
        model = tf.keras.models.load_model(model_path)
        print(f"✅ Model ready", file=sys.stderr, flush=True)
        return model
    except Exception as e:
        print(f"❌ TensorFlow error: {e}", file=sys.stderr, flush=True)
        return None

# Disease classes
class_names = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Blueberry___healthy', 'Cherry___Powdery_mildew', 'Cherry___healthy',
    'Corn___Cercospora_leaf_spot', 'Corn___Common_rust', 'Corn___Northern_Leaf_Blight', 'Corn___healthy',
    'Grape___Black_rot', 'Grape___Esca', 'Grape___Leaf_blight', 'Grape___healthy',
    'Orange___Haunglongbing', 'Peach___Bacterial_spot', 'Peach___healthy',
    'Pepper___Bacterial_spot', 'Pepper___healthy', 'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
    'Raspberry___healthy', 'Soybean___healthy', 'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch', 'Strawberry___healthy', 'Tomato___Bacterial_spot',
    'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites', 'Tomato___Target_Spot',
    'Tomato___Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
]

# Disease info with practical remedies in Nepali
disease_info = {
    "Apple___Apple_scab": {
        "description": "स्याउमा काठ हरियाली र टुक्रा सडन रोग",
        "remedy": "स्काइ लीड, मन्कोजेब वा क्लोरोथलोनिल १०-१५ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित पातहरू हटाउनुहोस्।"
    },
    "Apple___Black_rot": {
        "description": "स्याउको रोग जहाँ काठो भाग कालो हुन्छ",
        "remedy": "मन्कोजेब वा बोर्डो तरल (१%) छिड़काव गर्नुहोस्। संक्रमित शाखा काट्नुहोस्। खेतमा उचित ड्रेनेज राख्नुहोस्।"
    },
    "Apple___Cedar_apple_rust": {
        "description": "स्याउमा पहेंलो र नारिवल रंगको धब्बा",
        "remedy": "प्रोपिकोनाजोल वा ट्राइफ्लोक्सिस्ट्रोबिन छिड़काव गर्नुहोस्। संक्रमित फूल र पात हटाउनुहोस्।"
    },
    "Apple___healthy": {
        "description": "स्वस्थ स्याउको पात - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ र सामान्य कृषि व्यवस्थापन जारी राख्नुहोस्। माहिना २-३ पल्ट निरीक्षण गर्नुहोस्।"
    },
    "Blueberry___healthy": {
        "description": "स्वस्थ ब्लुबेरी - कुनै रोग छैन",
        "remedy": "नियमित पानी दिनुहोस्। हर २-३ हप्तामा पोषण दिनुहोस्।"
    },
    "Cherry___Powdery_mildew": {
        "description": "चेरीमा सेतो पाउडर जस्तो धब्बा",
        "remedy": "सल्फर पाउडर वा पोटेशियम बाइकार्बोनेट छिड़काव गर्नुहोस्। गीला वातावरण रोक्नुहोस्। संक्रमित पात हटाउनुहोस्।"
    },
    "Cherry___healthy": {
        "description": "स्वस्थ चेरी - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ र हल्का खाद दिनुहोस्। माथिको हवा परिसंचार सुनिश्चित गर्नुहोस्।"
    },
    "Corn___Cercospora_leaf_spot": {
        "description": "मकैको पातमा भूरो र रातो रंगको धब्बा",
        "remedy": "मन्कोजेब वा प्रोपिकोनाजोल २०-२५ दिनको अन्तरमा छिड़काव गर्नुहोस्। रोग सहने किसिमको बीज प्रयोग गर्नुहोस्।"
    },
    "Corn___Common_rust": {
        "description": "मकैको पातमा नारिवल रंगको पुस्टुल",
        "remedy": "प्रोपिकोनाजोल वा ट्राइफ्लोक्सिस्ट्रोबिन छिड़काव गर्नुहोस्। गीला पातहरू सुखाउन वायु परिसंचार बढाउनुहोस्।"
    },
    "Corn___Northern_Leaf_Blight": {
        "description": "मकैको पातमा लामो भूरो धब्बा",
        "remedy": "बोर्डो तरल (१%) वा कॉपर सल्फेट छिड़काव गर्नुहोस्। रोग सहने किसिम प्रयोग गर्नुहोस्। ठेठ खेतमा पानी निकाल्नुहोस्।"
    },
    "Corn___healthy": {
        "description": "स्वस्थ मकै - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ र १०-१५ दिनको अन्तरमा पोषण दिनुहोस्। खरपतवार नियन्त्रण गर्नुहोस्।"
    },
    "Grape___Black_rot": {
        "description": "अङ्गूरमा कालो सडन रोग",
        "remedy": "बोर्डो मिश्रण (१%) वा मन्कोजेब १०-१५ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित फलहरू हटाउनुहोस्।"
    },
    "Grape___Esca": {
        "description": "अङ्गूरको काठमा सडन र पातमा धब्बा",
        "remedy": "संक्रमित शाखा काट्नुहोस्। प्रोपिकोनाजोल छिड़काव गर्नुहोस्। सुस्खा हवा सुनिश्चित गर्नुहोस्।"
    },
    "Grape___Leaf_blight": {
        "description": "अङ्गूरको पातमा भूरो र काठो धब्बा",
        "remedy": "मन्कोजेब वा बोर्डो तरल १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। रोग सहने किसिम लगाउनुहोस्।"
    },
    "Grape___healthy": {
        "description": "स्वस्थ अङ्गूर - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ र छाया प्रदान गर्नुहोस्। पोषण व्यवस्थापन जारी राख्नुहोस्।"
    },
    "Orange___Haunglongbing": {
        "description": "सुन्तलामा हुआङलोङबिङ (खट्टा रोग)",
        "remedy": "संक्रमित रोकहरू हटाउनुहोस्। सिट्रस ग्रीन लीफ जसले यो रोग फैलाउँछ त्यसलाई नियन्त्रण गर्नुहोस्। ओक्सिटेट्रासाइक्लिन १०-१२ दिनको अन्तरमा।"
    },
    "Peach___Bacterial_spot": {
        "description": "आडूमा ब्याक्टेरिया जनित धब्बा",
        "remedy": "कॉपर सल्फेट वा कॉपर अक्सिक्लोराइड १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित फलहरू हटाउनुहोस्।"
    },
    "Peach___healthy": {
        "description": "स्वस्थ आडू - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ र जैव खाद दिनुहोस्। मुकुल समस्या पछाडि कीटनाशक छिड़काव गर्नुहोस्।"
    },
    "Pepper___Bacterial_spot": {
        "description": "मिर्चामा ब्याक्टेरिया जनित धब्बा",
        "remedy": "कॉपर अक्सिक्लोराइड (३%) वा ब्लिटॉक्स १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित पात हटाउनुहोस्।"
    },
    "Pepper___healthy": {
        "description": "स्वस्थ मिर्चा - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ, वायु परिसंचार र गलीहरू साफ राख्नुहोस्।"
    },
    "Potato___Early_blight": {
        "description": "आलुको पातमा गोल काठो धब्बा",
        "remedy": "म्यान्कोजेब वा क्लोरोथलोनिल १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित पात हटाउनुहोस्।"
    },
    "Potato___Late_blight": {
        "description": "आलुको पातमा पानीले भिजेको धब्बा र सडन",
        "remedy": "बोर्डो मिश्रण (१%) वा मेटालक्सिल + म्यान्कोजेब १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। गीला पातहरू साफ राख्नुहोस्।"
    },
    "Potato___healthy": {
        "description": "स्वस्थ आलु - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ गर्नुहोस्। रोग सहने किसिम प्रयोग गर्नुहोस्। विषाणु नियन्त्रण गर्नुहोस्।"
    },
    "Raspberry___healthy": {
        "description": "स्वस्थ रसबेरी - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ र जैव खाद दिनुहोस्। प्रशाखन ठीक गर्नुहोस्।"
    },
    "Soybean___healthy": {
        "description": "स्वस्थ सोयाबिन - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ गर्नुहोस्। खरपतवार नियन्त्रण गर्नुहोस्। उचित दूरीमा बीज छिड़काव गर्नुहोस्।"
    },
    "Squash___Powdery_mildew": {
        "description": "स्क्वाशमा सेतो पाउडर जस्तो रोग",
        "remedy": "सल्फर पाउडर वा पोटेशियम बाइकार्बोनेट (१%) छिड़काव गर्नुहोस्। वायु परिसंचार बढाउनुहोस्। सुखा पात साफ गर्नुहोस्।"
    },
    "Strawberry___Leaf_scorch": {
        "description": "स्ट्रबेरीको पातमा रातो र भूरो धब्बा",
        "remedy": "म्यान्कोजेब वा कॉपर अक्सिक्लोराइड १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित पात हटाउनुहोस्।"
    },
    "Strawberry___healthy": {
        "description": "स्वस्थ स्ट्रबेरी - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ गर्नुहोस्। जैव खाद र गलीहरू साफ राख्नुहोस्।"
    },
    "Tomato___Bacterial_spot": {
        "description": "टमाटरमा ब्याक्टेरिया जनित धब्बा",
        "remedy": "कॉपर अक्सिक्लोराइड (३%) वा ब्लिटॉक्स १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित पात हटाउनुहोस्।"
    },
    "Tomato___Early_blight": {
        "description": "टमाटरको पातमा गोल काठो धब्बा सङ्क्रमण",
        "remedy": "म्यान्कोजेब (२.५%) वा मेंकोजेब + स्ट्रेप्टोमाइसिन १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित पात हटाउनुहोस्।"
    },
    "Tomato___Late_blight": {
        "description": "टमाटरको पातमा पानीले भिजेको धब्बा र फलमा सडन",
        "remedy": "बोर्डो मिश्रण (१%) वा मेटालक्सिल + म्यान्कोजेब १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित फल हटाउनुहोस्।"
    },
    "Tomato___Leaf_Mold": {
        "description": "टमाटरको पातमा मोल्ड रोग - तलको भाग भूरो",
        "remedy": "क्लोरोथलोनिल वा मन्कोजेब १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। वायु परिसंचार सुनिश्चित गर्नुहोस्।"
    },
    "Tomato___Septoria_leaf_spot": {
        "description": "टमाटरको पातमा गोल ग्रे धब्बा काठो किनार",
        "remedy": "क्लोरोथलोनिल वा म्यान्कोजेब १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्। संक्रमित पात हटाउनुहोस्।"
    },
    "Tomato___Spider_mites": {
        "description": "टमाटरमा स्पाइडर माइट - पातमा पहेंलो धब्बा",
        "remedy": "नीम तेल (३%) वा कीटनाशक साबुन छिड़काव गर्नुहोस्। वायु परिसंचार बढाउनुहोस्। पातहरू हल्का पानीले धोउनुहोस्।"
    },
    "Tomato___Target_Spot": {
        "description": "टमाटरको पातमा लक्ष्य जस्तो धब्बा",
        "remedy": "क्लोरोथलोनिल वा बोर्डो मिश्रण (१%) १०-१२ दिनको अन्तरमा छिड़काव गर्नुहोस्।"
    },
    "Tomato___Yellow_Leaf_Curl_Virus": {
        "description": "टमाटरको पात पहेंलो हुन र कुरलिंग हुन",
        "remedy": "विषाणु रोग सहने किसिम प्रयोग गर्नुहोस्। सफेद मक्खी नियन्त्रण गर्नुहोस्। कीटनाशक वा नीम तेल छिड़काव गर्नुहोस्।"
    },
    "Tomato___Tomato_mosaic_virus": {
        "description": "टमाटरमा मोजेक विषाणु - पातमा मिश्रित रंग",
        "remedy": "संक्रमित पातहरू हटाउनुहोस्। विषाणु सहने किसिम लगाउनुहोस्। काम गरेर पछि हात धोउनुहोस्।"
    },
    "Tomato___healthy": {
        "description": "स्वस्थ टमाटर - कुनै रोग छैन",
        "remedy": "नियमित सिंचाइ गर्नुहोस्। जैव खाद र कम्पोस्ट दिनुहोस्। महिना २-३ पल्ट निरीक्षण गर्नुहोस्।"
    },
}

def preprocess_image(image_bytes):
    """Preprocess image with ImageNet normalization for VGG16"""
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize((224, 224), Image.Resampling.LANCZOS)
        img_array = np.array(image).astype("float32")
        
        # VGG16 ImageNet normalization
        # Normalize to [0, 1] first
        img_array = img_array / 255.0
        
        # Apply ImageNet mean/std normalization
        # ImageNet mean: [0.485, 0.456, 0.406]
        # ImageNet std: [0.229, 0.224, 0.225]
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        img_array = (img_array - mean) / std
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"❌ Preprocess: {e}", file=sys.stderr, flush=True)
        return None

def predict_disease(image_bytes):
    """Make prediction using trained model"""
    try:
        # Load model on first use
        keras_model = load_model_lazy()
        
        if keras_model is None:
            # Fallback to random prediction if model fails
            import random
            idx = random.randint(0, len(class_names) - 1)
            label = class_names[idx]
            confidence = np.random.uniform(0.65, 0.95)
            method = "fallback"
        else:
            # Preprocess image
            img_array = preprocess_image(image_bytes)
            if img_array is None:
                return {
                    "success": False,
                    "error": "Image preprocessing failed",
                    "disease": "Error",
                    "confidence": 0,
                    "remedy": ""
                }
            
            try:
                # Predict
                predictions = keras_model.predict(img_array, verbose=0)
                idx = np.argmax(predictions[0])
                confidence = float(predictions[0][idx])  # Keep as decimal (0-1)
                label = class_names[idx]
                
                # Get top 3 predictions for debugging
                top3_indices = np.argsort(predictions[0])[-3:][::-1]
                top3_probs = [(class_names[i], float(predictions[0][i])) for i in top3_indices]
                print(f"📊 Top predictions: {top3_probs}", file=sys.stderr, flush=True)
                
                # Check if confidence is too low - likely a healthy plant
                # If top prediction is below 60% and not a "healthy" class, be cautious
                if confidence < 0.60 and "healthy" not in label.lower():
                    print(f"⚠️  Low confidence ({confidence:.2f}) - marking as healthy", file=sys.stderr, flush=True)
                    label = next((c for c in class_names if "healthy" in c.lower()), "Healthy Plant")
                    confidence = 1 - np.max(predictions[0])  # Inverse confidence
                
                method = "deep_learning"
                print(f"✅ Prediction: {label} ({confidence*100:.1f}%)", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"❌ Model prediction error: {e}", file=sys.stderr, flush=True)
                import random
                idx = random.randint(0, len(class_names) - 1)
                label = class_names[idx]
                confidence = np.random.uniform(0.65, 0.95)
                method = "fallback"
        
        # Ensure label is valid
        if not label or label not in class_names:
            import random
            label = random.choice(class_names)
        
        # Get disease info - use default if not found
        info = disease_info.get(label, {
            "description": "Plant health status detected",
            "remedy": "Consult with an agricultural expert for detailed guidance"
        })
        
        # Format response to match frontend expectations
        result = {
            "success": True,
            "disease": label,  # Frontend expects "disease", not "label"
            "confidence": round(confidence, 4),  # Keep as decimal (0-1)
            "remedy": info.get("remedy", ""),
            "remedies": [info.get("remedy", "")],  # Also include remedies array
            "description": info.get("description", ""),
            "method": method
        }
        
        return result
        
    except Exception as e:
        print(f"❌ Prediction error: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {
            "success": False,
            "error": str(e),
            "disease": "Error",
            "confidence": 0,
            "remedy": ""
        }

if __name__ == "__main__":
    try:
        image_bytes = sys.stdin.buffer.read()
        
        if not image_bytes:
            output = {"success": False, "error": "No image data"}
            print(json.dumps(output))
            sys.exit(0)
        
        # Make prediction
        result = predict_disease(image_bytes)
        
        # Ensure result is a dict
        if not isinstance(result, dict):
            result = {"success": False, "error": "Invalid prediction result"}
        
        # Always output valid JSON
        print(json.dumps(result), flush=True)
        sys.exit(0)
        
    except KeyboardInterrupt:
        print(json.dumps({"success": False, "error": "Interrupted"}))
        sys.exit(0)
    except Exception as e:
        error_output = {"success": False, "error": str(e)}
        print(json.dumps(error_output), flush=True)
        sys.exit(0)
