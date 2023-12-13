<script setup lang="ts">
	import { ref, watchEffect, watch } from "vue";
	import { io } from "socket.io-client";
	import axios from "axios";

	import { FwbModal, FwbButton } from "flowbite-vue";
	import { IStock } from "../interfaces.ts";
	import { updateBrokerData, sendRequest } from "../services/broker.service.ts";

	// @ts-ignore
	import { Chart, registerables } from "chart.js";

	const GraphicsConfig: Record<number, any> = {};

	Chart.register(...registerables);
	const canvasElement = ref<HTMLCanvasElement>();
	const graphic = ref<Chart>(null);
	const currentStockId = ref<number>(0);

	watch
	(
		() => canvasElement.value,
		function callback() {
			if(canvasElement.value) {
				const canvasContext = canvasElement.value.getContext("2d");
				if(canvasContext) {
					graphic.current = new Chart(canvasContext, GraphicsConfig[currentStockId.value]);
				}
			}
		}
	);

	watch(
		() => currentStockId.value, 
		function callback() {
			const chartConfig = GraphicsConfig[currentStockId.value];
			if(chartConfig) {
				//graphic.current.destroy();
				const canvasContext = canvasElement.value?.getContext("2d");
				if (canvasContext) {
					graphic.current = new Chart(canvasContext, chartConfig);
				}
			}
	});

	const stocks = ref<IStock[]>([]);
	const socket = ref<any>();

	const stockCount = ref<number>(1);
	const isShowModal = ref<boolean>(false);

	const balance = ref<number>(JSON.parse(sessionStorage.getItem("broker")).balance ?? 0);
	const name = ref<string>(JSON.parse(sessionStorage.getItem("broker")).name || "");
	const counts = ref<any>({});
	const date = ref<string>('');

	JSON.parse(sessionStorage.getItem("broker") || "{}").stocks.forEach((stock: any) => {
		counts.value[stock.id] = stock.prices.length;
	});

	function closeModal() {
		isShowModal.value = false;
	}

	function showModal(stockID : number) {
		currentStockId.value = stockID;
		isShowModal.value = true;
	}

	function pushDot(stockId: number, price: number, date: string) {
		const chart = GraphicsConfig[stockId];
		if (!chart){
			return;
		}

		chart.data.datasets[0].data.push(price);
		chart.data.labels?.push(date);
		if(stockId === currentStockId.value) {
			graphic.current.update();
		}
	}


	async function setNewDate() {
    const newDate = (await axios.get('http://localhost:3001/auction/date')).data;
		if(newDate)
		{
			date.value = newDate;
		}
		else {
			date.value = (await axios.get('http://localhost:3001/settings')).data.startDate;
		}
  }

	watchEffect(async () => {
		stocks.value = (await axios.get<IStock[]>("http://localhost:3001/stocks")).data;
		const newSocket = io("http://localhost:3002", { transports: ["websocket"] });
		socket.value = newSocket;

		socket.value?.open();
		socket.value?.emit("updatePrices");
		socket.value?.on("updatePrices", async (data: any) => {
			stocks.value = data;
			await setNewDate();

			data.forEach((stock: any) => {
				if(!GraphicsConfig[stock.id]) {
					GraphicsConfig[stock.id] = {
						type: "line",
						data: {
							labels: [],
							datasets: [
									{
										data: [],
										fill: true,
										label: `Цена акции ${stock.label}`,
										borderColor: "rgb(89, 28, 147)",
									},
								],
							},
					};
				}
				pushDot(stock.id, stock.price, date.value)
			});

		});
	});

	async function buyStock(stock: IStock) {

		const response = await sendRequest("http://localhost:3001/auction/buy", "POST", {
			brokerId: JSON.parse(sessionStorage.getItem("broker")).id || 1,
			stockId: stock.id,
			price: stock.price,
			count: stockCount.value,
		});

		
		if (stockCount.value < 0)
		{
			alert("Нельзя купить отрицательное количество акций!")
		}
		else if(response.reason) {
			alert(response.reason);
		}
		else {
			// update broker data
			await updateBrokerData();

			JSON.parse(sessionStorage.getItem("broker")).stocks.forEach((stock: any) => {
				counts.value[stock.id] = stock.prices.length;
			});
			balance.value = JSON.parse(sessionStorage.getItem("broker")).balance;
		}
	}

	async function sellStock(stock: IStock) {
		const response = await sendRequest("http://localhost:3001/auction/sell", "POST", {
			brokerId: JSON.parse(sessionStorage.getItem("broker")).id || 1,
			stockId: stock.id,
			price: stock.price,
			count: stockCount.value,
		});
		
		if(response.reason) {
			alert(response.reason);
		}
		else {
			await updateBrokerData();

			JSON.parse(sessionStorage.getItem("broker") || "{}").stocks.forEach((stock: any) => {
				counts.value[stock.id] = stock.prices.length;
			});
			balance.value = JSON.parse(sessionStorage.getItem("broker")).balance;
		}
	}

	function calculateProfit(id: number) {
			let broker = JSON.parse(sessionStorage.getItem("broker"));

			broker.stocks.forEach((stock) => {
					const actualPrice = stocks.value?.find((item) => item.id === stock.id);

					stock.profit =
						stock.prices.length * (actualPrice?.price || 0) -
						stock.prices.reduce((sum, cur) => sum + cur.price, 0);
				});
			return broker.stocks.find((item) => item.id === id).profit;
	};


</script>

<template>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;500;700&family=Ubuntu&family=Ubuntu+Mono&display=swap" rel="stylesheet">

	<div class="broker-info">
		<p>User name: {{ name }} </p>
		<p> Balance ${{ balance.toFixed(3) }}</p>
		<p>Date: {{ date ? date : "Stock doesn't start." }}</p>
	</div>


	<template v-for="stock in stocks" :key="stock.id">
			<div class="stock-info">
				<p class="stock-label">Акции {{ stock.label }}</p>
				<div>
					<p>Количество: {{ counts[stock.id] || 0 }}</p>
					<p>Текущая цена: ${{ stock.price }}</p>
					<p :class="(calculateProfit(stock.id) || 0) > 0 ? 'display-profit': 'display-loss'">
						<span>{{ (calculateProfit(stock.id) || 0) > 0 ? 'Прибыль' : 'Убыль' }}</span>
						${{ calculateProfit(stock.id).toFixed(3) || 0 }}
					</p>
				</div>
				<div class="buttons">
					<fwb-button color="blue" outline @click="buyStock(stock)">Buy</fwb-button>
					<fwb-button color="blue" outline @click="sellStock(stock)">Sell</fwb-button>
					<input type="number" placeholder="count" v-model="stockCount" />
					<fwb-button color="blue" outline @click="showModal(stock.id)"> View trand </fwb-button>
				</div>
			</div>
	</template>
	
	<fwb-modal v-if="isShowModal" @close="closeModal">
		<template #header> <h1>Trand</h1> </template>
		<template #body>
			<canvas ref="canvasElement"></canvas>
		</template>
	</fwb-modal>
</template>

<style scoped>
	* {
		font-family: 'Ubuntu Mono', sans-serif;
		font-size: 20px;
	}

	.broker-info{
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		padding: 30px 30px 30px 30px;

	}
	.display-profit {
		color:green;
	}

	.display-loss {
		color:red;
	}

	button {
		margin: 10px;
	}

	.stock-label {
		font-size: 26px;
	}

	.broker-info {
		font-size: 26px;
	}

	.stock-info {
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;

		padding-bottom: 15px;
	}

</style>