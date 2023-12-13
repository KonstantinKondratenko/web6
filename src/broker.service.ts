import axios from "axios";
import { IBroker } from "./interfaces";


export async function updateBrokerData() {
  const brokerID = JSON.parse(sessionStorage.getItem("broker")).id || 1;
  let broker = (await axios.get<IBroker>(`http://localhost:3001/brokers/${brokerID}`)).data;
  sessionStorage.setItem("broker", JSON.stringify(broker));
}

export async function sendRequest(URL: string, method: string, body: any){
  const response = await fetch(URL, {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body)
  }).then(
    (res) => res.json()
  )

  return response;
}