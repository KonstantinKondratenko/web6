<script setup lang="ts">
	import { ref, watch } from "vue";
	import axios from "axios";
	import { FwbCard } from 'flowbite-vue'

	import { IStock, IBuyStock, IBroker } from "../interfaces.ts";

	const brokers = ref<IBroker[]>([]);
	const stocks = ref<IStock[] | null>([]);
	const timer = ref<any>(1);

	watch(
		() => timer.value,
		async () => {
			brokers.value = (await axios.get<IBroker[]>("http://localhost:3001/brokers")).data;
			stocks.value = (await axios.get<IStock[]>("http://localhost:3001/stocks")).data;

			setTimeout(() => {
				timer.value++;
			}, 1000);

			brokers.value.forEach((user) => {
				user.stocks.forEach((stock) => {
					const actualPrice = stocks.value?.find((item) => item.id === stock.id);

					stock.profit =
						stock.prices.length * (actualPrice?.price || 0) -
						stock.prices.reduce((sum, cur) => sum + cur.price, 0);
				});
			});
		},
		{ immediate: true }
	);
</script>

<template>	
		<link rel="preconnect" href="https://fonts.googleapis.com">
		<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
		<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;500;700&family=Ubuntu&family=Ubuntu+Mono&display=swap" rel="stylesheet">

		
		<div class="broker-list">
		<template v-for="user in brokers" :key="user.id">
			<fwb-card>
				<div class="broker-info">
					<p class="broker-name">Брокер: {{ user.name }}</p>
					<p class="broker-balance">Баланс: ${{ user.balance.toFixed(3) }}</p>
				</div>

				<p class="stocks-header" v-if="user.stocks.reduce((num, stocks) => num + stocks.prices.length, 0)">
					Акции:
				</p>

				<div class="stock-info" v-for="stock in user.stocks.filter((item) => item.prices.length)" :key="stock.id">

					<p>
						{{ stocks?.find((item) => item.id === stock.id)?.label }}
						(Количество: {{ stock.prices.length }})
					</p>

					<p :class="(stock.profit || 0) > 0 ? 'display-profit': 'display-loss'">
						<span>{{ (stock.profit || 0) > 0 ? 'Прибыль' : 'Убыток' }}</span>
						${{ stock.profit?.toFixed(3) || 0 }}
					</p>
				</div>
			</fwb-card>
		</template>
		</div>
</template>

<style scoped>
	* {
		
		font-family: 'Ubuntu Mono', sans-serif;
		font-size: 20px;
	}

	.broker-list {
		display: flex;
  	justify-content: space-around;
		gap: 15px;
	}

	.broker-info {
		display: flex;
		justify-content: center;
		flex-direction: column;
		align-items: center;

		margin-bottom: 10px;
		padding: 15px;
	}

	.stocks-header {
		text-align: center;
		font-size: 25px;
	}

	.broker-name,
	.broker-balance {
		font-size: 30px;
	}

	.display-profit {
		color:green;
	}

	.display-loss {
		color:red;
	}

</style>
