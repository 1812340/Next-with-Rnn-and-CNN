"use client";
import React, { useEffect, useState } from "react";
import Head from "next/head";

const HomePage: React.FC = () => {
  const [pngFile, setPngFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    message?: string;
    output?: string;
    error?: string;
    predicted_disease?: string;
    confidence?: number;
    image?: string;
    imageConfidence?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePngUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setPngFile(file);
      console.log("Image uploaded:", file.name);
    } else {
      setPngFile(null);
      console.log("No file selected");
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("in handle audio =>" + file);

    if (file && file.type === "audio/wav") {
      setAudioFile(file);
    } else {
      alert("Please upload a valid WAV file");
    }
  };
  const handleSubmit = async () => {
    if (!pngFile || !audioFile) {
      alert("Please upload both PNG and WAV files");
      return;
    }

    setIsLoading(true);
    console.log("Starting submission process");

    const formData = new FormData();
    formData.append("png", pngFile);
    formData.append("audio", audioFile);

    try {
      console.log("Sending request to /api/predict");
      const response = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      });

      console.log("Received response:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Parsed response data:", data);

      if (data.prediction) {
        setResult({
          predicted_disease: data.prediction.audio_diagnosis.predicted_disease,
          confidence: data.prediction.audio_diagnosis.confidence,
          imageConfidence: data.prediction.image_diagnosis.confidence,
          image: data.prediction.image_diagnosis.predicted_disease,
        });
        console.log("Result set in state:", data.prediction);
      } else {
        setResult({ error: "No prediction in response" });
      }
    } catch (error) {
      console.error("Error in submission process:", error);
      setResult({ error: "An unknown error occurred" });
    } finally {
      setIsLoading(false);
      console.log("Submission process completed");
    }
  };

  useEffect(() => {
    console.log("Result state updated:", result);
  }, [result]);

  console.log("Component rendering, current result:", result);

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/LC.png')" }}
    >
      <Head>
        <title>Respiratory Disease Prediction</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white bg-opacity-80 rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">File Upload</h1>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PNG File
            </label>
            <input
              type="file"
              accept="image/*"
              // accept=".png"
              onChange={handlePngUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {pngFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {pngFile.name}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload WAV File
            </label>
            <input
              type="file"
              accept=".wav"
              onChange={handleAudioUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
            />
            {audioFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {audioFile.name}
              </p>
            )}
          </div>
          {result && (
            <div
              key={JSON.stringify(result)}
              className="mt-4 p-3 bg-gray-100 rounded"
            >
              <h2 className="font-semibold">Prediction Result:</h2>
              {result.error ? (
                <p className="text-red-500">{result.error}</p>
              ) : result.predicted_disease && result.confidence ? (
                <>
                  <p>Predicted Disease: {result.predicted_disease}</p>
                  {/* <p>Confidence: {result.confidence}%</p> */}
                  <p>Image Disease: {result.image}</p>
                  {/* <p>Image Confidence: {result.imageConfidence}%</p> */}

                  {/* <p>Confidence: {(result.confidence * 100).toFixed(4)}%</p> */}
                </>
              ) : (
                <p>No prediction available</p>
              )}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !pngFile || !audioFile}
            className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Predict"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
