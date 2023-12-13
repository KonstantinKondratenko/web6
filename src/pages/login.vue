<script setup lang="ts">
	import { ref } from "vue";
	import { IUser } from "./admin.vue";
	import axios from "axios";
	import { FwbButton } from "flowbite-vue";

	const brokerID = ref<number>(1);

	async function login() {
		let broker = (await axios.get<IUser>(`http://localhost:3001/brokers/${brokerID.value}`)).data;
		if (broker) 
		{
			sessionStorage.setItem("broker", JSON.stringify(broker));
			window.location.href = "/broker";
		} 
		else 
		{
			alert("Нет пользователя с таким ID");
		}
	}
</script>

<template>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;500;700&family=Ubuntu&family=Ubuntu+Mono&display=swap" rel="stylesheet">

	<div class="login-box">
		<h1>Вход</h1>
		<input type="number" placeholder="Your ID" v-model="brokerID" />
		<fwb-button color="blue" outline @click="login()">Login</fwb-button>
	</div>
</template>

<style scoped>
	* {
		font-family: 'Ubuntu Mono', sans-serif;
		
	}

	.login-box {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;		
	}

	input {
		margin-bottom: 10px;
	}

	h1 {
		margin-bottom: 15px;
	}
	
</style>