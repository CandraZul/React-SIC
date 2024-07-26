import React, { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import './App.css'; // Impor file CSS di sini
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from 'marked';

const API_KEY = 'AIzaSyAvtn3iiv_jbb8hGaebF7W9TH3BFuMe4-U'; // Ganti dengan API Key Anda
const MODEL_NAME = 'gemini-pro'; // Nama model yang sesuai

const genAI = new GoogleGenerativeAI(API_KEY);
const modelAi = genAI.getGenerativeModel({ model: MODEL_NAME });

// scaler
const mean = [86.74567328, 37.79309835, 94.06563951];
const std = [24.19804726, 1.43529533, 3.70562491];

const scaleData = (data) => {
  return data.map((value, index) => (value - mean[index]) / std[index]);
};

const DEVICE_NAME = 'ESP32';
const BLE_SERVICE = '19b10000-e8f2-537e-4f6c-d104768a1214';
const BPM_CHARACTERISTIC = '19b10001-e8f2-537e-4f6c-d104768a1214';
const SPO2_CHARACTERISTIC = '19b10002-e8f2-537e-4f6c-d104768a1214';
const TEMP_CHARACTERISTIC = '19b10003-e8f2-537e-4f6c-d104768a1214';

const App = () => {
  // const [connected, setConnected] = useState(false);
  const [bpm, setBpm] = useState(0);
  const [spo2, setSpo2] = useState(0);
  const [temp, setTemp] = useState(0);
  const [healthStatus, setHealthStatus] = useState("-");
  // const [averageBpm, setAverageBpm] = useState(0);
  // const [averageSpo2, setAverageSpo2] = useState(0);
  // const [averageTemp, setAverageTemp] = useState(0);
  const [symptoms, setSymptoms] = useState("");
  const [recommendation, setRecommendation] = useState(""); // Tambahkan state baru untuk rekomendasi

  const [mlModel, setMlModel] = useState(null);
  const [generateStatus, setGenerateStatus] = useState("");

  useEffect(() => {
    const loadMlModel = async () => {
      try {
        const mlModel = await tf.loadLayersModel(`${process.env.PUBLIC_URL}/model.json`); // Load TensorFlow.js model
        setMlModel(mlModel);
        console.log('Model loaded successfully');
      } catch (error) {
        console.error('Failed to load model:', error);
      }
    };
    loadMlModel();
  }, []);

  const connectToDevice = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: DEVICE_NAME }],
        optionalServices: [BLE_SERVICE]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(BLE_SERVICE);
      const bpmCharacteristic = await service.getCharacteristic(BPM_CHARACTERISTIC);
      const spo2Characteristic = await service.getCharacteristic(SPO2_CHARACTERISTIC);
      const tempCharacteristic = await service.getCharacteristic(TEMP_CHARACTERISTIC);

      // setConnected(true);

      // Start reading data
      setInterval(async () => {
        const bpmValue = await bpmCharacteristic.readValue();
        const spo2Value = await spo2Characteristic.readValue();
        const tempValue = await tempCharacteristic.readValue();

        const bpm = new DataView(bpmValue.buffer).getUint16(0, true);
        const spo2 = new DataView(spo2Value.buffer).getUint16(0, true);
        const temp = new Float32Array(tempValue.buffer)[0];

        setBpm(bpm);
        setSpo2(spo2);
        setTemp(temp);

        const scaledData = scaleData([bpm, temp, spo2]);
        const inputData = tf.tensor2d([scaledData], [1, scaledData.length]);
        const prediction = mlModel.predict(inputData);
        const predClass = (await prediction.argMax(1).data())[0];
        const status = predClass === 0 ? 'Sehat' : predClass === 1 ? 'Sakit Ringan' : 'Sakit Parah';

        setHealthStatus(status);

      }, 1000);
    } catch (error) {
      console.error('Failed to connect or read data:', error);
      // setConnected(false);
    }
  };

  const generateRecommendation = async (bpm, spo2, temperature, symptoms) => {
    setGenerateStatus("Memuat Rekomendasi ...");
    const prompt = `Buatkan saran untuk pasien yang memiliki detak jantung per menit: ${bpm}, saturasi oksigen: ${spo2}, dan temperature: ${temperature} dengan gejala ${symptoms}`;
    
    try {
      const result = await modelAi.generateContent(prompt);
      const response = result.response;
      const text = await response.text(); 
      setRecommendation(marked(text)); // Set hasil rekomendasi ke state
    } catch (error) {
      console.error('Error during recommendation generation:', error);
      setRecommendation('Error generating recommendation');
    }
    setGenerateStatus("");
  };

  return (
    <div>
      <header></header>
      <main>
        <button onClick={connectToDevice} class="bg-radius" >Connect to Device</button>
          <article class="d-flex no-wrap" id="iot-value">
              <section class="d-flex card-iot">
                  <div class="circles">
                      <div class="circle small"></div>
                      <div class="circle large"></div>
                  </div>
                  <div class="special-respon">
                      <span class="material-symbols-outlined">ecg_heart</span>
                      <h3>Detak Jantung Per Menit</h3>
                      <h1>{bpm}</h1>
                  </div>
              </section>
              <section class="d-flex card-iot">
                  <div class="circles">
                      <div class="circle small"></div>
                      <div class="circle large"></div>
                  </div>
                  <div class="special-respon">
                      <span class="material-symbols-outlined">spo2</span>
                      <h3>Saturasi Oksigen</h3>
                      <h1>{spo2}</h1>
                  </div>
              </section>
              <section class="d-flex card-iot">
                  <div class="circles">
                      <div class="circle small"></div>
                      <div class="circle large"></div>
                  </div>
                  <div class="special-respon">
                      <span class="material-symbols-outlined">thermostat</span>
                      <h3>Temperature (C)</h3>
                      <h1>{temp}</h1>
                  </div>
              </section>
          </article>
          <article class="d-flex no-wrap" id="iot-value">
            <section class="d-flex card-iot">
                  <div class="circles">
                      <div class="circle small"></div>
                      <div class="circle large"></div>
                  </div>
                  <div class="special-respon">
                      <span class="material-symbols-outlined">ecg_heart</span>
                      <h3>Tingkat Kesehatan</h3>
                      <h1>{healthStatus}</h1>
                  </div>
              </section>
          </article>
          <article id="input-container">
              <section>
                  <div id="form-gejala">
                      <div class="d-flex special-respon">
                          <label for="gejala-user" class="bg-radius bg-white"><i>Masukkan gejala yang kamu alami</i></label>
                          <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} id="gejala-user" name="gejala-user" placeholder="Ketikkan gejalamu di sini..."  class="bg-radius bg-white" cols="50"></textarea>
                      </div>
                      <button onClick={() => generateRecommendation(bpm, spo2, temp, symptoms)} class="bg-radius">BERIKAN SARAN</button>
                      <p>{generateStatus}</p>
                  </div>
              </section>
          </article>
          <article id="ai-result">
              <section id="ai-result-title" class="d-flex">
                  <div class="d-flex" id="triple-circle">
                      <div class="circle cc-color"></div>
                      <div class="circle cc-color"></div>
                      <div class="circle cc-color"></div>
                  </div>
                  <div class="title bg-white">
                      <p>Hasil</p>
                  </div>
              </section>
              <section id="ai-result-text" class="bg-radius bg-white" dangerouslySetInnerHTML={{ __html: recommendation }} ></section>
          </article>
      </main>
      <footer></footer>
    </div>
  );
};

export default App;
