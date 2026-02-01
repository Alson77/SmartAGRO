import React, { useState } from 'react';
import FarmerLayout from '../../components/Layout/FarmerLayout';
import { Camera, Upload, AlertCircle, CheckCircle, X } from 'lucide-react';

interface DetectionResult {
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
  prevention: string;
}

interface RecentScan {
  _id: string;
  disease: string;
  confidence: number;
  severity: string;
  treatment: string;
  prevention: string;
  imageUrl?: string;
  scannedAt: string;
}

const CropDiseaseDetection: React.FC = () => {
  const [showAllScans, setShowAllScans] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [viewingScan, setViewingScan] = useState<RecentScan | null>(null);
  const [viewedScanImage, setViewedScanImage] = useState<string | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const resultRef = React.useRef<HTMLDivElement>(null);

  // Python FastAPI endpoint (runs on port 8000)
  const AI_API_URL = 'http://localhost:8000/api/predict';
  const [error, setError] = useState<string | null>(null);

  // Load recent scans on mount
  React.useEffect(() => {
    fetchRecentScans();
  }, []);

  const fetchRecentScans = async () => {
    try {
      const token = localStorage.getItem('krishisathi_token');
      const response = await fetch('http://localhost:5000/api/disease/recent?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentScans(data);
      }
    } catch (error) {
      console.error('Failed to load recent scans:', error);
    }
  };

  const saveDetectionResult = async (detectionData: DetectionResult, imageData: string | null) => {
    try {
      const token = localStorage.getItem('krishisathi_token');
      const formData = new FormData();
      
      // Add detection data
      formData.append('disease', detectionData.disease);
      formData.append('confidence', detectionData.confidence.toString());
      formData.append('severity', detectionData.severity);
      formData.append('treatment', detectionData.treatment);
      formData.append('prevention', detectionData.prevention);
      
      // Add image if available
      if (imageData) {
        // Convert base64 to blob
        const base64Response = await fetch(imageData);
        const blob = await base64Response.blob();
        formData.append('image', blob, 'crop-image.jpg');
      }
      
      await fetch('http://localhost:5000/api/disease/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      // Refresh recent scans
      fetchRecentScans();
    } catch (error) {
      console.error('Failed to save detection:', error);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setViewingScan(null); // Clear viewing scan state for new analysis
    setViewedScanImage(null); // Clear viewed scan image
    
    try {
      // Convert base64 to Blob
      const base64Response = await fetch(selectedImage);
      const blob = await base64Response.blob();
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', blob, 'crop-image.jpg');
      
      // Send to Python FastAPI backend
      const res = await fetch(AI_API_URL, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to get detection result (${res.status})`);
      }
      
      let data: any;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error('Failed to parse JSON from AI API response:', parseErr);
        throw parseErr;
      }
      
      // Transform Python response to match frontend interface
      // Python returns: { label, confidence, description, remedy }
      const disease = data.label || 'Unknown';
      const confidence = Math.round((data.confidence || 0) * 100);
      
      // Determine severity based on disease name
      let severity = 'Mild';
      if (disease.toLowerCase().includes('healthy')) {
        severity = 'Healthy';
      } else if (disease.toLowerCase().includes('blight') || 
                 disease.toLowerCase().includes('rot') || 
                 disease.toLowerCase().includes('virus')) {
        severity = 'Severe';
      }
      
      const detectionResult = {
        disease: disease.replace(/_/g, ' '),
        confidence: confidence,
        severity: severity,
        treatment: data.remedy || 'Consult with agricultural experts.',
        prevention: data.description || 'No detailed information available.'
      };
      
      setResult(detectionResult);
      
      // Save to backend with image
      await saveDetectionResult(detectionResult, selectedImage);
      
      // Scroll to results after a brief delay to ensure rendering
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
      
    } catch (err: any) {
      setError(`Could not connect to AI model: ${err.message}. Make sure the Python server is running on port 8000.`);
    }
    
    setIsLoading(false);
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setResult(null);
    setViewingScan(null);
    setViewedScanImage(null);
  };

  const viewScanDetails = (scan: RecentScan) => {
    setResult({
      disease: scan.disease,
      confidence: scan.confidence,
      severity: scan.severity,
      treatment: scan.treatment,
      prevention: scan.prevention
    });
    setViewingScan(scan);
    // Load saved image in separate state (not selectedImage)
    setViewedScanImage(scan.imageUrl ? `http://localhost:5000${scan.imageUrl}` : null);
    // Clear the upload section
    setSelectedImage(null);
    
    // Scroll to results
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  return (
    <FarmerLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Crop Disease Detection</h1>
          <p className="text-gray-600">Upload a photo of your crop to detect diseases and get treatment recommendations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h2>
              
              {!selectedImage ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Camera className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-900">
                      Upload crop image
                    </p>
                    <p className="text-gray-500">
                      Drag and drop or click to select
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 cursor-pointer transition-colors"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Selected crop"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={resetAnalysis}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={analyzeImage}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Analyze Image
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Photo Guidelines</h3>
              <ul className="space-y-2 text-blue-800">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  Take photos in good lighting conditions
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  Focus on affected leaves or plant parts
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  Avoid blurry or low-quality images
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  Include multiple angles if possible
                </li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg p-4 mb-4">
                {error}
              </div>
            )}
            {result ? (
              <div ref={resultRef} className="space-y-4 scroll-mt-6">
                {/* Viewing indicator */}
                {viewingScan && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex items-center gap-3">
                    <span className="text-blue-600 text-sm font-medium flex-1">
                      📋 Viewing saved scan from {new Date(viewingScan.scannedAt).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <button
                      onClick={resetAnalysis}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm font-medium transition-colors"
                    >
                      New Analysis
                    </button>
                  </div>
                )}

                {/* Main Result Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
                  {/* Header with colored background based on severity */}
                  <div className={`p-6 ${
                    result.severity === 'Healthy' || result.severity === 'None'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : result.severity === 'Mild'
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-red-500 to-pink-500'
                  }`}>
                    <div className="flex items-start justify-between gap-4">
                      {/* Image Preview */}
                      {(selectedImage || viewedScanImage) && (
                        <button
                          onClick={() => setImageModalOpen(true)}
                          className="flex-shrink-0 w-32 h-32 relative group cursor-pointer"
                        >
                          <img
                            src={selectedImage || viewedScanImage || ''}
                            alt="Analyzed crop"
                            className="w-full h-full object-cover rounded-xl border-4 border-white shadow-lg transition-transform hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all flex items-center justify-center">
                            <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 bg-black bg-opacity-50 px-2 py-1 rounded">
                              Click to enlarge
                            </span>
                          </div>
                        </button>
                      )}
                      
                      {/* Result Info */}
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={resetAnalysis}
                          className="float-right p-2 bg-white bg-opacity-20 hover:bg-red-500 text-white rounded-lg transition-colors backdrop-blur-sm"
                          title="Close results"
                        >
                          <X className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-lg">
                            <Camera className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-white text-sm font-medium opacity-90">AI Detection Result</span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{result.disease}</h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <p className="text-white text-sm font-medium">Confidence: {result.confidence}%</p>
                          </div>
                          <div className="bg-white px-3 py-1 rounded-full">
                            <p className={`text-sm font-bold ${
                              result.severity === 'Healthy' || result.severity === 'None' ? 'text-green-700' :
                              result.severity === 'Mild' ? 'text-yellow-700' : 'text-red-700'
                            }`}>
                              {result.severity === 'Healthy' || result.severity === 'None' ? 'Healthy Plant' : `${result.severity} Severity`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Detection Confidence</span>
                      <span className="text-xs font-bold text-gray-900">{result.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          result.confidence >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          result.confidence >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-r from-orange-400 to-red-600'
                        }`}
                        style={{ width: `${result.confidence}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Treatment & Prevention Info */}
                  <div className="p-6 space-y-4">
                    {/* Treatment Section */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-500 p-2 rounded-lg shadow-md flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-orange-900 mb-2 text-lg">🩺 Treatment & Remedy</h4>
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{result.treatment}</p>
                        </div>
                      </div>
                    </div>

                    {/* Prevention Section */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-500 p-2 rounded-lg shadow-md flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-green-900 mb-2 text-lg">🛡️ Description & Prevention</h4>
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{result.prevention}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="px-6 pb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500 p-2 rounded-full flex-shrink-0">
                          <AlertCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-blue-900 text-sm font-semibold mb-1">⚠️ Important Disclaimer</p>
                          <p className="text-blue-800 text-sm leading-relaxed">
                            This is an AI-powered diagnosis using machine learning. For accurate treatment 
                            and serious plant health issues, please consult with agricultural experts, 
                            extension officers, or certified plant pathologists.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center py-12">
                  <Camera className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                  <p className="text-gray-500">Upload and analyze an image to see results here</p>
                </div>
              </div>
            )}

            {/* History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span>📋</span>
                  Recent Scans
                </h2>
                <p className="text-xs text-gray-500 mt-1">Click on any scan to view details</p>
              </div>
              {recentScans.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {(showAllScans ? recentScans : recentScans.slice(0, 2)).map((scan) => (
                      <button
                        key={scan._id}
                        onClick={() => viewScanDetails(scan)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all cursor-pointer border-2 border-transparent group"
                      >
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-gray-900 truncate group-hover:text-green-700 transition-colors">
                            {scan.disease}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(scan.scannedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            scan.severity === 'Healthy' || scan.severity === 'None'
                              ? 'bg-green-100 text-green-800'
                              : scan.severity === 'Mild'
                              ? 'bg-yellow-100 text-yellow-800'
                              : scan.severity === 'Moderate'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {scan.severity === 'None' ? 'Healthy' : scan.severity}
                          </span>
                          <span className="text-gray-400 group-hover:text-green-600 transition-colors">
                            →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {recentScans.length > 2 && !showAllScans && (
                    <button
                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      onClick={() => setShowAllScans(true)}
                    >
                      View All
                    </button>
                  )}
                  {showAllScans && (
                    <button
                      className="mt-3 px-4 py-2 bg-gray-200 text-green-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      onClick={() => setShowAllScans(false)}
                    >
                      Show Less
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No recent scans yet</p>
                  <p className="text-xs mt-1">Upload and analyze an image to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {imageModalOpen && (selectedImage || viewedScanImage) && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fadeIn"
            onClick={() => setImageModalOpen(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              <button
                onClick={() => setImageModalOpen(false)}
                className="absolute -top-4 -right-4 p-3 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors shadow-2xl z-10"
              >
                <X className="h-6 w-6" />
              </button>
              <img
                src={selectedImage || viewedScanImage || ''}
                alt="Analyzed crop - Full size"
                className="w-full h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
                Click outside to close
              </div>
            </div>
          </div>
        )}
      </div>
    </FarmerLayout>
  );
};

export default CropDiseaseDetection;